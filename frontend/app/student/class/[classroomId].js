// ============================================================
// app/student/class/[classroomId].js – Class Report (themed)
// ============================================================
// PRIVACY: No classmate names are displayed anywhere.
// ============================================================

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/context/ThemeContext";
import { fetchStudentClassReport } from "../../../src/services/api";
import { formatPercentage } from "../../../src/utils/formatters";

import ScreenContainer from "../../../src/components/ScreenContainer";
import AppCard from "../../../src/components/AppCard";
import StatCard from "../../../src/components/StatCard";
import LoadingScreen from "../../../src/components/LoadingScreen";
import ErrorMessage from "../../../src/components/ErrorMessage";
import EmptyState from "../../../src/components/EmptyState";

export default function ClassReport() {
  const { classroomId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadReport(); }, [classroomId]);

  async function loadReport() {
    setLoading(true); setError(null);
    const { data, error: apiError } = await fetchStudentClassReport(classroomId);
    if (apiError) setError(apiError); else setReport(data);
    setLoading(false);
  }

  if (loading) return <LoadingScreen message="Loading class report..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadReport} />;
  if (!report) return <EmptyState message="No report data" />;

  const { class_name, attendance_percentage, average_grade, assignments = [] } = report;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>{class_name}</Text>

      <View style={styles.statsRow}>
        <StatCard label="Attendance" value={formatPercentage(attendance_percentage)} />
        <StatCard label="Avg Grade" value={formatPercentage(average_grade)} />
      </View>

      <AppCard title="📋 Assignments">
        {assignments.length === 0 ? (
          <EmptyState message="No assignments yet" />
        ) : (
          assignments.map((a) => (
            <View key={a.id} style={[styles.row, { borderBottomColor: c.divider }]}>
              <Text style={[styles.rowTitle, { color: c.text }]}>{a.title}</Text>
              <Text style={[styles.rowScore, { color: c.primary }]}>
                {formatPercentage(a.percentage)}
              </Text>
            </View>
          ))
        )}
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16, letterSpacing: -0.3 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  rowTitle: { fontSize: 14, fontWeight: "500", flex: 1 },
  rowScore: { fontSize: 16, fontWeight: "700", minWidth: 60, textAlign: "right" },
});
