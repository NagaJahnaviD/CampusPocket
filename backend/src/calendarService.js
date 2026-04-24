// ============================================================
// calendarService.js – Campus calendar events
// ============================================================
// Fetches school-wide events (sports day, exams, holidays, etc.)
// for the currently logged-in user's school.
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// getCampusEvents()
// ----------------------------------------------------------
// Reads from the campus_event table.
// RLS automatically filters to the user's own school_id,
// so we just SELECT * and let Supabase handle the rest.
//
// Returns an array of event objects, each with:
//   - id, title, description, event_date, event_type
//
// Usage from a React Native screen:
//   const { data, error } = await getCampusEvents();
//   if (error) { Alert.alert("Error", error); return; }
//   setEvents(data);
// ----------------------------------------------------------
export async function getCampusEvents() {
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
