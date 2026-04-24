// ============================================================
// extracurricularService.js – Extracurricular activities
// ============================================================
// Fetches the activities a student has joined, along with
// the activity details (name, day, time).
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// getStudentActivities(studentId)
// ----------------------------------------------------------
// Looks up all activities a specific student has joined by
// querying student_activity and joining extracurricular_activity.
//
// Parameters:
//   studentId (string/UUID) – the app user ID of the student.
//                              Pass null to get activities for
//                              the currently logged-in student.
//
// Returns an array of objects, each with:
//   - activity name, description, day_of_week, time_slot
//   - joined_at
//
// Usage:
//   // For the logged-in student (get their own id first):
//   const { data, error } = await getStudentActivities(myUserId);
//
//   // A parent viewing their child's activities:
//   const { data, error } = await getStudentActivities(childId);
// ----------------------------------------------------------
export async function getStudentActivities(studentId) {
  try {
    // Query student_activity and pull in the related activity details.
    // Supabase lets us do this with the "select" syntax:
    //   "*, extracurricular_activity(*)"
    // This is like a SQL JOIN – it fetches the activity row too.
    const { data, error } = await supabase
      .from("student_activity")
      .select("id, joined_at, extracurricular_activity ( id, name, description, day_of_week, time_slot )")
      .eq("student_user_id", studentId)
      .order("joined_at", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    // Flatten the result so it's easier to use in the UI.
    // Before:  { id, joined_at, extracurricular_activity: { name, ... } }
    // After:   { id, joined_at, name, description, day_of_week, time_slot }
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
