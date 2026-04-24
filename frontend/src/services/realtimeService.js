// ============================================================
// realtimeService.js – Supabase Realtime for attendance
// ============================================================
// Subscribes to live attendance changes so the student/parent
// dashboard updates automatically without manual refresh.
//
// Usage:
//   const channel = subscribeToAttendanceUpdates("student-id", (payload) => {
//     console.log("Attendance changed:", payload);
//     // re-fetch dashboard data here
//   });
//
//   // Later, to stop listening:
//   unsubscribe(channel);
// ============================================================

import { supabase } from "./supabaseClient";

/**
 * Subscribe to realtime attendance changes for a student.
 *
 * @param {string} studentId – the student's user ID
 * @param {function} onChange – callback fired when attendance row changes
 * @returns {object} channel – pass this to unsubscribe() to stop
 */
export function subscribeToAttendanceUpdates(studentId, onChange) {
  // Create a unique channel name for this subscription
  const channelName = `attendance-${studentId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*", // listen for INSERT, UPDATE, DELETE
        schema: "public",
        table: "attendance",
        filter: `student_user_id=eq.${studentId}`,
      },
      (payload) => {
        // Call the user's callback with the change data
        onChange(payload);
      }
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a realtime channel.
 *
 * @param {object} channel – the channel returned by subscribeToAttendanceUpdates
 */
export function unsubscribe(channel) {
  if (channel) {
    supabase.removeChannel(channel);
  }
}
