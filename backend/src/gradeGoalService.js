// ============================================================
// gradeGoalService.js – Grade Goal Setter
// ============================================================
// Tells a student what average they need on remaining
// assignments to reach a target grade in a classroom.
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// calculateGradeGoal(classroomId, targetPercentage)
// ----------------------------------------------------------
// Calls calculate_grade_goal(student_id, classroom_id, target_percentage).
// We first look up the logged-in student's app user ID via
// get_my_profile(), then pass it to the RPC.
//
// Returns an object with:
//   - possible                   (boolean) – can the target be reached?
//   - remaining_assignments      (number)  – how many are left
//   - needed_average_percentage  (number)  – avg % needed on remaining
//   - current_average            (number)  – current avg %
//   - target_percentage          (number)  – the goal you set
//
// If there are no remaining assignments, returns:
//   - possible: false
//   - message: "No remaining assignments in this classroom"
//
// Parameters:
//   classroomId       (string/UUID) – which classroom
//   targetPercentage  (number)      – desired final average (e.g. 85)
//
// Usage:
//   const { data, error } = await calculateGradeGoal(classroomId, 85);
//   if (error) { Alert.alert("Error", error); return; }
//   if (data.possible) {
//     Alert.alert("You need " + data.needed_average_percentage + "% avg");
//   } else {
//     Alert.alert("Target not reachable");
//   }
// ----------------------------------------------------------
export async function calculateGradeGoal(classroomId, targetPercentage) {
  try {
    // Step 1: Get the current student's app user ID.
    // We call get_my_profile() so we don't have to pass the ID manually.
    const { data: profileData, error: profileError } =
      await supabase.rpc("get_my_profile");

    if (profileError) {
      return { data: null, error: profileError.message };
    }

    // get_my_profile returns an array; grab the first row
    const profile = Array.isArray(profileData)
      ? profileData[0]
      : profileData;

    if (!profile || !profile.id) {
      return { data: null, error: "Could not find your profile. Are you logged in?" };
    }

    // Step 2: Call the grade goal RPC with the student's ID.
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
