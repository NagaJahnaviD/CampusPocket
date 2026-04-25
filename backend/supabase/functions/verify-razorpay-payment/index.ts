// ============================================================
// Supabase Edge Function: verify-razorpay-payment
// ============================================================
// Verifies a Razorpay payment signature and marks fee as paid.
//
// Security:
//   - Verifies HMAC SHA256 signature using Key Secret
//   - Only marks fee paid if signature is valid
//   - Stores payment_id and signature in DB
//
// Request body:
//   {
//     fee_id: "uuid",
//     razorpay_order_id: "order_xxx",
//     razorpay_payment_id: "pay_xxx",
//     razorpay_signature: "hex_string"
//   }
//
// Response: { success: true, message: "Payment verified" }
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

// CORS headers
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

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // ── Step 2: Parse request body ─────────────────────────────
    const {
      fee_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (!fee_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing required payment fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 3: Verify Razorpay signature ──────────────────────
    // Razorpay signature = HMAC SHA256 of "order_id|payment_id"
    // using the Key Secret as the HMAC key.
    const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!RAZORPAY_KEY_SECRET) {
      return new Response(
        JSON.stringify({ error: "Razorpay not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the expected signature
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;

    // Use Web Crypto API for HMAC
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // ── Step 4: Compare signatures ─────────────────────────────
    if (expectedSignature !== razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 5: Verify order_id matches the fee ────────────────
    const { data: fee, error: feeError } = await supabase
      .from("fees")
      .select("*")
      .eq("id", fee_id)
      .eq("razorpay_order_id", razorpay_order_id)
      .single();

    if (feeError || !fee) {
      return new Response(
        JSON.stringify({ error: "Fee not found or order mismatch" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (fee.paid) {
      return new Response(
        JSON.stringify({ success: true, message: "Fee was already marked as paid" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 6: Mark fee as paid ───────────────────────────────
    const { error: updateError } = await supabase
      .from("fees")
      .update({
        paid: true,
        paid_at: new Date().toISOString(),
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq("id", fee_id);

    if (updateError) {
      console.error("Failed to update fee:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update fee status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 7: Return success ─────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and fee marked as paid",
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
