// ============================================================
// supabaseClient.js – Creates and exports a Supabase client
// ============================================================
// This is the single place where we connect to Supabase.
// Every other file imports the client from here.
// ============================================================

// Load environment variables from .env file (SUPABASE_URL, SUPABASE_ANON_KEY)
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Read values from environment variables.
// These come from your Supabase project dashboard → Settings → API.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Safety check – crash early if the env vars are missing.
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in your .env file.\n" +
      "Create a .env file in the backend/ folder with these values."
  );
}

// Create the Supabase client.
// This client handles auth, database queries, and RPC calls for us.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export so other files can do:  import { supabase } from "./supabaseClient.js"
export { supabase };
