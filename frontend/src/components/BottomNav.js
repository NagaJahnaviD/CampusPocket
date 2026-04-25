// ============================================================
// BottomNav.js – Dashboard bottom navigation bar
// ============================================================
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Home, Map, Calendar as CalendarIcon, Settings } from "lucide-react-native";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "expo-router";

export default function BottomNav() {
  const { theme } = useTheme();
  const router = useRouter();
  const c = theme.colors;

  return (
    <View style={[styles.navContainer, { backgroundColor: c.surface, borderTopColor: c.border }]}>
      <TouchableOpacity style={styles.navItem} onPress={() => router.push("/student")}>
        <Home color={c.primary} size={24} strokeWidth={1.5} />
        <Text style={[styles.navText, { color: c.primary }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push("/bus-tracker")}>
        <Map color={c.textMuted} size={24} strokeWidth={1.5} />
        <Text style={[styles.navText, { color: c.textMuted }]}>Transport</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => router.push("/calendar")}>
        <CalendarIcon color={c.textMuted} size={24} strokeWidth={1.5} />
        <Text style={[styles.navText, { color: c.textMuted }]}>Calendar</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => {}}>
        <Settings color={c.textMuted} size={24} strokeWidth={1.5} />
        <Text style={[styles.navText, { color: c.textMuted }]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingBottom: 24, // extra padding for bottom edge
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
