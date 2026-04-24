// ============================================================
// AIInsightCard.js – AI-powered student insight card
// ============================================================
// Displays strengths, weaknesses, and recommendations.
//
// Props:
//   studentData  – raw student data (attendance, grades, etc.)
//   insights     – optional pre-computed insights (skips API call)
//
// If no Gemini API key is configured, shows a rule-based fallback.
// If insights prop is provided, renders those directly.
// ============================================================

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { generateStudentInsight } from "../services/aiInsightService";
import AppCard from "./AppCard";
import theme from "../theme/theme";

export default function AIInsightCard({ studentData, insights: propInsights }) {
  const [insights, setInsights] = useState(propInsights || null);
  const [loading, setLoading] = useState(!propInsights);

  useEffect(() => {
    // If insights were provided as a prop, use them directly
    if (propInsights) {
      setInsights(propInsights);
      setLoading(false);
      return;
    }

    // Otherwise, generate insights
    loadInsights();
  }, [studentData, propInsights]);

  async function loadInsights() {
    setLoading(true);
    const result = await generateStudentInsight(studentData || {});
    setInsights(result);
    setLoading(false);
  }

  // Loading state
  if (loading) {
    return (
      <AppCard title="🤖 AI Insights">
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Analyzing your performance...</Text>
      </AppCard>
    );
  }

  // No insights available
  if (!insights) {
    return (
      <AppCard title="🤖 AI Insights">
        <Text style={styles.fallback}>
          AI insights are not configured yet.
        </Text>
      </AppCard>
    );
  }

  return (
    <AppCard title="🤖 AI Insights">
      {/* Strengths */}
      {insights.strengths && insights.strengths.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Strengths</Text>
          {insights.strengths.map((s, i) => (
            <Text key={`s-${i}`} style={styles.item}>
              • {s}
            </Text>
          ))}
        </View>
      )}

      {/* Weaknesses */}
      {insights.weaknesses && insights.weaknesses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Areas to Improve</Text>
          {insights.weaknesses.map((w, i) => (
            <Text key={`w-${i}`} style={styles.item}>
              • {w}
            </Text>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Recommendations</Text>
          {insights.recommendations.map((r, i) => (
            <Text key={`r-${i}`} style={styles.item}>
              • {r}
            </Text>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.medium,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  item: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    paddingLeft: theme.spacing.sm,
    marginBottom: 2,
    lineHeight: 22,
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  fallback: {
    fontSize: theme.fontSize.medium,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    padding: theme.spacing.md,
  },
});
