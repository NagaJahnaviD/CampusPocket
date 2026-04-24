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
 * Get the student's enrolled classrooms.
 * Queries classroom_membership joined with classroom.
 */
export async function fetchStudentClassrooms(studentUserId) {
  try {
    const { data, error } = await supabase
      .from("classroom_membership")
      .select("classroom_id, classroom ( id, name, subject )")
      .eq("student_user_id", studentUserId);

    if (error) {
      return { data: null, error: error.message };
    }

    // Flatten the nested join
    const classrooms = (data || []).map((row) => ({
      classroom_id: row.classroom_id,
      class_name: row.classroom?.name || "Unknown",
      subject: row.classroom?.subject || "",
    }));

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
