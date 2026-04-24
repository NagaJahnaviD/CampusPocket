// ============================================================
// app/calendar.js – Campus Calendar (themed)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../src/context/ThemeContext";
import { fetchCampusEvents } from "../src/services/api";

import ScreenContainer from "../src/components/ScreenContainer";
import AppCard from "../src/components/AppCard";
import LoadingScreen from "../src/components/LoadingScreen";
import ErrorMessage from "../src/components/ErrorMessage";
import EmptyState from "../src/components/EmptyState";

export default function CalendarScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadEvents(); }, []);

  async function loadEvents() {
    setLoading(true); setError(null);
    const { data, error: e } = await fetchCampusEvents();
    if (e) setError(e); else setEvents(data || []);
    setLoading(false);
  }

  if (loading) return <LoadingScreen message="Loading events..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadEvents} />;
  if (events.length === 0) return <EmptyState message="No upcoming events" />;

  // Group by date
  const grouped = {};
  events.forEach((e) => {
    const date = e.event_date || "TBD";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(e);
  });

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>📅 Campus Calendar</Text>
      {Object.entries(grouped).map(([date, items]) => (
        <AppCard key={date} title={date}>
          {items.map((ev) => (
            <View key={ev.id} style={styles.eventRow}>
              <Text style={[styles.eventTitle, { color: c.text }]}>{ev.title}</Text>
              {ev.description && (
                <Text style={[styles.eventDesc, { color: c.textSecondary }]}>{ev.description}</Text>
              )}
            </View>
          ))}
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16, letterSpacing: -0.3 },
  eventRow: { paddingVertical: 8 },
  eventTitle: { fontSize: 15, fontWeight: "600" },
  eventDesc: { fontSize: 13, marginTop: 2 },
});
