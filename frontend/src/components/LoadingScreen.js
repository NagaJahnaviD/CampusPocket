// ============================================================
// LoadingScreen.js – Animated loading screen
// ============================================================
import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

export default function LoadingScreen({ message = "Loading..." }) {
  const { theme } = useTheme();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={[styles.dot, { opacity: pulse, backgroundColor: theme.colors.primary }]} />
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
