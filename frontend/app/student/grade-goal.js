// ============================================================
// app/student/grade-goal.js – Grade Goal Setter (themed)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { fetchStudentClassrooms, fetchGradeGoal } from "../../src/services/api";
import { formatPercentage } from "../../src/utils/formatters";

import ScreenContainer from "../../src/components/ScreenContainer";
import AppCard from "../../src/components/AppCard";
import LoadingScreen from "../../src/components/LoadingScreen";
import ErrorMessage from "../../src/components/ErrorMessage";

export default function GradeGoal() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const c = theme.colors;

  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [targetInput, setTargetInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { loadClassrooms(); }, []);

  async function loadClassrooms() {
    setLoading(true);
    if (!profile?.id) {
      setError("Not logged in");
      setLoading(false);
      return;
    }
    const { data, error: e } = await fetchStudentClassrooms(profile.id);
    if (e) setError(e); else setClassrooms(data || []);
    setLoading(false);
  }

  async function handleCalculate() {
    if (!selectedClassroom) { setError("Please select a classroom"); return; }
    const target = parseFloat(targetInput);
    if (isNaN(target) || target <= 0 || target > 100) { setError("Enter 1–100"); return; }
    setCalculating(true); setError(null); setResult(null);
    const { data, error: e } = await fetchGradeGoal(selectedClassroom.classroom_id, target);
    if (e) setError(e); else setResult(data);
    setCalculating(false);
  }

  if (loading) return <LoadingScreen message="Loading classes..." />;

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: c.text }]}>🎯 Grade Goal Setter</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Select a class and set your target grade.
      </Text>

      <AppCard title="Select Class">
        {classrooms.length === 0 ? (
          <Text style={[styles.empty, { color: c.textMuted }]}>No classes found</Text>
        ) : (
          classrooms.map((cls) => {
            const selected = selectedClassroom?.classroom_id === cls.classroom_id;
            return (
              <TouchableOpacity
                key={cls.classroom_id}
                style={[
                  styles.classOption,
                  { backgroundColor: selected ? c.primary : c.primaryLight },
                ]}
                onPress={() => setSelectedClassroom(cls)}
              >
                <Text style={[styles.classOptionText, { color: selected ? "#fff" : c.text }]}>
                  {cls.class_name}{cls.subject ? ` — ${cls.subject}` : ""}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </AppCard>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { backgroundColor: c.surface, borderColor: c.border, color: c.text }]}
          placeholder="Target %"
          placeholderTextColor={c.textMuted}
          value={targetInput}
          onChangeText={setTargetInput}
          keyboardType="numeric"
        />
        <TouchableOpacity onPress={handleCalculate} disabled={calculating} activeOpacity={0.85}>
          <LinearGradient
            colors={[c.primaryGradientStart, c.primaryGradientEnd]}
            style={[styles.calcButton, calculating && { opacity: 0.6 }]}
          >
            {calculating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.calcButtonText}>Calculate</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage message={error} />}

      {result && (
        <AppCard title="📊 Result">
          {result.possible === false && result.message ? (
            /* All assignments completed — show message */
            <View style={styles.doneBox}>
              <Text style={[styles.doneEmoji]}>✅</Text>
              <Text style={[styles.doneText, { color: c.text }]}>
                {result.message}
              </Text>
              {result.current_average != null && (
                <Text style={[styles.doneAvg, { color: c.primary }]}>
                  Your average: {formatPercentage(result.current_average)}
                </Text>
              )}
            </View>
          ) : (
            /* Has remaining assignments — show breakdown */
            <>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: c.textSecondary }]}>Current Average:</Text>
                <Text style={[styles.resultValue, { color: c.text }]}>{formatPercentage(result.current_average)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: c.textSecondary }]}>Target:</Text>
                <Text style={[styles.resultValue, { color: c.text }]}>{formatPercentage(result.target_percentage)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: c.textSecondary }]}>You Need:</Text>
                <Text style={[styles.resultHighlight, { color: result.possible ? c.success : c.error }]}>
                  {formatPercentage(result.needed_average_percentage)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={[styles.resultLabel, { color: c.textSecondary }]}>Remaining:</Text>
                <Text style={[styles.resultValue, { color: c.text }]}>{result.remaining_assignments} assignment(s)</Text>
              </View>
              {!result.possible && (
                <Text style={[styles.resultMsg, { color: c.warning }]}>
                  ⚠️ This target may not be achievable
                </Text>
              )}
              {result.message && (
                <Text style={[styles.resultMsg, { color: c.textSecondary }]}>{result.message}</Text>
              )}
            </>
          )}
        </AppCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.3, marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  empty: { fontSize: 14, textAlign: "center", paddingVertical: 12 },
  classOption: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginBottom: 6 },
  classOptionText: { fontSize: 14, fontWeight: "600" },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16 },
  calcButton: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, justifyContent: "center" },
  calcButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  resultLabel: { fontSize: 14 },
  resultValue: { fontSize: 14, fontWeight: "700" },
  resultHighlight: { fontSize: 18, fontWeight: "800" },
  resultMsg: { marginTop: 8, fontSize: 13, fontStyle: "italic" },
  doneBox: { alignItems: "center", paddingVertical: 12 },
  doneEmoji: { fontSize: 36, marginBottom: 8 },
  doneText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  doneAvg: { fontSize: 20, fontWeight: "800", marginTop: 8 },
});
