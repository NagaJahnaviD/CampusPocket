-- ============================================================
-- Campus Pocket – Row Level Security (RLS) Policies
-- ============================================================
-- Run AFTER schema.sql and functions.sql.
-- ============================================================

-- ----------------------------------------------------------
-- Enable RLS on every table
-- ----------------------------------------------------------
ALTER TABLE public."user"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_link      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_membership     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_session            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submission    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_event             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_circular         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracurricular_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activity         ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------
-- "user" table policies
-- ----------------------------------------------------------

-- Users can read their own profile.
CREATE POLICY user_select_own ON public."user"
    FOR SELECT USING (auth_user_id = auth.uid());

-- Parents can also read the profiles of their linked children.
CREATE POLICY user_select_children ON public."user"
    FOR SELECT USING (
        public.is_parent_of(public.get_current_app_user_id(), id)
    );

-- Users can update their own profile.
CREATE POLICY user_update_own ON public."user"
    FOR UPDATE USING (auth_user_id = auth.uid());


-- ----------------------------------------------------------
-- parent_student_link policies
-- ----------------------------------------------------------

-- Parents can see their own links.
CREATE POLICY psl_select ON public.parent_student_link
    FOR SELECT USING (parent_user_id = public.get_current_app_user_id());

-- Parents can insert links (via link_child_to_parent RPC).
CREATE POLICY psl_insert ON public.parent_student_link
    FOR INSERT WITH CHECK (parent_user_id = public.get_current_app_user_id());


-- ----------------------------------------------------------
-- classroom policies
-- ----------------------------------------------------------

-- Users can see classrooms that belong to their school.
CREATE POLICY classroom_select ON public.classroom
    FOR SELECT USING (school_id = public.get_current_school_id());


-- ----------------------------------------------------------
-- classroom_membership policies
-- ----------------------------------------------------------

-- Students can see their own memberships.
CREATE POLICY cm_select_student ON public.classroom_membership
    FOR SELECT USING (student_user_id = public.get_current_app_user_id());

-- Parents can see memberships of their linked children.
CREATE POLICY cm_select_parent ON public.classroom_membership
    FOR SELECT USING (
        public.get_current_app_user_role() = 'parent'
        AND public.is_parent_of(public.get_current_app_user_id(), student_user_id)
    );


-- ----------------------------------------------------------
-- class_session policies
-- ----------------------------------------------------------

-- Users can see sessions for classrooms in their school.
CREATE POLICY cs_select ON public.class_session
    FOR SELECT USING (
        classroom_id IN (
            SELECT id FROM public.classroom
            WHERE school_id = public.get_current_school_id()
        )
    );


-- ----------------------------------------------------------
-- attendance policies
-- ----------------------------------------------------------

-- Students see their own attendance.
CREATE POLICY att_select_student ON public.attendance
    FOR SELECT USING (student_user_id = public.get_current_app_user_id());

-- Parents see attendance of linked children.
CREATE POLICY att_select_parent ON public.attendance
    FOR SELECT USING (
        public.get_current_app_user_role() = 'parent'
        AND public.is_parent_of(public.get_current_app_user_id(), student_user_id)
    );


-- ----------------------------------------------------------
-- assignment policies
-- ----------------------------------------------------------

-- Users can see assignments for classrooms in their school.
CREATE POLICY asg_select ON public.assignment
    FOR SELECT USING (
        classroom_id IN (
            SELECT id FROM public.classroom
            WHERE school_id = public.get_current_school_id()
        )
    );


-- ----------------------------------------------------------
-- assignment_submission policies
-- ----------------------------------------------------------

-- Students see their own submissions.
CREATE POLICY sub_select_student ON public.assignment_submission
    FOR SELECT USING (student_user_id = public.get_current_app_user_id());

-- Parents see submissions of linked children.
CREATE POLICY sub_select_parent ON public.assignment_submission
    FOR SELECT USING (
        public.get_current_app_user_role() = 'parent'
        AND public.is_parent_of(public.get_current_app_user_id(), student_user_id)
    );


-- ----------------------------------------------------------
-- fees policies
-- ----------------------------------------------------------

-- Students see their own fees.
CREATE POLICY fees_select_student ON public.fees
    FOR SELECT USING (student_user_id = public.get_current_app_user_id());

-- Parents see fees of linked children.
CREATE POLICY fees_select_parent ON public.fees
    FOR SELECT USING (
        public.get_current_app_user_role() = 'parent'
        AND public.is_parent_of(public.get_current_app_user_id(), student_user_id)
    );


-- ----------------------------------------------------------
-- campus_event policies
-- ----------------------------------------------------------

-- Everyone in the same school can see events.
CREATE POLICY event_select ON public.campus_event
    FOR SELECT USING (school_id = public.get_current_school_id());


-- ----------------------------------------------------------
-- digital_circular policies
-- ----------------------------------------------------------

-- Everyone in the same school can see circulars.
CREATE POLICY circular_select ON public.digital_circular
    FOR SELECT USING (school_id = public.get_current_school_id());


-- ----------------------------------------------------------
-- extracurricular_activity policies
-- ----------------------------------------------------------

-- Everyone in the same school can see activities.
CREATE POLICY eca_select ON public.extracurricular_activity
    FOR SELECT USING (school_id = public.get_current_school_id());


-- ----------------------------------------------------------
-- student_activity policies
-- ----------------------------------------------------------

-- Students see their own activity enrollments.
CREATE POLICY sa_select_student ON public.student_activity
    FOR SELECT USING (student_user_id = public.get_current_app_user_id());

-- Parents see activity enrollments of linked children.
CREATE POLICY sa_select_parent ON public.student_activity
    FOR SELECT USING (
        public.get_current_app_user_role() = 'parent'
        AND public.is_parent_of(public.get_current_app_user_id(), student_user_id)
    );

-- Students can join activities.
CREATE POLICY sa_insert_student ON public.student_activity
    FOR INSERT WITH CHECK (
        student_user_id = public.get_current_app_user_id()
        AND public.get_current_app_user_role() = 'student'
    );
