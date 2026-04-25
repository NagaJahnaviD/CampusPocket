// ============================================================
// app/activities.js – Extracurricular Activities (themed)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../src/context/ThemeContext";
import { useAuth } from "../src/context/AuthContext";
import { fetchStudentActivities } from "../src/services/api";

import ScreenContainer from "../src/components/ScreenContainer";
import AppCard from "../src/components/AppCard";
import LoadingScreen from "../src/components/LoadingScreen";
import ErrorMessage from "../src/components/ErrorMessage";
import EmptyState from "../src/components/EmptyState";

export default function ActivitiesScreen() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const c = theme.colors;
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadActivities(); }, []);

  async function loadActivities() {
    setLoading(true); setError(null);
    if (!profile?.id) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    const { data, error: e } = await fetchStudentActivities(profile.id);
    if (e) setError(e); else setActivities(data || []);
    setLoading(false);
  }

  if (loading) return <LoadingScreen message="Loading activities..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadActivities} />;
  if (activities.length === 0) return <EmptyState message="No activities available" />;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>Activities</Text>
      {activities.map((act, i) => (
        <AppCard key={act.id || `act-${i}`}>
          <View style={styles.row}>
            <Ionicons name="fitness-outline" size={24} color={c.primary} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: c.text }]}>{act.name}</Text>
              {act.day_of_week && (
                <Text style={[styles.schedule, { color: c.textSecondary }]}>
                  {act.day_of_week}{act.time_slot ? ` • ${act.time_slot}` : ""}
                </Text>
              )}
              {act.description && (
                <Text style={[styles.desc, { color: c.textMuted }]}>{act.description}</Text>
              )}
            </View>
          </View>
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16, letterSpacing: -0.3 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  emoji: { fontSize: 28 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700" },
  schedule: { fontSize: 13, marginTop: 4 },
  desc: { fontSize: 12, marginTop: 2 },
});
