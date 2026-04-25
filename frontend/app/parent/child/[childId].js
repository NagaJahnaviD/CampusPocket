// ============================================================
// app/parent/child/[childId].js – Child Detail with expandable classes
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/context/ThemeContext";
import { fetchParentChildReport, fetchChildClassroomStats } from "../../../src/services/api";
import { supabase } from "../../../src/services/supabaseClient";
import { payFee } from "../../../src/services/paymentService";
import { formatPercentage } from "../../../src/utils/formatters";

import ScreenContainer from "../../../src/components/ScreenContainer";
import AppCard from "../../../src/components/AppCard";
import StatCard from "../../../src/components/StatCard";
import LoadingScreen from "../../../src/components/LoadingScreen";
import ErrorMessage from "../../../src/components/ErrorMessage";
import EmptyState from "../../../src/components/EmptyState";

// Fee row with Pay Now button for unpaid fees
function FeeRow({ fee, childId, theme, onPaid }) {
  const c = theme.colors;
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);
    const result = await payFee(fee);
    setPaying(false);
    if (result.success) {
      Alert.alert("Payment Successful", result.message, [
        { text: "OK", onPress: onPaid },
      ]);
    } else if (result.error !== "Payment cancelled") {
      Alert.alert("❌ Payment Failed", result.error);
    }
  }

  return (
    <View style={[styles.feeRow, { borderBottomColor: c.divider }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.feeTitle, { color: c.text }]}>{fee.title}</Text>
        {fee.due_date && (
          <Text style={[styles.feeDate, { color: c.textMuted }]}>Due: {fee.due_date}</Text>
        )}
      </View>
      <View style={styles.feeRight}>
        <Text style={[styles.feeAmount, { color: c.text }]}>₹{fee.amount}</Text>
        {fee.paid ? (
          <View style={[styles.feeBadge, { backgroundColor: c.successSoft }]}>
            <Text style={[styles.feeBadgeText, { color: c.success }]}>✓ PAID</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={handlePay} disabled={paying} activeOpacity={0.8}>
            <LinearGradient
              colors={[c.primaryGradientStart, c.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.payBtn, paying && { opacity: 0.6 }]}
            >
              {paying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.payBtnText}>Pay Now</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// Expandable classroom row component
function ClassroomRow({ cls, childId, theme }) {
  const c = theme.colors;
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  async function handleExpand() {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    if (stats) return; // already loaded
    setLoadingStats(true);
    const { data } = await fetchChildClassroomStats(childId, cls.id || cls.classroom_id);
    if (data) setStats(data);
    setLoadingStats(false);
  }

  return (
    <TouchableOpacity
      onPress={handleExpand}
      activeOpacity={0.7}
      style={[styles.classCard, { backgroundColor: c.primaryLight, borderColor: c.border }]}
    >
      <View style={styles.classHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.className, { color: c.text }]}>
            {cls.name || cls.class_name}
          </Text>
          {cls.subject && (
            <Text style={[styles.classSubject, { color: c.textMuted }]}>{cls.subject}</Text>
          )}
        </View>
        <Text style={[styles.chevron, { color: c.textMuted }]}>
          {expanded ? "▲" : "▼"}
        </Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          {loadingStats ? (
            <ActivityIndicator color={c.primary} style={{ paddingVertical: 12 }} />
          ) : stats ? (
            <>
              <View style={styles.statsGrid}>
                <View style={[styles.miniStat, { backgroundColor: c.surface }]}>
                  <Text style={[styles.miniStatValue, { color: c.primary }]}>
                    {stats.attendance_percentage != null
                      ? formatPercentage(stats.attendance_percentage) : "N/A"}
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: c.textSecondary }]}>ATTENDANCE</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: c.surface }]}>
                  <Text style={[styles.miniStatValue, { color: c.primary }]}>
                    {stats.average_grade != null
                      ? formatPercentage(stats.average_grade) : "N/A"}
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: c.textSecondary }]}>AVG GRADE</Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: c.surface }]}>
                  <Text style={[styles.miniStatValue, { color: c.accent }]}>
                    {stats.rank != null
                      ? `#${stats.rank}/${stats.total_students}` : "—"}
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: c.textSecondary }]}>RANK</Text>
                </View>
              </View>

              {stats.assignments && stats.assignments.length > 0 && (
                <View style={styles.assignmentsSection}>
                  <Text style={[styles.assignmentsTitle, { color: c.textSecondary }]}>
                    ASSIGNMENTS
                  </Text>
                  {stats.assignments.map((a, i) => (
                    <View key={`asg-${i}`} style={[styles.assignmentRow, { borderBottomColor: c.divider }]}>
                      <Text style={[styles.assignmentName, { color: c.text }]}>{a.title}</Text>
                      <View style={styles.assignmentScore}>
                        <Text style={[styles.assignmentMarks, { color: c.text }]}>
                          {a.marks_obtained}/{a.max_marks}
                        </Text>
                        <Text style={[styles.assignmentPct, { color: c.primary }]}>
                          {formatPercentage(a.percentage)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={[styles.noData, { color: c.textMuted }]}>Could not load stats</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ChildDetail() {
  const { childId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;

  const [report, setReport] = useState(null);
  const [feesWithIds, setFeesWithIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadReport(); }, [childId]);

  async function loadReport() {
    setLoading(true); setError(null);
    // Fetch report and fees (with IDs) in parallel
    const [reportRes, feesRes] = await Promise.all([
      fetchParentChildReport(childId),
      supabase.from("fees").select("id, title, amount, paid, due_date, paid_at").eq("student_user_id", childId).order("due_date"),
    ]);
    if (reportRes.error) setError(reportRes.error);
    else setReport(reportRes.data);
    setFeesWithIds(feesRes.data || []);
    setLoading(false);
  }

  if (loading) return <LoadingScreen message="Loading child report..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadReport} />;
  if (!report) return <EmptyState message="No report data" />;

  const attendPct = report.attendance_percentage ?? report.overall_attendance_percentage ?? 0;
  const avgGrade = report.average_grade ?? report.overall_average_grade ?? 0;
  const childName = report.child_name || "Child";
  const classrooms = report.classrooms || [];
  const fees = feesWithIds.length > 0 ? feesWithIds : (report.fees || []);
  const activities = report.activities || [];

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>
        {childName !== "Child" ? childName : "Child Report"}
      </Text>

      <View style={styles.overallStats}>
        <StatCard label="Attendance" value={formatPercentage(attendPct)} />
        <StatCard label="Avg Grade" value={formatPercentage(avgGrade)} />
      </View>

      {/* Fees */}
      {fees.length > 0 && (
        <AppCard title="Fees">
          {fees.map((fee, i) => (
            <FeeRow key={fee.id || `fee-${i}`} fee={fee} childId={childId} theme={theme} onPaid={loadReport} />
          ))}
        </AppCard>
      )}

      {/* Classrooms — expandable */}
      {classrooms.length > 0 && (
        <View>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Enrolled Classes</Text>
          <Text style={[styles.sectionHint, { color: c.textMuted }]}>
            Tap a class for details
          </Text>
          {classrooms.map((cls, i) => (
            <ClassroomRow
              key={cls.id || cls.classroom_id || `cls-${i}`}
              cls={cls}
              childId={childId}
              theme={theme}
            />
          ))}
        </View>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <AppCard title="🎨 Activities">
          {activities.map((act, i) => (
            <Text key={act.id || `act-${i}`} style={[styles.activityName, { color: c.text }]}>
              • {act.name}
            </Text>
          ))}
        </AppCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.3, marginBottom: 16 },
  overallStats: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  sectionHint: { fontSize: 12, marginBottom: 10 },
  // Class card
  classCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  classHeader: { flexDirection: "row", alignItems: "center" },
  className: { fontSize: 16, fontWeight: "700" },
  classSubject: { fontSize: 13, marginTop: 2 },
  chevron: { fontSize: 14, fontWeight: "700", marginLeft: 8 },
  expandedContent: { marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)", paddingTop: 12 },
  // Mini stats grid
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  miniStat: { flex: 1, borderRadius: 10, padding: 10, alignItems: "center" },
  miniStatValue: { fontSize: 18, fontWeight: "800" },
  miniStatLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1, marginTop: 2 },
  // Assignments
  assignmentsSection: { marginTop: 4 },
  assignmentsTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 6 },
  assignmentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1 },
  assignmentName: { fontSize: 14, fontWeight: "500", flex: 1 },
  assignmentScore: { alignItems: "flex-end" },
  assignmentMarks: { fontSize: 13, fontWeight: "600" },
  assignmentPct: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  noData: { fontSize: 13, textAlign: "center", paddingVertical: 12 },
  // Fees
  feeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  feeTitle: { fontSize: 14, fontWeight: "600" },
  feeDate: { fontSize: 12, marginTop: 2 },
  feeRight: { alignItems: "flex-end" },
  feeAmount: { fontSize: 15, fontWeight: "700" },
  feeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  feeBadgeText: { fontSize: 11, fontWeight: "700" },
  payBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  payBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  activityName: { fontSize: 14, fontWeight: "500", paddingVertical: 4 },
});
