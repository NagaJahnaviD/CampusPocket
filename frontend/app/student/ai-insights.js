// ============================================================
// app/student/ai-insights.js – AI-Powered Student Insights
// ============================================================
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, Linking, ActivityIndicator,
  StyleSheet, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchStudentInsightData } from "../../src/services/api";
import { generateStudentInsight } from "../../src/services/aiInsightService";

import ScreenContainer from "../../src/components/ScreenContainer";
import AppCard from "../../src/components/AppCard";
import ErrorMessage from "../../src/components/ErrorMessage";

export default function AIInsightsScreen() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefresh, setIsRefresh] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => { loadInsights(); }, []);

  async function loadInsights(forceRefresh = false) {
    setLoading(true);
    setError(null);
    setInsight(null);

    if (!profile?.id) {
      setError("Not logged in");
      setLoading(false);
      return;
    }

    // Step 1: Gather student data
    const { data: studentData, error: dataErr } = await fetchStudentInsightData(profile.id);
    if (dataErr || !studentData) {
      setError(dataErr || "Could not load student data");
      setLoading(false);
      return;
    }

    // Step 2: Send to AI (with cache support)
    const result = await generateStudentInsight(studentData, forceRefresh);
    setInsight(result);
    setLoading(false);

    // Fade in animation
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }

  if (error) return <ErrorMessage message={error} onRetry={loadInsights} />;

  return (
    <ScreenContainer>
      {/* Header */}
      <LinearGradient
        colors={[c.primaryGradientStart, c.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Ionicons name="sparkles" size={36} color="#fff" />
        <Text style={styles.headerTitle}>AI Insights</Text>
        <Text style={styles.headerSub}>
          Powered by Google Gemini
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>
            Analyzing your performance...
          </Text>
          <Text style={[styles.loadingHint, { color: c.textMuted }]}>
            This may take up to 30s if retrying...
          </Text>
        </View>
      ) : insight ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Source badge */}
          {insight.source && (
            <View style={[styles.sourceBadge, {
              backgroundColor: insight.source === "gemini" ? "#10b98120" : c.primaryLight,
            }]}>
              <Text style={[styles.sourceText, {
                color: insight.source === "gemini" ? "#10b981" : c.textMuted,
              }]}>
                {insight.source === "gemini" ? "Powered by Gemini AI"
                  : insight.source === "cache" ? "Cached result"
                  : "Smart Analysis"}
              </Text>
            </View>
          )}

          {/* Performance Summary */}
          <AppCard>
            <Ionicons name="bar-chart-outline" size={20} color={c.primary} />
            <Text style={[styles.sectionTitle, { color: c.text }]}>Performance Summary</Text>
            <Text style={[styles.summaryText, { color: c.textSecondary }]}>
              {insight.summary}
            </Text>
          </AppCard>

          {/* Strengths */}
          {insight.strengths?.length > 0 && (
            <AppCard>
              <Ionicons name="trophy-outline" size={20} color={c.success} />
              <Text style={[styles.sectionTitle, { color: c.success }]}>Strengths</Text>
              {insight.strengths.map((s, i) => (
                <View key={`str-${i}`} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: c.success }]}>●</Text>
                  <Text style={[styles.bulletText, { color: c.text }]}>{s}</Text>
                </View>
              ))}
            </AppCard>
          )}

          {/* Weaknesses */}
          {insight.weaknesses?.length > 0 && (
            <AppCard>
              <Text style={[styles.sectionIcon]}>⚠️</Text>
              <Text style={[styles.sectionTitle, { color: c.warning }]}>Areas for Improvement</Text>
              {insight.weaknesses.map((w, i) => (
                <View key={`wk-${i}`} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: c.warning }]}>●</Text>
                  <Text style={[styles.bulletText, { color: c.text }]}>{w}</Text>
                </View>
              ))}
            </AppCard>
          )}

          {/* Subject Improvement Suggestions */}
          {insight.suggestions?.length > 0 && (
            <AppCard>
              <Ionicons name="bulb-outline" size={20} color={c.primary} />
              <Text style={[styles.sectionTitle, { color: c.primary }]}>Improvement Suggestions</Text>
              {insight.suggestions.map((sg, i) => (
                <View key={`sg-${i}`} style={[styles.suggestionCard, { backgroundColor: c.primaryLight }]}>
                  <Text style={[styles.suggestionSubject, { color: c.primary }]}>
                    {sg.subject}
                  </Text>
                  <Text style={[styles.suggestionTip, { color: c.text }]}>
                    {sg.tip}
                  </Text>
                </View>
              ))}
            </AppCard>
          )}

          {/* Learning Resources */}
          {insight.resources?.length > 0 && (
            <AppCard>
              <Ionicons name="book-outline" size={20} color={c.accent} />
              <Text style={[styles.sectionTitle, { color: c.accent }]}>Recommended Resources</Text>
              {insight.resources.map((r, i) => (
                <TouchableOpacity
                  key={`res-${i}`}
                  style={[styles.resourceCard, { backgroundColor: c.surface, borderColor: c.border }]}
                  onPress={() => Linking.openURL(r.url)}
                  activeOpacity={0.7}
                >
                  <View style={styles.resourceIcon}>
                    <Text style={styles.youtubeIcon}>▶️</Text>
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={[styles.resourceTitle, { color: c.text }]}>{r.title}</Text>
                    <Text style={[styles.resourceSubject, { color: c.textMuted }]}>{r.subject}</Text>
                  </View>
                  <Text style={[styles.resourceArrow, { color: c.primary }]}>→</Text>
                </TouchableOpacity>
              ))}
            </AppCard>
          )}

          {/* Regenerate Button */}
          <TouchableOpacity onPress={() => loadInsights(true)} activeOpacity={0.8}>
            <LinearGradient
              colors={[c.primaryGradientStart, c.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.regenButton}
            >
              <Text style={styles.regenText}>🔄 Regenerate Insights</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  // Loading
  loadingBox: { alignItems: "center", paddingVertical: 48 },
  loadingText: { fontSize: 16, fontWeight: "600", marginTop: 16 },
  loadingHint: { fontSize: 13, marginTop: 4 },
  // Sections
  sectionIcon: { fontSize: 28, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, letterSpacing: 0.2 },
  summaryText: { fontSize: 15, lineHeight: 22 },
  // Bullets
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 8 },
  bulletDot: { fontSize: 10, marginTop: 5 },
  bulletText: { fontSize: 14, lineHeight: 20, flex: 1 },
  // Suggestions
  suggestionCard: { borderRadius: 12, padding: 12, marginBottom: 8 },
  suggestionSubject: { fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  suggestionTip: { fontSize: 14, lineHeight: 20 },
  // Resources
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  resourceIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#ff000015",
    justifyContent: "center", alignItems: "center",
    marginRight: 12,
  },
  youtubeIcon: { fontSize: 20 },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 14, fontWeight: "600" },
  resourceSubject: { fontSize: 12, marginTop: 2 },
  resourceArrow: { fontSize: 20, fontWeight: "700" },
  // Regen button
  regenButton: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  regenText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Source badge
  sourceBadge: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, alignSelf: "center", marginBottom: 16 },
  sourceText: { fontSize: 12, fontWeight: "600" },
});
