// ============================================================
// paymentService.js – UPI Payment for Fee Collection
// ============================================================
// Simple UPI-based payment for hackathon demo.
//
// Flow:
//   1. User taps "Pay Now"
//   2. App opens UPI payment app (GPay, PhonePe, Paytm, etc.)
//   3. User completes payment
//   4. App marks fee as paid in database
//
// No Razorpay signup needed! Just set your UPI ID in .env.
//
// Env: EXPO_PUBLIC_UPI_ID  (e.g., yourname@upi)
// ============================================================

import { Linking, Alert, Platform } from "react-native";
import { supabase } from "./supabaseClient";

const UPI_ID = process.env.EXPO_PUBLIC_UPI_ID || "";
const MERCHANT_NAME = process.env.EXPO_PUBLIC_MERCHANT_NAME || "Campus Pocket";

// ----------------------------------------------------------
// Build UPI payment URL
// ----------------------------------------------------------
// UPI deep link format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
function buildUpiUrl(fee) {
  const params = new URLSearchParams({
    pa: UPI_ID,                          // Payee UPI ID
    pn: MERCHANT_NAME,                   // Payee name
    am: String(fee.amount),              // Amount
    cu: "INR",                           // Currency
    tn: fee.title || "School Fee",       // Transaction note
    tr: (fee.id || "fee").slice(0, 20),   // Transaction ref (max 20 chars)
  });
  return `upi://pay?${params.toString()}`;
}

// ----------------------------------------------------------
// Pay a fee via UPI
// ----------------------------------------------------------
export async function payFee(fee) {
  if (!UPI_ID) {
    return { success: false, error: "UPI ID not configured. Add EXPO_PUBLIC_UPI_ID to .env" };
  }

  try {
    // Step 1: Build UPI URL
    const upiUrl = buildUpiUrl(fee);

    // Step 2: Check if any UPI app is available
    const canOpen = await Linking.canOpenURL(upiUrl);
    if (!canOpen) {
      return { success: false, error: "No UPI app found on this device" };
    }

    // Step 3: Open UPI app
    await Linking.openURL(upiUrl);

    // Step 4: After returning to app, ask user to confirm
    // (We can't programmatically detect UPI success on all platforms)
    return new Promise((resolve) => {
      // Small delay so user returns from UPI app first
      setTimeout(() => {
        Alert.alert(
          "Confirm Payment",
          "Did you complete the payment successfully?",
          [
            {
              text: "No, Cancel",
              style: "cancel",
              onPress: () => resolve({ success: false, error: "Payment not completed" }),
            },
            {
              text: "Yes, Paid ✅",
              onPress: async () => {
                // Mark fee as paid in database
                const { error } = await supabase
                  .from("fees")
                  .update({ paid: true, paid_at: new Date().toISOString() })
                  .eq("id", fee.id);

                if (error) {
                  resolve({ success: false, error: "Failed to update fee status" });
                } else {
                  resolve({ success: true, message: "Payment recorded successfully!" });
                }
              },
            },
          ]
        );
      }, 1500);
    });
  } catch (err) {
    return { success: false, error: err.message || "Payment failed" };
  }
}

// ----------------------------------------------------------
// Fetch student fees
// ----------------------------------------------------------
export async function fetchStudentFees(studentUserId) {
  try {
    const { data, error } = await supabase
      .from("fees")
      .select("id, title, amount, paid, due_date, paid_at")
      .eq("student_user_id", studentUserId)
      .order("due_date", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
