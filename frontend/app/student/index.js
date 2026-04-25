// ============================================================
// app/student/index.js – Student Dashboard (matches backend)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Circle, Trophy, GraduationCap, BookOpen, Users, CreditCard, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import {
  fetchStudentDashboard, fetchStudentClassrooms, fetchCampusEvents, fetchCirculars,
} from "../../src/services/api";
import { formatPercentage } from "../../src/utils/formatters";

import ScreenContainer from "../../src/components/ScreenContainer";
import AppCard from "../../src/components/AppCard";
import StatCard from "../../src/components/StatCard";
import LoadingScreen from "../../src/components/LoadingScreen";
import ErrorMessage from "../../src/components/ErrorMessage";
import EmptyState from "../../src/components/EmptyState";
import BottomNav from "../../src/components/BottomNav";

export default function StudentHome() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme, mode } = useTheme();
  const router = useRouter();
  const c = theme.colors;

  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [circulars, setCirculars] = useState([]);
  const [classroomList, setClassroomList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    const [dashResult, eventsResult, circularsResult, classResult] = await Promise.all([
      fetchStudentDashboard(), fetchCampusEvents(), fetchCirculars(),
      profile?.id ? fetchStudentClassrooms(profile.id) : { data: [], error: null },
    ]);
    if (dashResult.error) { setError(dashResult.error); setLoading(false); return; }
    setDashboard(dashResult.data);
    setEvents(eventsResult.data || []);
    setCirculars(circularsResult.data || []);
    setClassroomList(classResult.data || []);
    setLoading(false);
  }

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  if (loading) return <LoadingScreen message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!dashboard) return <EmptyState message="No dashboard data" />;

  // Backend returns: attendance_percentage, average_grade, unpaid_fees_count, upcoming_events
  // Also support the expanded format with classrooms/unpaid_fees arrays (if backend is updated)
  const attendancePct = dashboard.attendance_percentage
    ?? dashboard.overall_attendance_percentage ?? 0;
  const avgGrade = dashboard.average_grade
    ?? dashboard.overall_average_grade ?? 0;
  const unpaidFeesCount = dashboard.unpaid_fees_count ?? 0;
  const classrooms = classroomList.length > 0 ? classroomList : (dashboard.classrooms || []);
  const unpaidFees = dashboard.unpaid_fees || [];
  const recentSubmissions = dashboard.recent_submissions || [];
  const upcomingEvents = dashboard.upcoming_events || [];

  return (
    <>
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.name, { color: c.text }]}>
            {profile?.full_name || "Student"}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconBtn}>
            <Text style={{ fontSize: 20 }}>{mode === "dark" ? "☀️" : "🌙"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutPill, { backgroundColor: c.errorSoft }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: c.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats - 3 Column Grid */}
      <View style={styles.gridRow}>
        <View style={[styles.gridCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Circle color={c.primary} size={24} strokeWidth={1.5} />
          <Text style={[styles.gridValue, { color: c.text }]}>{formatPercentage(attendancePct)}</Text>
          <Text style={[styles.gridLabel, { color: c.textSecondary }]}>Attendance</Text>
        </View>
        <View style={[styles.gridCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Trophy color={c.warning} size={24} strokeWidth={1.5} />
          <Text style={[styles.gridValue, styles.fontMatrix, { color: c.text }]}>#04</Text>
          <Text style={[styles.gridLabel, { color: c.textSecondary }]}>Rank</Text>
        </View>
        <View style={[styles.gridCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <GraduationCap color={c.success} size={24} strokeWidth={1.5} />
          <Text style={[styles.gridValue, { color: c.text }]}>{formatPercentage(avgGrade)}</Text>
          <Text style={[styles.gridLabel, { color: c.textSecondary }]}>Avg Grade</Text>
        </View>
      </View>

      {/* Fee alert (from count) */}
      {unpaidFeesCount > 0 && (
        <AppCard>
          <View style={[styles.alertBar, { backgroundColor: c.warningSoft }]}>
            <Text style={[styles.alertText, { color: c.warning }]}>
              ⚠️ You have {unpaidFeesCount} unpaid fee{unpaidFeesCount > 1 ? "s" : ""}
            </Text>
          </View>
        </AppCard>
      )}

      {/* Fee alerts (from array, if available) — tap to go to Fees page */}
      {unpaidFees.length > 0 && (
        <TouchableOpacity onPress={() => router.push("/student/fees")} activeOpacity={0.8}>
          <AppCard title="Fee Alerts">
            {unpaidFees.map((fee) => (
              <View key={fee.id} style={styles.feeRow}>
                <CreditCard color={fee.status === "OVERDUE" ? "#FF9B71" : c.textMuted} size={20} strokeWidth={1.5} />
                <Text style={[styles.feeText, { color: fee.status === "OVERDUE" ? "#FF9B71" : c.text }]}>{fee.description}</Text>
              </View>
            ))}
            <Text style={[styles.feeTapHint, { color: c.primary }]}>Tap to pay →</Text>
          </AppCard>
        </TouchableOpacity>
      )}

      {/* AI Insights CTA */}
      <TouchableOpacity
        onPress={() => router.push("/student/ai-insights")}
        activeOpacity={0.8}
        style={[styles.aiCard, { backgroundColor: c.primaryLight, borderColor: c.primary }]}
      >
        <Sparkles color={c.primary} size={28} strokeWidth={1.5} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.aiTitle, { color: c.primary }]}>AI Insights</Text>
          <Text style={[styles.aiSub, { color: c.textSecondary }]}>
            Get personalized recommendations
          </Text>
        </View>
        <Text style={[styles.aiArrow, { color: c.primary }]}>→</Text>
      </TouchableOpacity>

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        {[
          { label: "Grade Goal", route: "/student/grade-goal" },
          { label: "Fees", route: "/student/fees" },
          { label: "Track Bus", route: "/bus-tracker" },
          { label: "Calendar", route: "/calendar" },
          { label: "Notices", route: "/circulars" },
          { label: "Activities", route: "/activities" },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            style={[styles.chip, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => router.push(item.route)}
          >
            <Text style={[styles.chipText, { color: c.primary }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Classes (if backend returns classrooms) */}
      {classrooms.length > 0 && (
        <AppCard title="My Classes">
          {classrooms.map((cls) => (
            <TouchableOpacity
              key={cls.classroom_id}
              style={[styles.classCard, { backgroundColor: c.surfaceElevated, borderColor: c.border, borderWidth: 1 }]}
              onPress={() => router.push(`/student/class/${cls.classroom_id}`)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <BookOpen color={c.textMuted} size={20} strokeWidth={1.5} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.className, { color: c.text }]}>{cls.class_name}</Text>
                  {cls.subject ? (
                    <Text style={[styles.classSubject, { color: c.textMuted }]}>{cls.subject}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.classStats}>
                <Text style={[styles.classStat, { color: c.textSecondary }]}>
                  Att: {cls.attendance_percentage != null ? formatPercentage(cls.attendance_percentage) : "N/A"}
                </Text>
                <Text style={[styles.classStat, { color: c.textSecondary }]}>
                   Avg: {cls.average_grade != null ? formatPercentage(cls.average_grade) : "N/A"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/student/leaderboard/${cls.classroom_id}`)}
              >
                <Text style={[styles.leaderboardLink, { color: c.primary }]}>
                  Leaderboard →
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </AppCard>
      )}

      {/* Recent Submissions (if available) */}
      {recentSubmissions.length > 0 && (
        <AppCard title="Recent Submissions">
          {recentSubmissions.map((sub) => (
            <View key={sub.id} style={styles.subRow}>
              <Text style={[styles.subTitle, { color: c.text }]}>{sub.title}</Text>
              <Text style={[styles.subScore, { color: c.primary }]}>
                {formatPercentage(sub.percentage)}
              </Text>
            </View>
          ))}
        </AppCard>
      )}

      {/* Upcoming Events (from RPC) */}
      {upcomingEvents.length > 0 && (
        <AppCard title="Upcoming Events">
          {upcomingEvents.map((e, i) => (
            <View key={e.id || i} style={styles.previewRow}>
              <Text style={[styles.previewTitle, { color: c.text }]}>{e.title}</Text>
              <Text style={[styles.previewDate, { color: c.textMuted }]}>{e.event_date}</Text>
            </View>
          ))}
        </AppCard>
      )}

      {/* Circulars */}
      {circulars.length > 0 && (
        <AppCard title="Recent Circulars">
          {circulars.slice(0, 3).map((ci) => (
            <View key={ci.id} style={styles.previewRow}>
              <Text style={[styles.previewTitle, { color: c.text }]}>{ci.title}</Text>
            </View>
          ))}
        </AppCard>
      )}

      {/* Separate events feed (from fetchCampusEvents) */}
      {events.length > 0 && upcomingEvents.length === 0 && (
        <AppCard title="Campus Events">
          {events.slice(0, 3).map((e) => (
            <View key={e.id} style={styles.previewRow}>
              <Text style={[styles.previewTitle, { color: c.text }]}>{e.title}</Text>
              <Text style={[styles.previewDate, { color: c.textMuted }]}>{e.event_date}</Text>
            </View>
          ))}
        </AppCard>
      )}
    </ScreenContainer>
    <BottomNav />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontSize: 14, fontWeight: "500", letterSpacing: 0.3 },
  name: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { padding: 8 },
  logoutPill: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  logoutText: { fontWeight: "700", fontSize: 13 },
  // 3-col grid styles
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  gridCard: { flex: 1, alignItems: "center", padding: 16, borderRadius: 20, borderWidth: 1 },
  gridValue: { fontSize: 22, fontWeight: "800", marginTop: 8 },
  gridLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 },
  fontMatrix: { fontFamily: "monospace" }, // Replace with actual dot-matrix font if available
  
  alertBar: { borderRadius: 10, padding: 12 },
  alertText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  feeRow: { paddingVertical: 6 },
  feeText: { fontSize: 14 },
  feeTapHint: { fontSize: 13, fontWeight: "700", textAlign: "right", marginTop: 8 },
  quickLinks: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontSize: 13, fontWeight: "600" },
  classCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
  className: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  classSubject: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  classStats: { flexDirection: "row", gap: 16 },
  classStat: { fontSize: 13, fontWeight: "500" },
  leaderboardLink: { marginTop: 8, fontSize: 13, fontWeight: "700" },
  subRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  subTitle: { fontSize: 14, fontWeight: "500" },
  subScore: { fontSize: 14, fontWeight: "700" },
  previewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  previewTitle: { fontSize: 14, fontWeight: "500", flex: 1 },
  previewDate: { fontSize: 12, fontWeight: "500" },
  // AI Insights card
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  aiEmoji: { fontSize: 32 },
  aiTitle: { fontSize: 16, fontWeight: "700" },
  aiSub: { fontSize: 13, marginTop: 2 },
  aiArrow: { fontSize: 22, fontWeight: "700" },
});
