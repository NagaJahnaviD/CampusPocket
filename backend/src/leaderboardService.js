// ============================================================
// leaderboardService.js – Anonymized class leaderboard
// ============================================================
// Shows how students rank by average grade in a classroom
// WITHOUT revealing anyone's name. The logged-in student can
// see which rank is theirs via the "is_me" flag.
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// getAnonymizedLeaderboard(classroomId)
// ----------------------------------------------------------
// Calls the get_anonymized_leaderboard(classroom_id) RPC.
//
// Returns an object with a "leaderboard" array. Each entry has:
//   - rank           (number)  – position in the class
//   - average_grade  (number)  – that student's average %
//   - is_me          (boolean) – true if this row is YOU
//
// Names are NOT included – privacy is preserved.
//
// Parameters:
//   classroomId (string/UUID) – the classroom to rank
//
// Usage:
//   const { data, error } = await getAnonymizedLeaderboard(classroomId);
//   if (error) { Alert.alert("Error", error); return; }
//   // data.leaderboard is the array
//   setLeaderboard(data.leaderboard);
// ----------------------------------------------------------
export async function getAnonymizedLeaderboard(classroomId) {
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
