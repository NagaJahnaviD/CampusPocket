// ============================================================
// app/student/leaderboard/[classroomId].js – Anonymized Leaderboard (themed)
// ============================================================
// NO student names — only "Student #1", "Student #2", etc.
// ============================================================

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../src/context/ThemeContext";
import { fetchLeaderboard } from "../../../src/services/api";
import { formatPercentage } from "../../../src/utils/formatters";

import ScreenContainer from "../../../src/components/ScreenContainer";
import LoadingScreen from "../../../src/components/LoadingScreen";
import ErrorMessage from "../../../src/components/ErrorMessage";
import EmptyState from "../../../src/components/EmptyState";

export default function Leaderboard() {
  const { classroomId } = useLocalSearchParams();
  const { theme } = useTheme();
  const c = theme.colors;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadLeaderboard(); }, [classroomId]);

  async function loadLeaderboard() {
    setLoading(true);
    const { data: result, error: e } = await fetchLeaderboard(classroomId);
    if (e) setError(e); else setData(result);
    setLoading(false);
  }

  if (loading) return <LoadingScreen message="Loading leaderboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadLeaderboard} />;

  const entries = data?.leaderboard || [];
  if (entries.length === 0) return <EmptyState message="No leaderboard data" />;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>Leaderboard</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Rankings are anonymized for privacy
      </Text>

      {entries.map((entry, i) => (
        <View
          key={`rank-${i}`}
          style={[
            styles.row,
            { backgroundColor: c.surface, borderColor: c.border },
            entry.is_me && { backgroundColor: c.primaryLight, borderColor: c.primary, borderWidth: 2 },
          ]}
        >
          <LinearGradient
            colors={
              entry.rank <= 3
                ? [c.primaryGradientStart, c.primaryGradientEnd]
                : [c.textMuted, c.textSecondary]
            }
            style={styles.rankBadge}
          >
            <Text style={styles.rankText}>#{entry.rank}</Text>
          </LinearGradient>

          <View style={styles.info}>
            <Text style={[styles.label, { color: entry.is_me ? c.primary : c.text }]}>
              {entry.is_me ? "You" : `Student #${entry.rank}`}
            </Text>
            {entry.is_me && <Text style={[styles.youTag, { color: c.primary }]}>⭐ You</Text>}
          </View>

          <Text style={[styles.score, { color: c.text }]}>
            {formatPercentage(entry.average_grade)}
          </Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.3, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, elevation: 2 },
  rankBadge: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", marginRight: 14 },
  rankText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: "600" },
  youTag: { fontSize: 12, fontWeight: "700" },
  score: { fontSize: 16, fontWeight: "800" },
});
