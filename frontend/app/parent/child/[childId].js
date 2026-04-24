// ============================================================
// app/parent/child/[childId].js – Child Detail (matches backend)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/context/ThemeContext";
import { fetchParentChildReport } from "../../../src/services/api";
import { formatPercentage } from "../../../src/utils/formatters";

import ScreenContainer from "../../../src/components/ScreenContainer";
import AppCard from "../../../src/components/AppCard";
import StatCard from "../../../src/components/StatCard";
import LoadingScreen from "../../../src/components/LoadingScreen";
import ErrorMessage from "../../../src/components/ErrorMessage";
import EmptyState from "../../../src/components/EmptyState";

export default function ChildDetail() {
  const { childId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadReport(); }, [childId]);

  async function loadReport() {
    setLoading(true); setError(null);
    const { data, error: e } = await fetchParentChildReport(childId);
    if (e) setError(e); else setReport(data);
    setLoading(false);
  }

  if (loading) return <LoadingScreen message="Loading child report..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadReport} />;
  if (!report) return <EmptyState message="No report data" />;

  // Backend returns: attendance_percentage, average_grade, fees[], classrooms[]
  // Classrooms have: id, name, subject
  // Support both naming conventions
  const attendPct = report.attendance_percentage
    ?? report.overall_attendance_percentage ?? 0;
  const avgGrade = report.average_grade
    ?? report.overall_average_grade ?? 0;
  const childName = report.child_name || "Child";
  const classrooms = report.classrooms || [];
  const fees = report.fees || [];
  const activities = report.activities || [];

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>
        {childName !== "Child" ? childName : "📊 Child Report"}
      </Text>

      <View style={styles.statsRow}>
        <StatCard label="Attendance" value={formatPercentage(attendPct)} />
        <StatCard label="Avg Grade" value={formatPercentage(avgGrade)} />
      </View>

      {/* Fees */}
      {fees.length > 0 && (
        <AppCard title="💰 Fees">
          {fees.map((fee, i) => (
            <View key={i} style={[styles.feeRow, { borderBottomColor: c.divider }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feeTitle, { color: c.text }]}>{fee.title}</Text>
                {fee.due_date && (
                  <Text style={[styles.feeDate, { color: c.textMuted }]}>Due: {fee.due_date}</Text>
                )}
              </View>
              <View style={styles.feeRight}>
                <Text style={[styles.feeAmount, { color: c.text }]}>₹{fee.amount}</Text>
                <View style={[
                  styles.feeBadge,
                  { backgroundColor: fee.paid ? c.successSoft : c.warningSoft }
                ]}>
                  <Text style={[
                    styles.feeBadgeText,
                    { color: fee.paid ? c.success : c.warning }
                  ]}>
                    {fee.paid ? "✓ PAID" : "⏳ UNPAID"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </AppCard>
      )}

      {/* Classrooms */}
      {classrooms.length > 0 && (
        <AppCard title="📚 Enrolled Classes">
          {classrooms.map((cls) => (
            <View key={cls.id || cls.classroom_id} style={[styles.classRow, { borderBottomColor: c.divider }]}>
              <Text style={[styles.className, { color: c.text }]}>
                {cls.name || cls.class_name}
              </Text>
              {cls.subject && (
                <Text style={[styles.classSubject, { color: c.textSecondary }]}>
                  {cls.subject}
                </Text>
              )}
              {(cls.attendance_percentage != null || cls.average_grade != null) && (
                <View style={styles.classStats}>
                  {cls.attendance_percentage != null && (
                    <Text style={[styles.classStat, { color: c.textSecondary }]}>
                      📊 {formatPercentage(cls.attendance_percentage)}
                    </Text>
                  )}
                  {cls.average_grade != null && (
                    <Text style={[styles.classStat, { color: c.textSecondary }]}>
                      📝 {formatPercentage(cls.average_grade)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}
        </AppCard>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <AppCard title="🎨 Activities">
          {activities.map((act) => (
            <Text key={act.id} style={[styles.activityName, { color: c.text }]}>
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
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  feeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  feeTitle: { fontSize: 14, fontWeight: "600" },
  feeDate: { fontSize: 12, marginTop: 2 },
  feeRight: { alignItems: "flex-end" },
  feeAmount: { fontSize: 15, fontWeight: "700" },
  feeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  feeBadgeText: { fontSize: 11, fontWeight: "700" },
  classRow: { paddingVertical: 10, borderBottomWidth: 1 },
  className: { fontSize: 16, fontWeight: "700" },
  classSubject: { fontSize: 13, marginTop: 2 },
  classStats: { flexDirection: "row", gap: 16, marginTop: 4 },
  classStat: { fontSize: 13, fontWeight: "500" },
  activityName: { fontSize: 14, fontWeight: "500", paddingVertical: 4 },
});
