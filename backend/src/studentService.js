// ============================================================
// studentService.js – Dashboard & class report for students
// ============================================================
// These functions call the SQL RPC functions we created in
// functions.sql. The student must be logged in first (via
// auth.js login) so that Supabase knows who they are.
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// getStudentDashboard()
// ----------------------------------------------------------
// Calls get_student_dashboard() RPC.
// Returns an object with:
//   - attendance_percentage  (number)
//   - average_grade          (number)
//   - unpaid_fees_count      (number)
//   - upcoming_events        (array of event objects)
//
// Usage from a React Native screen:
//   const { data, error } = await getStudentDashboard();
//   if (error) { Alert.alert("Error", error); return; }
//   setDashboard(data);
// ----------------------------------------------------------
export async function getStudentDashboard() {
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

// ----------------------------------------------------------
// getStudentClassReport(classroomId)
// ----------------------------------------------------------
// Calls get_student_class_report(classroom_id) RPC.
// Returns an object with:
//   - attendance_percentage  (number)  – for that class only
//   - average_grade          (number)  – for that class only
//   - assignments            (array)   – individual grades
//
// Parameters:
//   classroomId (string/UUID) – the ID of the classroom
//
// Usage:
//   const { data, error } = await getStudentClassReport(classroomId);
// ----------------------------------------------------------
export async function getStudentClassReport(classroomId) {
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
