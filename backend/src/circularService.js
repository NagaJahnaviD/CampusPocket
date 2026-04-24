// ============================================================
// circularService.js – Digital circulars / school notices
// ============================================================
// Fetches circulars published by the school.
// RLS filters to the logged-in user's school automatically.
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// getCirculars()
// ----------------------------------------------------------
// Reads from the digital_circular table.
// Returns an array of circular objects, each with:
//   - id, title, body, published_at
//
// Sorted newest-first so the latest notice is on top.
//
// Usage from a React Native screen:
//   const { data, error } = await getCirculars();
//   if (error) { Alert.alert("Error", error); return; }
//   setCirculars(data);
// ----------------------------------------------------------
export async function getCirculars() {
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
