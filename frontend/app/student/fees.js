// ============================================================
// app/student/fees.js – Student Fee Payment Screen
// ============================================================
// Shows all fees (paid + unpaid) with "Pay Now" for pending ones.
// Uses Razorpay for secure payment processing.
// ============================================================
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, Alert, ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchStudentFees, payFee } from "../../src/services/paymentService";

import ScreenContainer from "../../src/components/ScreenContainer";
import AppCard from "../../src/components/AppCard";
import LoadingScreen from "../../src/components/LoadingScreen";
import ErrorMessage from "../../src/components/ErrorMessage";
import EmptyState from "../../src/components/EmptyState";

export default function FeesScreen() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payingFeeId, setPayingFeeId] = useState(null); // tracks which fee is being paid

  useEffect(() => { loadFees(); }, []);

  // Load all fees for this student
  async function loadFees() {
    setLoading(true);
    setError(null);
    if (!profile?.id) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    const { data, error: e } = await fetchStudentFees(profile.id);
    if (e) setError(e);
    else setFees(data || []);
    setLoading(false);
  }

  // Handle "Pay Now" button
  async function handlePay(fee) {
    setPayingFeeId(fee.id);

    const result = await payFee(fee, {
      name: profile?.full_name || "",
    });

    setPayingFeeId(null);

    if (result.success) {
      // Show success message
      Alert.alert("Payment Successful", result.message, [
        { text: "OK", onPress: loadFees },
      ]);
    } else {
      // Show error (unless user cancelled)
      if (result.error !== "Payment cancelled") {
        Alert.alert("❌ Payment Failed", result.error);
      }
    }
  }

  if (loading) return <LoadingScreen message="Loading fees..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadFees} />;
  if (fees.length === 0) return <EmptyState message="No fee records found" />;

  // Split into unpaid and paid
  const unpaidFees = fees.filter((f) => !f.paid);
  const paidFees = fees.filter((f) => f.paid);

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>Fees</Text>

      {/* Total outstanding */}
      {unpaidFees.length > 0 && (
        <LinearGradient
          colors={["#ef444420", "#f9731620"]}
          style={styles.outstandingBanner}
        >
          <Text style={[styles.outstandingLabel, { color: c.error }]}>Total Outstanding</Text>
          <Text style={[styles.outstandingAmount, { color: c.error }]}>
            ₹{unpaidFees.reduce((sum, f) => sum + Number(f.amount), 0).toLocaleString()}
          </Text>
        </LinearGradient>
      )}

      {/* Unpaid Fees */}
      {unpaidFees.length > 0 && (
        <AppCard title="⏳ Pending Fees">
          {unpaidFees.map((fee) => (
            <View
              key={fee.id}
              style={[styles.feeRow, { borderBottomColor: c.divider }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.feeTitle, { color: c.text }]}>{fee.title}</Text>
                {fee.due_date && (
                  <Text style={[styles.feeDue, { color: c.textMuted }]}>
                    Due: {fee.due_date}
                  </Text>
                )}
              </View>

              <View style={styles.feeRight}>
                <Text style={[styles.feeAmount, { color: c.text }]}>
                  ₹{Number(fee.amount).toLocaleString()}
                </Text>

                {/* Pay Now button */}
                <TouchableOpacity
                  testID={`pay-now-${fee.id}`}
                  onPress={() => handlePay(fee)}
                  disabled={payingFeeId === fee.id}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[c.primaryGradientStart, c.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.payButton,
                      payingFeeId === fee.id && styles.payButtonDisabled,
                    ]}
                  >
                    {payingFeeId === fee.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.payButtonText}>Pay Now</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </AppCard>
      )}

      {/* Paid Fees */}
      {paidFees.length > 0 && (
        <AppCard title="Paid Fees">
          {paidFees.map((fee) => (
            <View
              key={fee.id}
              style={[styles.feeRow, { borderBottomColor: c.divider }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.feeTitle, { color: c.text }]}>{fee.title}</Text>
                {fee.paid_at && (
                  <Text style={[styles.feeDue, { color: c.textMuted }]}>
                    Paid: {new Date(fee.paid_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <View style={styles.feeRight}>
                <Text style={[styles.feeAmount, { color: c.text }]}>
                  ₹{Number(fee.amount).toLocaleString()}
                </Text>
                <View style={[styles.paidBadge, { backgroundColor: c.successSoft }]}>
                  <Text style={[styles.paidBadgeText, { color: c.success }]}>✓ PAID</Text>
                </View>
              </View>
            </View>
          ))}
        </AppCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.3, marginBottom: 16 },
  // Outstanding banner
  outstandingBanner: {
    borderRadius: 14, padding: 16, alignItems: "center", marginBottom: 16,
  },
  outstandingLabel: { fontSize: 13, fontWeight: "600", letterSpacing: 1 },
  outstandingAmount: { fontSize: 28, fontWeight: "800", marginTop: 4 },
  // Fee row
  feeRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 12, borderBottomWidth: 1,
  },
  feeTitle: { fontSize: 14, fontWeight: "600" },
  feeDue: { fontSize: 12, marginTop: 2 },
  feeRight: { alignItems: "flex-end" },
  feeAmount: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  // Pay button
  payButton: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  // Paid badge
  paidBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  paidBadgeText: { fontSize: 11, fontWeight: "700" },
});
