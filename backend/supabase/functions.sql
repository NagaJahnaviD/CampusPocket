-- ============================================================
-- Campus Pocket – Helper & RPC Functions
-- ============================================================
-- Run AFTER schema.sql.
-- ============================================================

-- ----------------------------------------------------------
-- HELPER FUNCTIONS (used inside RLS policies & RPC functions)
-- ----------------------------------------------------------

-- Returns the app "user".id for the currently logged-in auth user.
CREATE OR REPLACE FUNCTION public.get_current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id
    FROM public."user"
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

-- Returns 'student' or 'parent' for the logged-in user.
CREATE OR REPLACE FUNCTION public.get_current_app_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role
    FROM public."user"
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

-- Returns the school_id of the logged-in user.
CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT school_id
    FROM public."user"
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

-- Checks if a parent is linked to a particular child.
CREATE OR REPLACE FUNCTION public.is_parent_of(p_parent_user_id UUID, p_child_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.parent_student_link
        WHERE parent_user_id = p_parent_user_id
          AND student_user_id = p_child_user_id
    );
$$;


-- ----------------------------------------------------------
-- RPC FUNCTIONS (called from the front-end via supabase.rpc())
-- ----------------------------------------------------------

-- ========================
-- get_my_profile()
-- ========================
-- Returns the logged-in user's profile row.
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public."user"
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT *
    FROM public."user"
    WHERE auth_user_id = auth.uid();
$$;


-- ========================
-- get_student_dashboard()
-- ========================
-- Returns attendance %, average grade, unpaid fees count,
-- and upcoming events for the logged-in student.
CREATE OR REPLACE FUNCTION public.get_student_dashboard()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id      UUID;
    v_school_id    UUID;
    v_attendance   NUMERIC;
    v_avg_grade    NUMERIC;
    v_unpaid_fees  INT;
    v_events       JSON;
BEGIN
    -- Get the current student's app user id & school
    SELECT id, school_id INTO v_user_id, v_school_id
    FROM public."user"
    WHERE auth_user_id = auth.uid() AND role = 'student';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not a student or not logged in';
    END IF;

    -- Attendance %  =  (PRESENT + LATE) / Total Sessions * 100
    SELECT
        CASE WHEN COUNT(*) = 0 THEN 0
             ELSE ROUND(
                 COUNT(*) FILTER (WHERE status IN ('present','late'))::NUMERIC
                 / COUNT(*)::NUMERIC * 100, 2)
        END
    INTO v_attendance
    FROM public.attendance
    WHERE student_user_id = v_user_id;

    -- Average grade = AVG(percentage) from assignment_submission
    SELECT COALESCE(ROUND(AVG(percentage), 2), 0)
    INTO v_avg_grade
    FROM public.assignment_submission
    WHERE student_user_id = v_user_id;

    -- Unpaid fees count
    SELECT COUNT(*)::INT
    INTO v_unpaid_fees
    FROM public.fees
    WHERE student_user_id = v_user_id AND paid = false;

    -- Next 5 upcoming events for the student's school
    SELECT COALESCE(json_agg(e), '[]'::JSON)
    INTO v_events
    FROM (
        SELECT id, title, event_date, event_type
        FROM public.campus_event
        WHERE school_id = v_school_id AND event_date >= CURRENT_DATE
        ORDER BY event_date
        LIMIT 5
    ) e;

    RETURN json_build_object(
        'attendance_percentage', v_attendance,
        'average_grade',        v_avg_grade,
        'unpaid_fees_count',    v_unpaid_fees,
        'upcoming_events',      v_events
    );
END;
$$;


