// ============================================================
// supabaseClient.js – Frontend Supabase client
// ============================================================
// This creates a Supabase client for the React Native app.
//
// Uses AsyncStorage for session persistence on mobile.
//
// Set these in your .env:
//   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
// ============================================================

import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Read from Expo's public env vars
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Create the client with AsyncStorage for React Native
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // not needed in React Native
  },
});

export { supabase };
