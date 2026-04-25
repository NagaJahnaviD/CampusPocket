// ============================================================
// app/calendar.js – Premium Monthly Grid Calendar (Peach Theme)
// ============================================================
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View, Text, TouchableOpacity, Animated, Dimensions,
  StyleSheet, ScrollView, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/context/ThemeContext";
import { fetchCalendarData } from "../src/services/api";

const SCREEN_W = Dimensions.get("window").width;
const GRID_PAD = 16; // horizontal padding on each side
const CELL_GAP = 1;
const CELL_W = Math.floor((SCREEN_W - GRID_PAD * 2) / 7);
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ── Event type config ──
const TYPE_CFG = {
  holiday:    { bg: "#fef2f2", color: "#dc2626", icon: "umbrella-beach",       lib: "mci", label: "Holiday" },
  exam:       { bg: "#fffbeb", color: "#d97706", icon: "clipboard-text-outline", lib: "mci", label: "Exam" },
  sports:     { bg: "#ecfdf5", color: "#059669", icon: "basketball",           lib: "ion", label: "Sports" },
  event:      { bg: "#f5f3ff", color: "#7c3aed", icon: "star",                lib: "ion", label: "Event" },
  assignment: { bg: "#eff6ff", color: "#2563eb", icon: "document-text",        lib: "ion", label: "Assignment" },
  fee:        { bg: "#fdf2f8", color: "#db2777", icon: "wallet",              lib: "ion", label: "Fee Due" },
};

function cfg(type) { return TYPE_CFG[type] || TYPE_CFG.event; }

function TypeIcon({ type, size = 16 }) {
  const c = cfg(type);
  if (c.lib === "mci") return <MaterialCommunityIcons name={c.icon} size={size} color={c.color} />;
  return <Ionicons name={c.icon} size={size} color={c.color} />;
}