-- ========================
-- get_student_class_report(classroom_id)
-- ========================
-- Returns attendance & grades for the logged-in student in one classroom.
CREATE OR REPLACE FUNCTION public.get_student_class_report(p_classroom_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id    UUID;
    v_attendance NUMERIC;
    v_avg_grade  NUMERIC;
    v_grades     JSON;
BEGIN
    SELECT id INTO v_user_id
    FROM public."user"
    WHERE auth_user_id = auth.uid() AND role = 'student';

    -- Attendance in this classroom only
    SELECT
        CASE WHEN COUNT(*) = 0 THEN 0
             ELSE ROUND(
                 COUNT(*) FILTER (WHERE a.status IN ('present','late'))::NUMERIC
                 / COUNT(*)::NUMERIC * 100, 2)
        END
    INTO v_attendance
    FROM public.attendance a
    JOIN public.class_session cs ON cs.id = a.class_session_id
    WHERE a.student_user_id = v_user_id
      AND cs.classroom_id = p_classroom_id;

    -- Average grade in this classroom
    SELECT COALESCE(ROUND(AVG(sub.percentage), 2), 0)
    INTO v_avg_grade
    FROM public.assignment_submission sub
    JOIN public.assignment asg ON asg.id = sub.assignment_id
    WHERE sub.student_user_id = v_user_id
      AND asg.classroom_id = p_classroom_id;

    -- Individual assignment grades
    SELECT COALESCE(json_agg(g), '[]'::JSON)
    INTO v_grades
    FROM (
        SELECT asg.title, sub.marks_obtained, asg.max_marks, sub.percentage
        FROM public.assignment_submission sub
        JOIN public.assignment asg ON asg.id = sub.assignment_id
        WHERE sub.student_user_id = v_user_id
          AND asg.classroom_id = p_classroom_id
        ORDER BY sub.submitted_at
    ) g;

    RETURN json_build_object(
        'attendance_percentage', v_attendance,
        'average_grade',        v_avg_grade,
        'assignments',          v_grades
    );
END;
$$;


-- ========================
-- get_parent_dashboard()
-- ========================
-- Returns a summary for each linked child.
CREATE OR REPLACE FUNCTION public.get_parent_dashboard()
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id UUID;
    v_children  JSON;
BEGIN
    SELECT id INTO v_parent_id
    FROM public."user"
    WHERE auth_user_id = auth.uid() AND role = 'parent';

    IF v_parent_id IS NULL THEN
        RAISE EXCEPTION 'Not a parent or not logged in';
    END IF;

    SELECT COALESCE(json_agg(child_info), '[]'::JSON)
    INTO v_children
    FROM (
        SELECT
            u.id            AS child_id,
            u.full_name     AS child_name,
            -- Attendance %
            (SELECT CASE WHEN COUNT(*) = 0 THEN 0
                         ELSE ROUND(COUNT(*) FILTER (WHERE status IN ('present','late'))::NUMERIC
                              / COUNT(*)::NUMERIC * 100, 2) END
             FROM public.attendance WHERE student_user_id = u.id
            ) AS attendance_percentage,
            -- Average grade
            (SELECT COALESCE(ROUND(AVG(percentage), 2), 0)
             FROM public.assignment_submission WHERE student_user_id = u.id
            ) AS average_grade,
            -- Unpaid fees
            (SELECT COUNT(*)::INT
             FROM public.fees WHERE student_user_id = u.id AND paid = false
            ) AS unpaid_fees_count
        FROM public.parent_student_link psl
        JOIN public."user" u ON u.id = psl.student_user_id
        WHERE psl.parent_user_id = v_parent_id
    ) child_info;

    RETURN json_build_object('children', v_children);
END;
$$;


-- ========================
-- get_parent_child_report(child_id)
-- ========================
-- Detailed report for a specific child (only if parent is linked).
CREATE OR REPLACE FUNCTION public.get_parent_child_report(p_child_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id   UUID;
    v_attendance  NUMERIC;
    v_avg_grade   NUMERIC;
    v_fees        JSON;
    v_classrooms  JSON;
BEGIN
    SELECT id INTO v_parent_id
    FROM public."user"
    WHERE auth_user_id = auth.uid() AND role = 'parent';

    -- Make sure this parent is actually linked to this child
    IF NOT public.is_parent_of(v_parent_id, p_child_id) THEN
        RAISE EXCEPTION 'You are not linked to this child';
    END IF;

    -- Overall attendance
    SELECT CASE WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND(COUNT(*) FILTER (WHERE status IN ('present','late'))::NUMERIC
                     / COUNT(*)::NUMERIC * 100, 2) END
    INTO v_attendance
    FROM public.attendance WHERE student_user_id = p_child_id;

    -- Overall average grade
    SELECT COALESCE(ROUND(AVG(percentage), 2), 0)
    INTO v_avg_grade
    FROM public.assignment_submission WHERE student_user_id = p_child_id;

    -- Fee summary
    SELECT COALESCE(json_agg(f), '[]'::JSON)
    INTO v_fees
    FROM (
        SELECT title, amount, paid, due_date
        FROM public.fees WHERE student_user_id = p_child_id
        ORDER BY due_date
    ) f;

    -- Classrooms the child belongs to
    SELECT COALESCE(json_agg(c), '[]'::JSON)
    INTO v_classrooms
    FROM (
        SELECT cl.id, cl.name, cl.subject
        FROM public.classroom_membership cm
        JOIN public.classroom cl ON cl.id = cm.classroom_id
        WHERE cm.student_user_id = p_child_id
    ) c;

    RETURN json_build_object(
        'attendance_percentage', v_attendance,
        'average_grade',        v_avg_grade,
        'fees',                 v_fees,
        'classrooms',           v_classrooms
    );
END;
$$;


-- ========================
-- link_child_to_parent(child_username, child_password)
-- ========================
-- A parent calls this to link a student to their account.
-- Requires the child's exact username and password for verification.
-- NOTE: We verify the password by attempting a sign-in via Supabase Auth
-- inside a server-side function. For a simpler seed/demo approach we
-- look up the child by username, then verify their password through
-- auth.uid() matching. In production you'd call the Auth API.
-- For this simple version we trust that the front-end verified the
-- password before calling this RPC (see createAuthUsers.js).
CREATE OR REPLACE FUNCTION public.link_child_to_parent(
    p_child_username TEXT,
    p_child_password TEXT   -- received but verified on the client / edge function
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_parent_id  UUID;
    v_child      RECORD;
BEGIN
    -- Get the parent's app user id
    SELECT id INTO v_parent_id
    FROM public."user"
    WHERE auth_user_id = auth.uid() AND role = 'parent';

    IF v_parent_id IS NULL THEN
        RAISE EXCEPTION 'Only parents can link children';
    END IF;

    -- Look up the child by username
    SELECT id, role INTO v_child
    FROM public."user"
    WHERE username = p_child_username;

    IF v_child.id IS NULL THEN
        RAISE EXCEPTION 'No student found with that username';
    END IF;

    IF v_child.role <> 'student' THEN
        RAISE EXCEPTION 'That user is not a student';
    END IF;

    -- Insert the link (will fail on duplicate due to UNIQUE constraint)
    INSERT INTO public.parent_student_link (parent_user_id, student_user_id)
    VALUES (v_parent_id, v_child.id);

    RETURN json_build_object(
        'success', true,
        'message', 'Child linked successfully'
    );
END;
$$;


-- ========================
-- get_anonymized_leaderboard(classroom_id)
-- ========================
-- Shows rank + average grade per student WITHOUT revealing names.
-- The current student can see their own position highlighted.
CREATE OR REPLACE FUNCTION public.get_anonymized_leaderboard(p_classroom_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_board   JSON;
BEGIN
    SELECT id INTO v_user_id
    FROM public."user"
    WHERE auth_user_id = auth.uid();

    SELECT COALESCE(json_agg(row_data), '[]'::JSON)
    INTO v_board
    FROM (
        SELECT
            RANK() OVER (ORDER BY AVG(sub.percentage) DESC) AS rank,
            ROUND(AVG(sub.percentage), 2)                   AS average_grade,
            (cm.student_user_id = v_user_id)                AS is_me
        FROM public.classroom_membership cm
        JOIN public.assignment_submission sub
             ON sub.student_user_id = cm.student_user_id
        JOIN public.assignment asg
             ON asg.id = sub.assignment_id
             AND asg.classroom_id = p_classroom_id
        WHERE cm.classroom_id = p_classroom_id
        GROUP BY cm.student_user_id
        ORDER BY average_grade DESC
    ) row_data;

    RETURN json_build_object('leaderboard', v_board);
END;
$$;


-- ========================
-- calculate_grade_goal(student_id, classroom_id, target_percentage)
-- ========================
-- Tells a student how many marks they need on remaining assignments
-- to reach a target average percentage in a classroom.
CREATE OR REPLACE FUNCTION public.calculate_grade_goal(
    p_student_id         UUID,
    p_classroom_id       UUID,
    p_target_percentage  NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    v_total_assignments INT;
    v_completed         INT;
    v_current_sum       NUMERIC;
    v_remaining         INT;
    v_needed_avg        NUMERIC;
BEGIN
    -- Total assignments in this classroom
    SELECT COUNT(*)::INT INTO v_total_assignments
    FROM public.assignment
    WHERE classroom_id = p_classroom_id;

    -- Completed submissions & sum of percentages
    SELECT COUNT(*)::INT, COALESCE(SUM(percentage), 0)
    INTO v_completed, v_current_sum
    FROM public.assignment_submission sub
    JOIN public.assignment asg ON asg.id = sub.assignment_id
    WHERE sub.student_user_id = p_student_id
      AND asg.classroom_id = p_classroom_id;

    v_remaining := v_total_assignments - v_completed;

    IF v_remaining <= 0 THEN
        RETURN json_build_object(
            'possible', false,
            'message', 'No remaining assignments in this classroom'
        );
    END IF;

    -- needed_avg = (target * total - current_sum) / remaining
    v_needed_avg := ROUND(
        (p_target_percentage * v_total_assignments - v_current_sum)
        / v_remaining, 2
    );

    RETURN json_build_object(
        'possible',                  v_needed_avg <= 100 AND v_needed_avg >= 0,
        'remaining_assignments',     v_remaining,
        'needed_average_percentage', v_needed_avg,
        'current_average',           CASE WHEN v_completed = 0 THEN 0
                                          ELSE ROUND(v_current_sum / v_completed, 2) END,
        'target_percentage',         p_target_percentage
    );
END;
$$;
