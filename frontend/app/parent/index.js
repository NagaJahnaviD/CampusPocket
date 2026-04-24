// ============================================================
// app/parent/index.js – Parent Dashboard (matches backend)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchParentDashboard } from "../../src/services/api";
import { formatPercentage } from "../../src/utils/formatters";

import ScreenContainer from "../../src/components/ScreenContainer";
import AppCard from "../../src/components/AppCard";
import LoadingScreen from "../../src/components/LoadingScreen";
import ErrorMessage from "../../src/components/ErrorMessage";
import EmptyState from "../../src/components/EmptyState";

export default function ParentHome() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme, mode } = useTheme();
  const router = useRouter();
  const c = theme.colors;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true); setError(null);
    const { data, error: apiError } = await fetchParentDashboard();
    if (apiError) setError(apiError); else setDashboard(data);
    setLoading(false);
  }

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!dashboard) return <EmptyState message="No dashboard data" />;

  const children = dashboard.children || [];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Parent Portal</Text>
          <Text style={[styles.name, { color: c.text }]}>
            {profile?.full_name || "Parent"} 👋
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
            <Text style={{ fontSize: 20 }}>{mode === "dark" ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutPill, { backgroundColor: c.errorSoft }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: c.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: c.accent }]}
          onPress={() => router.push("/parent/link-child")}
        >
          <Text style={styles.actionBtnText}>+ Link a Child</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.push("/calendar")}
        >
          <Text style={[styles.chipText, { color: c.primary }]}>📅 Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={() => router.push("/circulars")}
        >
          <Text style={[styles.chipText, { color: c.primary }]}>📢 Notices</Text>
        </TouchableOpacity>
      </View>

      {/* Children Cards */}
      {children.length === 0 ? (
        <EmptyState message="No children linked yet. Tap 'Link a Child' to get started." />
      ) : (
        children.map((child) => {
          // Backend returns: child_id, child_name, attendance_percentage, average_grade, unpaid_fees_count
          // Support both naming conventions
          const attendPct = child.attendance_percentage
            ?? child.overall_attendance_percentage ?? 0;
          const avgGrade = child.average_grade
            ?? child.overall_average_grade ?? 0;
          const unpaidCount = child.unpaid_fees_count ?? 0;
          const feeStatus = child.fee_status
            || (unpaidCount > 0 ? "PENDING" : "PAID");

          return (
            <TouchableOpacity
              key={child.child_id}
              onPress={() => router.push(`/parent/child/${child.child_id}`)}
              activeOpacity={0.7}
            >
              <AppCard>
                <Text style={[styles.childName, { color: c.text }]}>{child.child_name}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: c.primary }]}>
                      {formatPercentage(attendPct)}
                    </Text>
                    <Text style={[styles.statLabel, { color: c.textSecondary }]}>ATTENDANCE</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: c.primary }]}>
                      {formatPercentage(avgGrade)}
                    </Text>
                    <Text style={[styles.statLabel, { color: c.textSecondary }]}>AVG GRADE</Text>
                  </View>
                </View>

                {unpaidCount > 0 && (
                  <View style={[styles.alertBar, { backgroundColor: c.warningSoft }]}>
                    <Text style={[styles.alertText, { color: c.warning }]}>
                      ⚠️ {unpaidCount} unpaid fee{unpaidCount > 1 ? "s" : ""} — please pay soon
                    </Text>
                  </View>
                )}

                <Text style={[styles.tapHint, { color: c.textMuted }]}>
                  Tap for details →
                </Text>
              </AppCard>
            </TouchableOpacity>
          );
        })
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 14, fontWeight: "500", letterSpacing: 0.3 },
  name: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { padding: 8 },
  logoutPill: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  logoutText: { fontWeight: "700", fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  actionBtn: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18 },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontSize: 13, fontWeight: "600" },
  childName: { fontSize: 20, fontWeight: "800", marginBottom: 10, letterSpacing: -0.2 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  alertBar: { borderRadius: 10, padding: 10, marginTop: 8 },
  alertText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  tapHint: { fontSize: 12, fontWeight: "500", textAlign: "right", marginTop: 8 },
});
