// ============================================================
// auth.js – Login, Logout, and Profile helpers
// ============================================================
// Uses Supabase Auth (email + password).
// For the demo we convert usernames to fake emails like:
//   "arjun_s"  →  "arjun_s@campuspocket.demo"
// ============================================================

import { supabase } from "./supabaseClient.js";

// ----------------------------------------------------------
// Helper: convert a plain username into a fake email address.
// Supabase Auth requires an email, so we build one from the
// username. This keeps the demo simple – no real emails needed.
// ----------------------------------------------------------
function usernameToEmail(username) {
  return `${username}@campuspocket.demo`;
}

// ----------------------------------------------------------
// login(username, password)
// ----------------------------------------------------------
// Signs the user in with Supabase Auth.
// Returns { data, error }.
//   data.session  – the auth session (contains the access token)
//   data.user     – the auth user object
// ----------------------------------------------------------
export async function login(username, password) {
  const email = `${username}@campuspocket.demo`; // TEMP: remove helper

  console.log("Trying login with:", email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("AUTH RESPONSE:", data, error);

  return { data, error };
}
// ----------------------------------------------------------
// logout()
// ----------------------------------------------------------
// Signs the current user out.
// After this, all authenticated requests will fail until
// the user logs in again.
// ----------------------------------------------------------
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { message: "Logged out successfully" }, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

// ----------------------------------------------------------
// getCurrentProfile()
// ----------------------------------------------------------
// Calls the get_my_profile() RPC function we created in SQL.
// Returns the app "user" row for the currently logged-in person
// (full_name, role, school_id, username, etc.).
// ----------------------------------------------------------
export async function getCurrentProfile() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { data: null, error: "No logged-in user found" };
    }

    console.log("Logged in auth user id:", user.id);

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (error) {
      console.error("Profile fetch error:", error.message);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}