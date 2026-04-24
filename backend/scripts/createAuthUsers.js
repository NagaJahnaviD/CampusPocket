// ============================================================
// createAuthUsers.js – Creates demo users in Supabase Auth
// ============================================================
// Run this BEFORE running seed.sql.
//
// This uses the Supabase Admin API (service_role key) to create
// auth users with specific IDs, so they match the seed data.
//
// Usage:
//   node scripts/createAuthUsers.js
// ============================================================

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// We need the SERVICE_ROLE key (not the anon key) to use admin functions.
// Find it in: Supabase Dashboard → Settings → API → service_role key.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  console.error("   Add SUPABASE_SERVICE_ROLE_KEY from Supabase → Settings → API");
  process.exit(1);
}

// Create an admin client using the service_role key.
// This bypasses RLS and has full access to create auth users.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ----------------------------------------------------------
// Demo users to create
// ----------------------------------------------------------
// The IDs here MUST match the auth_user_id values in seed.sql.
// All users use password "password123" for the demo.

const DEMO_USERS = [
  {
    id: "11111111-0001-0000-0000-000000000001",
    email: "arjun_s@campuspocket.demo",
    password: "password123",
    name: "Arjun Sharma",
  },
  {
    id: "11111111-0002-0000-0000-000000000002",
    email: "priya_p@campuspocket.demo",
    password: "password123",
    name: "Priya Patel",
  },
  {
    id: "11111111-0003-0000-0000-000000000003",
    email: "rohan_g@campuspocket.demo",
    password: "password123",
    name: "Rohan Gupta",
  },
  {
    id: "11111111-0004-0000-0000-000000000004",
    email: "meera_n@campuspocket.demo",
    password: "password123",
    name: "Meera Nair",
  },
  {
    id: "22222222-0001-0000-0000-000000000001",
    email: "vikram_parent@campuspocket.demo",
    password: "password123",
    name: "Vikram Sharma",
  },
  {
    id: "22222222-0002-0000-0000-000000000002",
    email: "sunita_parent@campuspocket.demo",
    password: "password123",
    name: "Sunita Patel",
  },
];

// ----------------------------------------------------------
// Step 1: Delete any existing demo users (clean slate)
// ----------------------------------------------------------
async function deleteExistingUsers() {
  console.log("Cleaning up old demo users...\n");

  // List all users and find ours by email
  const { data: listData, error: listError } =
    await supabaseAdmin.auth.admin.listUsers();

  if (listError) {
    console.error("❌ Could not list users:", listError.message);
    return;
  }

  // Delete any user whose email ends with @campuspocket.demo
  for (const existingUser of listData.users) {
    if (existingUser.email && existingUser.email.endsWith("@campuspocket.demo")) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      if (error) {
        console.error(`❌ Could not delete ${existingUser.email}:`, error.message);
      } else {
        console.log(`🗑️  Deleted old user: ${existingUser.email}`);
      }
    }
  }
}

// ----------------------------------------------------------
// Step 2: Create all demo users with our fixed IDs
// ----------------------------------------------------------
async function createAuthUsers() {
  // First, clean up any old demo users
  await deleteExistingUsers();

  console.log("\nCreating demo auth users...\n");

  for (const user of DEMO_USERS) {
    // IMPORTANT: The property name is "id" (not "user_id")!
    // This tells Supabase to use OUR specific UUID instead of
    // generating a random one.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      id: user.id,       // ← "id", NOT "user_id"
      email: user.email,
      password: user.password,
      email_confirm: true, // skip email verification for demo
      user_metadata: { full_name: user.name },
    });

    if (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
    } else {
      console.log(`✅ Created ${user.email}  (id: ${data.user.id})`);
    }
  }

  console.log("\nDone! Now run seed.sql in the Supabase SQL Editor.");
}

createAuthUsers();
