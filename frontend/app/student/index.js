// ============================================================
// app/student/index.js – Student Dashboard (matches backend)
// ============================================================
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
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
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Welcome back</Text>
          <Text style={[styles.name, { color: c.text }]}>
            {profile?.full_name || "Student"} 👋
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

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Attendance" value={formatPercentage(attendancePct)} />
        <StatCard label="Avg Grade" value={formatPercentage(avgGrade)} />
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

      {/* Fee alerts (from array, if available) */}
      {unpaidFees.length > 0 && (
        <AppCard title="💰 Fee Alerts">
          {unpaidFees.map((fee) => (
            <View key={fee.id} style={styles.feeRow}>
              <Text style={[styles.feeText, { color: c.text }]}>{fee.description}</Text>
            </View>
          ))}
        </AppCard>
      )}

      {/* Quick Links */}
      <View style={styles.quickLinks}>
        {[
          { label: "🎯 Grade Goal", route: "/student/grade-goal" },
          { label: "📅 Calendar", route: "/calendar" },
          { label: "📢 Notices", route: "/circulars" },
          { label: "⚽ Activities", route: "/activities" },
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
        <AppCard title="📚 My Classes">
          {classrooms.map((cls) => (
            <TouchableOpacity
              key={cls.classroom_id}
              style={[styles.classCard, { backgroundColor: c.primaryLight }]}
              onPress={() => router.push(`/student/class/${cls.classroom_id}`)}
              activeOpacity={0.7}
            >
              <Text style={[styles.className, { color: c.text }]}>{cls.class_name}</Text>
              {cls.subject ? (
                <Text style={[styles.classSubject, { color: c.textMuted }]}>{cls.subject}</Text>
              ) : null}
              <View style={styles.classStats}>
                <Text style={[styles.classStat, { color: c.textSecondary }]}>
                  📊 {formatPercentage(cls.attendance_percentage)}
                </Text>
                <Text style={[styles.classStat, { color: c.textSecondary }]}>
                  📝 {formatPercentage(cls.average_grade)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push(`/student/leaderboard/${cls.classroom_id}`)}
              >
                <Text style={[styles.leaderboardLink, { color: c.primary }]}>
                  🏆 Leaderboard →
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </AppCard>
      )}

      {/* Recent Submissions (if available) */}
      {recentSubmissions.length > 0 && (
        <AppCard title="📝 Recent Submissions">
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
        <AppCard title="🗓️ Upcoming Events">
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
        <AppCard title="📢 Recent Circulars">
          {circulars.slice(0, 3).map((ci) => (
            <View key={ci.id} style={styles.previewRow}>
              <Text style={[styles.previewTitle, { color: c.text }]}>{ci.title}</Text>
            </View>
          ))}
        </AppCard>
      )}

      {/* Separate events feed (from fetchCampusEvents) */}
      {events.length > 0 && upcomingEvents.length === 0 && (
        <AppCard title="🗓️ Campus Events">
          {events.slice(0, 3).map((e) => (
            <View key={e.id} style={styles.previewRow}>
              <Text style={[styles.previewTitle, { color: c.text }]}>{e.title}</Text>
              <Text style={[styles.previewDate, { color: c.textMuted }]}>{e.event_date}</Text>
            </View>
          ))}
        </AppCard>
      )}
    </ScreenContainer>
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
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  alertBar: { borderRadius: 10, padding: 12 },
  alertText: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  feeRow: { paddingVertical: 6 },
  feeText: { fontSize: 14 },
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
});
