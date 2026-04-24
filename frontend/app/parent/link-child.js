// ============================================================
// app/parent/link-child.js – Link Child Form (themed)
// ============================================================
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../src/context/ThemeContext";
import { useAuth } from "../../src/context/AuthContext";
import { linkChild } from "../../src/services/api";

import ScreenContainer from "../../src/components/ScreenContainer";
import AppCard from "../../src/components/AppCard";

export default function LinkChild() {
  const { theme } = useTheme();
  const { refreshProfile } = useAuth();
  const c = theme.colors;

  const [childUsername, setChildUsername] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleLink() {
    if (!childUsername.trim() || !childPassword.trim()) {
      setError("Please enter both fields");
      return;
    }
    setLinking(true); setError(null); setSuccess(false);
    const { data, error: e } = await linkChild(childUsername.trim(), childPassword);
    if (e) { setError(e); }
    else { setSuccess(true); if (refreshProfile) await refreshProfile(); }
    setLinking(false);
  }

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>🔗 Link a Child</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Enter your child's school credentials to link their account.
      </Text>

      <AppCard>
        <View style={[styles.inputWrapper, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.inputLabel, { color: c.textSecondary }]}>CHILD USERNAME</Text>
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="Child Username"
            placeholderTextColor={c.textMuted}
            value={childUsername}
            onChangeText={setChildUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.inputWrapper, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.inputLabel, { color: c.textSecondary }]}>CHILD PASSWORD</Text>
          <TextInput
            style={[styles.input, { color: c.text }]}
            placeholder="Child Password"
            placeholderTextColor={c.textMuted}
            value={childPassword}
            onChangeText={setChildPassword}
            secureTextEntry
          />
        </View>

        {error && (
          <View style={[styles.errorBanner, { backgroundColor: c.errorSoft }]}>
            <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={[styles.successBanner, { backgroundColor: c.successSoft }]}>
            <Text style={[styles.successText, { color: c.success }]}>
              ✅ Child linked successfully!
            </Text>
          </View>
        )}

        <TouchableOpacity onPress={handleLink} disabled={linking} activeOpacity={0.85}>
          <LinearGradient
            colors={[c.primaryGradientStart, c.primaryGradientEnd]}
            style={[styles.button, linking && { opacity: 0.6 }]}
          >
            {linking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Link Child</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.3, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  inputWrapper: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, marginBottom: 14 },
  inputLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 2 },
  input: { fontSize: 16, fontWeight: "500", paddingVertical: 4 },
  errorBanner: { borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  successBanner: { borderRadius: 12, padding: 12, marginBottom: 14 },
  successText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  button: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
