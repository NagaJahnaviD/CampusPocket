// ============================================================
// app/circulars.js – Digital Circulars (themed)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../src/context/ThemeContext";
import { fetchCirculars } from "../src/services/api";

import ScreenContainer from "../src/components/ScreenContainer";
import AppCard from "../src/components/AppCard";
import LoadingScreen from "../src/components/LoadingScreen";
import ErrorMessage from "../src/components/ErrorMessage";
import EmptyState from "../src/components/EmptyState";

export default function CircularsScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [circulars, setCirculars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadCirculars(); }, []);

  async function loadCirculars() {
    setLoading(true); setError(null);
    const { data, error: e } = await fetchCirculars();
    if (e) setError(e); else setCirculars(data || []);
    setLoading(false);
  }

  if (loading) return <LoadingScreen message="Loading notices..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadCirculars} />;
  if (circulars.length === 0) return <EmptyState message="No circulars posted" />;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>Circulars</Text>
      {circulars.map((ci) => (
        <AppCard key={ci.id}>
          <Text style={[styles.circularTitle, { color: c.text }]}>{ci.title}</Text>
          {ci.body && (
            <Text style={[styles.circularBody, { color: c.textSecondary }]}>{ci.body}</Text>
          )}
          {ci.published_at && (
            <Text style={[styles.date, { color: c.textMuted }]}>{ci.published_at}</Text>
          )}
        </AppCard>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", marginBottom: 16, letterSpacing: -0.3 },
  circularTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  circularBody: { fontSize: 14, lineHeight: 20 },
  date: { fontSize: 12, marginTop: 8 },
});
