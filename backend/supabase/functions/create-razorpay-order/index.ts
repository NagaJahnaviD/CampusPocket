// ============================================================
// Supabase Edge Function: create-razorpay-order
// ============================================================
// Creates a Razorpay order for a pending fee.
//
// Security:
//   - Validates the user is authorized (student or parent)
//   - Only creates orders for UNPAID fees
//   - Uses Razorpay Key Secret (server-side only, NEVER exposed)
//
// Environment variables (set in Supabase Dashboard → Edge Functions):
//   RAZORPAY_KEY_ID     – Razorpay Key ID
//   RAZORPAY_KEY_SECRET – Razorpay Key Secret (NEVER send to frontend)
//
// Request body: { fee_id: "uuid" }
// Response:     { order_id, amount, currency, fee_id }
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for React Native
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Step 1: Authenticate the user ──────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // ── Step 2: Parse request body ─────────────────────────────
    const { fee_id } = await req.json();
    if (!fee_id) {
      return new Response(
        JSON.stringify({ error: "fee_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Get the fee from the database ──────────────────
    const { data: fee, error: feeError } = await supabase
      .from("fees")
      .select("*")
      .eq("id", fee_id)
      .single();

    if (feeError || !fee) {
      return new Response(
        JSON.stringify({ error: "Fee not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 4: Check fee is unpaid ────────────────────────────
    if (fee.paid) {
      return new Response(
        JSON.stringify({ error: "Fee is already paid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 5: Verify authorization ───────────────────────────
    // Get current user's profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is the student OR a linked parent
    const { data: profile } = await supabase
      .from("user")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let isAuthorized = false;

    if (profile.role === "student" && profile.id === fee.student_user_id) {
      isAuthorized = true;
    } else if (profile.role === "parent") {
      // Check if parent is linked to this student
      const { data: link } = await supabase
        .from("parent_student_link")
        .select("id")
        .eq("parent_user_id", profile.id)
        .eq("student_user_id", fee.student_user_id)
        .single();
      isAuthorized = !!link;
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Not authorized to pay this fee" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 6: Create Razorpay order ──────────────────────────
    const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Razorpay not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Razorpay amount is in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(fee.amount * 100);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `fee_${fee_id}`,
        notes: {
          fee_id: fee_id,
          student_id: fee.student_user_id,
          title: fee.title,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error("Razorpay order creation failed:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const order = await razorpayResponse.json();

    // ── Step 7: Store order_id in the fee record ───────────────
    await supabase
      .from("fees")
      .update({ razorpay_order_id: order.id })
      .eq("id", fee_id);

    // ── Step 8: Return order details to frontend ───────────────
    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        fee_id: fee_id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
