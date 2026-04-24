// ============================================================
// ScreenContainer.js – Premium safe area wrapper
// ============================================================
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

export default function ScreenContainer({ children, scrollable = true }) {
  const { theme } = useTheme();
  const bg = { backgroundColor: theme.colors.background };

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.safe, bg]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, styles.content, bg]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
});
