// ============================================================
// app/index.js – Premium Login Screen
// ============================================================
import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";

export default function IndexScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const { signIn } = useAuth();
  const router = useRouter();
  const { theme, mode, toggleTheme } = useTheme();
  const c = theme.colors;

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      setLoginError("Please enter both username and password");
      return;
    }
    setLoginLoading(true);
    setLoginError(null);

    const { profile, error } = await signIn(username.trim(), password);
    if (error) {
      setLoginError(error);
      setLoginLoading(false);
      return;
    }
    if (profile?.role === "student") router.replace("/student");
    else if (profile?.role === "parent") router.replace("/parent");
    setLoginLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Header with gradient text effect */}
        <View style={styles.logoArea}>
          <Ionicons name="school-outline" size={48} color={c.primary} />
          <Text style={[styles.title, { color: c.primary }]}>Campus Pocket</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Your school, in your pocket
          </Text>
        </View>

        {/* Inputs */}
        <View style={[styles.inputWrapper, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.inputLabel, { color: c.textSecondary }]}>USERNAME</Text>
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="e.g. arjun_s"
            placeholderTextColor={c.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={[styles.inputWrapper, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.inputLabel, { color: c.textSecondary }]}>PASSWORD</Text>
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="Enter password"
            placeholderTextColor={c.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Error */}
        {loginError && (
          <View style={[styles.errorBanner, { backgroundColor: c.errorSoft }]}>
            <Text style={[styles.errorText, { color: c.error }]}>{loginError}</Text>
          </View>
        )}

        {/* Login Button */}
        <TouchableOpacity onPress={handleLogin} disabled={loginLoading} activeOpacity={0.85}>
          <LinearGradient
            colors={[c.primaryGradientStart, c.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, loginLoading && { opacity: 0.7 }]}
          >
            {loginLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Demo hint */}
        <View style={[styles.hintCard, { backgroundColor: c.primaryLight }]}>
          <Text style={[styles.hintTitle, { color: c.primary }]}>Demo Credentials</Text>
          <Text style={[styles.hintText, { color: c.textSecondary }]}>Student: arjun_s / password123</Text>
          <Text style={[styles.hintText, { color: c.textSecondary }]}>Parent: vikram_parent / password123</Text>
        </View>

        {/* Theme toggle */}
        <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
          <Text style={[styles.themeToggleText, { color: c.textSecondary }]}>
            {mode === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28 },
  logoArea: { alignItems: "center", marginBottom: 36 },
  logoEmoji: { fontSize: 52, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, fontWeight: "500", marginTop: 4, letterSpacing: 0.2 },
  inputWrapper: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16,
    paddingTop: 10, paddingBottom: 6, marginBottom: 14,
  },
  inputLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 2 },
  input: { fontSize: 17, fontWeight: "500", paddingVertical: 4 },
  errorBanner: { borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  hintCard: { borderRadius: 12, padding: 14, marginTop: 24 },
  hintTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4, letterSpacing: 0.5 },
  hintText: { fontSize: 13, fontWeight: "500", lineHeight: 20 },
  themeToggle: { alignItems: "center", marginTop: 20 },
  themeToggleText: { fontSize: 14, fontWeight: "600" },
});