// ── Helpers ──
function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function firstDow(y, m) { return new Date(y, m, 1).getDay(); }
function dk(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function isToday(y, m, d) {
  const n = new Date();
  return n.getFullYear() === y && n.getMonth() === m && n.getDate() === d;
}

// ============================================================
export default function CalendarScreen() {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const tc = theme.colors;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true); setErr(null);
    const { data, error } = await fetchCalendarData(profile?.id);
    if (error) setErr(error);
    else {
      setItems(data || []);
      // Auto-navigate to month with data if current is empty
      if (data && data.length > 0) {
        const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const hasCur = data.some((d) => d.date && d.date.startsWith(curKey));
        if (!hasCur) {
          const f = data[0].date;
          if (f) { const [fy, fm] = f.split("-").map(Number); setYear(fy); setMonth(fm - 1); }
        }
      }
    }
    setLoading(false);
  }

  // Group by date
  const dateMap = useMemo(() => {
    const m = {};
    items.forEach((it) => { if (!it.date) return; if (!m[it.date]) m[it.date] = []; m[it.date].push(it); });
    return m;
  }, [items]);

  function prevMonth() { setSelected(null); if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1); }
  function nextMonth() { setSelected(null); if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1); }
  function goToday() { setSelected(null); setYear(now.getFullYear()); setMonth(now.getMonth()); }

  function selectDay(key) {
    if (selected === key) {
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setSelected(null));
    } else {
      setSelected(key);
      slideAnim.setValue(0);
      Animated.spring(slideAnim, { toValue: 1, friction: 8, useNativeDriver: false }).start();
    }
  }

  // Build grid — exactly 7 per row, including all days Mon-Sat
  const numDays = daysInMonth(year, month);
  const startDay = firstDow(year, month);
  const rows = Math.ceil((startDay + numDays) / 7);
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < 7; col++) {
      const idx = r * 7 + col;
      const d = idx - startDay + 1;
      if (d < 1 || d > numDays) { cells.push(null); }
      else {
        const key = dk(year, month, d);
        cells.push({ day: d, key, events: dateMap[key] || [] });
      }
    }
  }

  const selItems = selected ? (dateMap[selected] || []) : [];

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.center}><ActivityIndicator size="large" color={tc.primary} />
        <Text style={[styles.centerText, { color: tc.textMuted }]}>Loading calendar...</Text></View>
      </SafeAreaView>
    );
  }
  if (err) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
        <View style={styles.center}><Ionicons name="alert-circle" size={40} color="#ef4444" />
        <Text style={[styles.centerText, { color: "#ef4444" }]}>{err}</Text>
        <TouchableOpacity onPress={load} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></TouchableOpacity></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: tc.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Month Header ── */}
        <LinearGradient
          colors={[tc.primaryGradientStart, tc.primaryGradientEnd, tc.primaryGradientEnd + "AA"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.monthName}>{MONTHS[month]}</Text>
            <Text style={styles.yearText}>{year}</Text>
          </View>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={26} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Legend ── */}
        <View style={styles.legend}>
          {Object.entries(TYPE_CFG).map(([type, c]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: c.color }]} />
              <Text style={[styles.legendLabel, { color: tc.textSecondary }]}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Day-of-week headers ── */}
        <View style={styles.weekRow}>
          {DAY_LABELS.map((d, i) => (
            <Text key={d} style={[styles.weekText, { color: i === 0 ? "#ef4444" : tc.textMuted, width: CELL_W }]}>{d}</Text>
          ))}
        </View>

        {/* ── Calendar Grid ── */}
        <View style={[styles.grid, { backgroundColor: tc.surface, borderColor: tc.border }]}>
          {cells.map((cell, i) => {
            if (!cell) return <View key={`e${i}`} style={styles.cell} />;

            const { day, key, events } = cell;
            const today = isToday(year, month, day);
            const isSel = selected === key;
            const isSun = i % 7 === 0;
            const hasEv = events.length > 0;
            const mainCfg = hasEv ? cfg(events[0].type) : null;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.cell,
                  hasEv && { backgroundColor: mainCfg.color + "14" },
                  isSel && styles.cellSelected,
                  today && !isSel && styles.cellToday,
                ]}
                onPress={() => hasEv && selectDay(key)}
                activeOpacity={hasEv ? 0.6 : 1}
              >
                {/* Day number */}
                <Text style={[
                  styles.dayNum,
                  { color: isSun ? "#ef4444" : tc.text },
                  today && styles.dayToday,
                  isSel && styles.dayToday,
                ]}>{day}</Text>

                {/* Event indicator — colored bar + label */}
                {hasEv && (
                  <View style={[styles.eventBar, { backgroundColor: mainCfg.color }]}>
                    <Text style={styles.eventBarText} numberOfLines={1}>
                      {events[0].title.length > 8 ? events[0].title.slice(0, 7) + ".." : events[0].title}
                    </Text>
                  </View>
                )}

                {/* Extra dots if multiple events */}
                {events.length > 1 && (
                  <View style={styles.dotsRow}>
                    {events.slice(1, 4).map((ev, j) => (
                      <View key={j} style={[styles.dot, { backgroundColor: cfg(ev.type).color }]} />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Detail Panel ── */}
        {selected && selItems.length > 0 && (
          <Animated.View style={[
            styles.detailPanel,
            { backgroundColor: tc.surface, borderColor: tc.border },
            {
              opacity: slideAnim,
              transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            },
          ]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailDate, { color: tc.text }]}>
                {new Date(selected + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </Text>
              <TouchableOpacity onPress={() => selectDay(selected)}>
                <Ionicons name="close-circle" size={24} color={tc.textMuted} />
              </TouchableOpacity>
            </View>

            {selItems.map((item, i) => {
              const c = cfg(item.type);
              return (
                <View key={item.id || i} style={[styles.detailCard, { borderLeftColor: c.color, backgroundColor: c.bg }]}>
                  <View style={[styles.iconCircle, { backgroundColor: c.color + "20" }]}>
                    <TypeIcon type={item.type} size={22} />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={[styles.detailTitle, { color: "#1e293b" }]}>{item.title}</Text>
                    <View style={styles.detailMeta}>
                      <View style={[styles.typePill, { backgroundColor: c.color + "18" }]}>
                        <Text style={[styles.typePillText, { color: c.color }]}>{c.label}</Text>
                      </View>
                      {item.description ? (
                        <Text style={styles.detailDesc}>{item.description}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}

        {/* ── Go to Today button ── */}
        {(month !== now.getMonth() || year !== now.getFullYear()) && (
          <TouchableOpacity onPress={goToday} style={styles.todayWrap}>
            <LinearGradient colors={[tc.primaryGradientStart, tc.primaryGradientEnd]} style={styles.todayBtn}>
              <Ionicons name="today-outline" size={16} color="#fff" />
              <Text style={styles.todayText}>Today</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: GRID_PAD, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  centerText: { fontSize: 14, marginTop: 8 },
  retryBtn: { backgroundColor: "#FF9B71", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, marginTop: 8 },
  retryText: { color: "#fff", fontWeight: "700" },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 22, paddingVertical: 22, paddingHorizontal: 16, marginBottom: 14,
    shadowColor: "#FF9B71", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14,
    elevation: 8,
  },
  navBtn: { padding: 6 },
  headerCenter: { alignItems: "center" },
  monthName: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  yearText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)", marginTop: 2 },

  // Legend
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 2, marginBottom: 12, paddingHorizontal: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", marginRight: 8, marginBottom: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendLabel: { fontSize: 10, fontWeight: "700" },

  // Week row
  weekRow: { flexDirection: "row", marginBottom: 6 },
  weekText: { fontSize: 11, fontWeight: "800", textAlign: "center", letterSpacing: 0.5 },

  // Grid
  grid: {
    flexDirection: "row", flexWrap: "wrap", borderRadius: 16, borderWidth: 1,
    overflow: "hidden",
  },
  cell: {
    width: CELL_W, minHeight: CELL_W + 4, padding: 2,
    alignItems: "center", justifyContent: "flex-start",
  },
  cellSelected: {
    backgroundColor: "#FF9B7122", borderColor: "#FF9B71", borderWidth: 2, borderRadius: 10,
  },
  cellToday: {
    borderColor: "#FF9B71", borderWidth: 1.5, borderRadius: 10,
  },
  dayNum: { fontSize: 14, fontWeight: "600", marginTop: 2, marginBottom: 2 },
  dayToday: { color: "#FF9B71", fontWeight: "900" },

  // Event bar inside cell — key change for visibility
  eventBar: {
    borderRadius: 4, paddingHorizontal: 2, paddingVertical: 1,
    width: "92%", alignItems: "center", marginBottom: 1,
  },
  eventBarText: { color: "#fff", fontSize: 7, fontWeight: "800", textTransform: "uppercase" },

  // Extra dots
  dotsRow: { flexDirection: "row", gap: 2, marginTop: 1 },
  dot: { width: 4, height: 4, borderRadius: 2 },

  // Detail panel
  detailPanel: {
    borderRadius: 18, borderWidth: 1, padding: 16, marginTop: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8,
    elevation: 4,
  },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  detailDate: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3, flex: 1 },
  detailCard: {
    flexDirection: "row", alignItems: "center",
    borderLeftWidth: 4, borderRadius: 12, padding: 12, marginBottom: 10,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  detailInfo: { flex: 1 },
  detailTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  detailMeta: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  typePill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  typePillText: { fontSize: 10, fontWeight: "800" },
  detailDesc: { fontSize: 12, color: "#64748b" },

  // Today
  todayWrap: { alignSelf: "center", marginTop: 16 },
  todayBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10,
  },
  todayText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
