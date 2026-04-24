// ============================================================
// AuthContext.js – Auth state for the whole app
// ============================================================
// This React Context stores:
//   - session  (Supabase auth session)
//   - profile  (app user row: name, role, school, etc.)
//   - role     ("student" or "parent")
//   - loading  (true while checking auth)
//   - error    (error message string, or null)
//
// It exposes:
//   - signIn(username, password)
//   - signOut()
//   - refreshProfile()
//
// Wrap your app with <AuthProvider> in _layout.js.
// Use useAuth() in any screen to access auth state.
// ============================================================

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  loginUser,
  logoutUser,
  fetchCurrentProfile,
} from "../services/api";

// ----------------------------------------------------------
// 1. Create the context
// ----------------------------------------------------------
const AuthContext = createContext(null);

// ----------------------------------------------------------
// 2. Provider component (wraps the app)
// ----------------------------------------------------------
export function AuthProvider({ children }) {
  // Auth state
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ========================
  // signIn(username, password)
  // ========================
  // 1. Calls loginUser (which converts username → fake email)
  // 2. Fetches the user's profile
  // 3. Sets session, profile, and role in state
  // Returns the profile so the caller can route based on role
  const signIn = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Login
      const { data: loginData, error: loginError } = await loginUser(
        username,
        password
      );

      if (loginError) {
        setError(loginError);
        setLoading(false);
        return { profile: null, error: loginError };
      }

      setSession(loginData);

      // Step 2: Fetch profile (name, role, school, etc.)
      const { data: profileData, error: profileError } =
        await fetchCurrentProfile();

      if (profileError) {
        setError(profileError);
        setLoading(false);
        return { profile: null, error: profileError };
      }

      // Step 3: Update state
      setProfile(profileData);
      setRole(profileData?.role || null);
      setLoading(false);

      return { profile: profileData, error: null };
    } catch (err) {
      const msg = err.message || "Login failed";
      setError(msg);
      setLoading(false);
      return { profile: null, error: msg };
    }
  }, []);

  // ========================
  // signOut()
  // ========================
  // Clears all auth state and calls the API to sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    await logoutUser();
    setSession(null);
    setProfile(null);
    setRole(null);
    setError(null);
    setLoading(false);
  }, []);

  // ========================
  // refreshProfile()
  // ========================
  // Re-fetches the profile without re-logging in.
  // Useful after linking a child, etc.
  const refreshProfile = useCallback(async () => {
    const { data, error: profileError } = await fetchCurrentProfile();
    if (!profileError && data) {
      setProfile(data);
      setRole(data.role || null);
    }
  }, []);

  // ----------------------------------------------------------
  // 3. Value object passed to all children
  // ----------------------------------------------------------
  const value = {
    session,
    profile,
    role,
    loading,
    error,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ----------------------------------------------------------
// 4. Hook to use auth in any screen
// ----------------------------------------------------------
// Usage:  const { profile, role, signIn } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
