// ============================================================
// api.js – Frontend API adapter
// ============================================================
// This is the ONLY file that talks to Supabase from the frontend.
// Every screen imports functions from here instead of calling
// Supabase directly.
//
// All functions return: { data, error }
//   - Check error first: if (error) { show error }
//   - Then use data
//
// The backend SQL functions (RPC) do the heavy lifting.
// This file just calls them and handles errors.
// ============================================================

import { supabase } from "./supabaseClient";

// ----------------------------------------------------------
// Helper: Convert username to fake demo email
// ----------------------------------------------------------
// Supabase Auth needs an email, but our app uses usernames.
// We convert:  "arjun_s"  →  "arjun_s@campuspocket.demo"
export function usernameToEmail(username) {
  return `${username}@campuspocket.demo`;
}

// ----------------------------------------------------------
// AUTH FUNCTIONS
// ----------------------------------------------------------

/**
 * Log in with username and password.
 * Converts the username to a fake email behind the scenes.
 */
export async function loginUser(username, password) {
  try {
    const email = usernameToEmail(username);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Log out the current user.
 */
export async function logoutUser() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { message: "Logged out" }, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------
// PROFILE
// ----------------------------------------------------------

/**
 * Get the logged-in user's app profile (name, role, school, etc.).
 * Calls the get_my_profile() SQL RPC function.
 */
export async function fetchCurrentProfile() {
  try {
    const { data, error } = await supabase.rpc("get_my_profile");

    if (error) {
      return { data: null, error: error.message };
    }

    // RPC returns an array; grab the first row
    const profile = Array.isArray(data) ? data[0] : data;
    return { data: profile, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------
// STUDENT FUNCTIONS
// ----------------------------------------------------------

/**
 * Gather all data needed for AI insights in one call.
 * Returns a flat payload with attendance, grades, classrooms, activities, and assignments.
 */
export async function fetchStudentInsightData(studentUserId) {
  try {
    // Fetch all data in parallel
    const [dashResult, classResult, actResult, subResult] = await Promise.all([
      fetchStudentDashboard(),
      fetchStudentClassrooms(studentUserId),
      fetchStudentActivities(studentUserId),
      // Get all assignment submissions with titles
      supabase
        .from("assignment_submission")
        .select("percentage, marks_obtained, assignment ( title, classroom_id, max_marks, classroom ( subject ) )")
        .eq("student_user_id", studentUserId),
    ]);

    const dash = dashResult.data || {};
    const classrooms = classResult.data || [];
    const activities = actResult.data || [];
    const submissions = subResult.data || [];

    // Build assignment list with subject names
    const assignments = submissions.map((s) => ({
      title: s.assignment?.title || "Unknown",
      percentage: s.percentage,
      subject: s.assignment?.classroom?.subject || "",
    }));

    return {
      data: {
        attendance_percentage: dash.attendance_percentage ?? dash.overall_attendance_percentage ?? 0,
        average_grade: dash.average_grade ?? dash.overall_average_grade ?? 0,
        classrooms,
        activities,
        assignments,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get the student dashboard summary.
 * Returns: attendance %, average grade, unpaid fees, upcoming events.
 */
export async function fetchStudentDashboard() {
  try {
    const { data, error } = await supabase.rpc("get_student_dashboard");

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get the student's enrolled classrooms WITH per-class stats.
 * Fetches memberships, attendance, and submissions, then computes stats client-side.
 */
export async function fetchStudentClassrooms(studentUserId) {
  try {
    // 1. Get classroom memberships
    const { data: memberships, error: memErr } = await supabase
      .from("classroom_membership")
      .select("classroom_id, classroom ( id, name, subject )")
      .eq("student_user_id", studentUserId);

    if (memErr) return { data: null, error: memErr.message };

    // 2. Get attendance records (joined with class_session to get classroom_id)
    const { data: attendance } = await supabase
      .from("attendance")
      .select("status, class_session ( classroom_id )")
      .eq("student_user_id", studentUserId);

    // 3. Get assignment submissions (joined with assignment to get classroom_id)
    const { data: submissions } = await supabase
      .from("assignment_submission")
      .select("percentage, assignment ( classroom_id )")
      .eq("student_user_id", studentUserId);

    // 4. Group attendance by classroom
    const attendByClass = {};
    (attendance || []).forEach((a) => {
      const cid = a.class_session?.classroom_id;
      if (!cid) return;
      if (!attendByClass[cid]) attendByClass[cid] = { total: 0, present: 0 };
      attendByClass[cid].total++;
      if (a.status === "present" || a.status === "late") attendByClass[cid].present++;
    });

    // 5. Group grades by classroom
    const gradesByClass = {};
    (submissions || []).forEach((s) => {
      const cid = s.assignment?.classroom_id;
      if (!cid) return;
      if (!gradesByClass[cid]) gradesByClass[cid] = { sum: 0, count: 0 };
      gradesByClass[cid].sum += s.percentage;
      gradesByClass[cid].count++;
    });

    // 6. Build result
    const classrooms = (memberships || []).map((row) => {
      const cid = row.classroom_id;
      const att = attendByClass[cid];
      const grd = gradesByClass[cid];
      return {
        classroom_id: cid,
        class_name: row.classroom?.name || "Unknown",
        subject: row.classroom?.subject || "",
        attendance_percentage: att && att.total > 0
          ? Math.round((att.present / att.total) * 10000) / 100
          : null,
        average_grade: grd && grd.count > 0
          ? Math.round((grd.sum / grd.count) * 100) / 100
          : null,
      };
    });

    return { data: classrooms, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get a class report for one classroom.
 * Returns: attendance %, average grade, and assignment list.
 */
export async function fetchStudentClassReport(classroomId) {
  try {
    const { data, error } = await supabase.rpc("get_student_class_report", {
      p_classroom_id: classroomId,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------
// PARENT FUNCTIONS
// ----------------------------------------------------------

/**
 * Get the parent dashboard — summary for each linked child.
 */
export async function fetchParentDashboard() {
  try {
    const { data, error } = await supabase.rpc("get_parent_dashboard");

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get a detailed report for one linked child.
 */
export async function fetchParentChildReport(childId) {
  try {
    const { data, error } = await supabase.rpc("get_parent_child_report", {
      p_child_id: childId,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get per-classroom stats for a child (attendance %, grade, rank).
 * Used by parent child detail screen.
 */
export async function fetchChildClassroomStats(childId, classroomId) {
  try {
    // Attendance in this classroom
    const { data: attendance } = await supabase
      .from("attendance")
      .select("status, class_session!inner ( classroom_id )")
      .eq("student_user_id", childId)
      .eq("class_session.classroom_id", classroomId);

    const totalAtt = (attendance || []).length;
    const presentAtt = (attendance || []).filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    const attendancePct = totalAtt > 0
      ? Math.round((presentAtt / totalAtt) * 10000) / 100
      : null;

    // Grades in this classroom
    const { data: submissions } = await supabase
      .from("assignment_submission")
      .select("percentage, marks_obtained, assignment!inner ( classroom_id, title, max_marks )")
      .eq("student_user_id", childId)
      .eq("assignment.classroom_id", classroomId);

    const grades = submissions || [];
    const avgGrade = grades.length > 0
      ? Math.round(grades.reduce((s, g) => s + g.percentage, 0) / grades.length * 100) / 100
      : null;

    // Rank: get all students' averages in this classroom
    const { data: allMembers } = await supabase
      .from("classroom_membership")
      .select("student_user_id")
      .eq("classroom_id", classroomId);

    let rank = null;
    let rankedStudentCount = 0;
    if (avgGrade != null && allMembers && allMembers.length > 0) {
      const studentIds = new Set(allMembers.map((m) => m.student_user_id));

      // Fetch ALL submissions for this classroom (avoid .in() + !inner conflict)
      const { data: allSubs } = await supabase
        .from("assignment_submission")
        .select("student_user_id, percentage, assignment!inner ( classroom_id )")
        .eq("assignment.classroom_id", classroomId);

      // Filter to only members of this classroom (in JS, reliable)
      const memberSubs = (allSubs || []).filter((s) => studentIds.has(s.student_user_id));

      // Group by student and compute averages
      const avgByStudent = {};
      memberSubs.forEach((s) => {
        if (!avgByStudent[s.student_user_id]) avgByStudent[s.student_user_id] = { sum: 0, count: 0 };
        avgByStudent[s.student_user_id].sum += s.percentage;
        avgByStudent[s.student_user_id].count++;
      });

      const averages = Object.entries(avgByStudent)
        .map(([id, v]) => ({ id, avg: v.sum / v.count }))
        .sort((a, b) => b.avg - a.avg);

      rankedStudentCount = averages.length;
      const idx = averages.findIndex((a) => a.id === childId);
      if (idx >= 0) rank = idx + 1;
    }

    return {
      data: {
        attendance_percentage: attendancePct,
        average_grade: avgGrade,
        rank,
        total_students: rankedStudentCount || allMembers?.length || 0,
        assignments: grades.map((g) => ({
          title: g.assignment?.title,
          marks_obtained: g.marks_obtained,
          max_marks: g.assignment?.max_marks,
          percentage: g.percentage,
        })),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Link a child to the current parent account.
 * Requires the child's exact username and password.
 */
export async function linkChild(childUsername, childPassword) {
  try {
    const { data, error } = await supabase.rpc("link_child_to_parent", {
      p_child_username: childUsername,
      p_child_password: childPassword,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------
// EXTRA FEATURE FUNCTIONS
// ----------------------------------------------------------

/**
 * Get school calendar events, sorted by date (soonest first).
 */
export async function fetchCampusEvents() {
  try {
    const { data, error } = await supabase
      .from("campus_event")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Fetch ALL calendar data: events, assignment deadlines, fee deadlines.
 * Returns a unified array of { date, title, type, description }.
 * Types: 'holiday', 'event', 'exam', 'assignment', 'fee', 'sports'
 */
export async function fetchCalendarData(studentUserId) {
  try {
    // Fetch all sources in parallel
    const [eventsRes, assignmentsRes, feesRes] = await Promise.all([
      supabase.from("campus_event").select("*"),
      supabase.from("assignment").select("id, title, due_date, classroom ( name, subject )"),
      studentUserId
        ? supabase.from("fees").select("id, title, due_date, paid, amount").eq("student_user_id", studentUserId)
        : Promise.resolve({ data: [] }),
    ]);

    const calendarItems = [];

    // Campus events → calendar items
    (eventsRes.data || []).forEach((ev) => {
      calendarItems.push({
        id: ev.id,
        date: ev.event_date,
        title: ev.title,
        description: ev.description || "",
        type: ev.event_type || "event", // holiday, exam, sports, event
      });
    });

    // Assignment deadlines → calendar items
    (assignmentsRes.data || []).forEach((a) => {
      if (a.due_date) {
        calendarItems.push({
          id: a.id,
          date: a.due_date,
          title: a.title,
          description: a.classroom?.subject ? `${a.classroom.subject}` : "",
          type: "assignment",
        });
      }
    });

    // Fee deadlines → calendar items
    (feesRes.data || []).forEach((f) => {
      if (f.due_date) {
        calendarItems.push({
          id: f.id,
          date: f.due_date,
          title: f.title,
          description: f.paid ? "Paid" : `Due: Rs.${f.amount}`,
          type: "fee",
          paid: f.paid,
        });
      }
    });

    return { data: calendarItems, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get digital circulars / school notices, newest first.
 */
export async function fetchCirculars() {
  try {
    const { data, error } = await supabase
      .from("digital_circular")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get a student's extracurricular activities.
 * Joins student_activity with extracurricular_activity to get details.
 */
export async function fetchStudentActivities(studentId) {
  try {
    const { data, error } = await supabase
      .from("student_activity")
      .select(
        "id, joined_at, extracurricular_activity ( id, name, description, day_of_week, time_slot )"
      )
      .eq("student_user_id", studentId)
      .order("joined_at", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Flatten the nested join result for easier use in screens
    const activities = data.map((row) => ({
      id: row.extracurricular_activity?.id,
      name: row.extracurricular_activity?.name,
      description: row.extracurricular_activity?.description,
      day_of_week: row.extracurricular_activity?.day_of_week,
      time_slot: row.extracurricular_activity?.time_slot,
      joined_at: row.joined_at,
    }));

    return { data: activities, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Get the anonymized leaderboard for a classroom.
 * Shows rank and average grade, but NO student names.
 */
export async function fetchLeaderboard(classroomId) {
  try {
    const { data, error } = await supabase.rpc(
      "get_anonymized_leaderboard",
      { p_classroom_id: classroomId }
    );

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Calculate what the student needs to score to reach a target grade.
 * First gets the student's ID, then calls the RPC.
 */
export async function fetchGradeGoal(classroomId, targetPercentage) {
  try {
    // Step 1: Get the current student's app user ID
    const { data: profileData, error: profileError } =
      await supabase.rpc("get_my_profile");

    if (profileError) {
      return { data: null, error: profileError.message };
    }

    const profile = Array.isArray(profileData) ? profileData[0] : profileData;

    if (!profile || !profile.id) {
      return { data: null, error: "Could not find your profile" };
    }

    // Step 2: Call the grade goal calculator RPC
    const { data, error } = await supabase.rpc("calculate_grade_goal", {
      p_student_id: profile.id,
      p_classroom_id: classroomId,
      p_target_percentage: targetPercentage,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
