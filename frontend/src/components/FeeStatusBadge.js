// ============================================================
// FeeStatusBadge.js – Pill-shaped status badges
// ============================================================
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

const STATUS_MAP = {
  PAID: { emoji: "✓", labelColor: "#10b981" },
  PENDING: { emoji: "⏳", labelColor: "#f59e0b" },
  OVERDUE: { emoji: "!", labelColor: "#f43f5e" },
};

export default function FeeStatusBadge({ status }) {
  const { theme } = useTheme();
  const config = STATUS_MAP[status] || STATUS_MAP.PENDING;

  const bgColor =
    status === "PAID"
      ? theme.colors.successSoft
      : status === "OVERDUE"
      ? theme.colors.errorSoft
      : theme.colors.warningSoft;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, { color: config.labelColor }]}>
        {config.emoji} {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
