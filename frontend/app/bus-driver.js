// ============================================================
// app/bus-driver.js – Bus Driver GPS Simulator
// ============================================================
// Uses phone GPS to simulate bus location.
// Broadcasts position via Supabase Realtime every 3 seconds.
// Open this screen on one phone to act as the "bus".
// ============================================================
import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useTheme } from "../src/context/ThemeContext";
import { createBusChannel } from "../src/services/busTrackingService";

export default function BusDriverScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [broadcasting, setBroadcasting] = useState(false);
  const [location, setLocation] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [error, setError] = useState(null);

  const channelRef = useRef(null);
  const watchRef = useRef(null);

  // Request location permission
  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location permission denied. Please enable it in Settings.");
      return false;
    }
    return true;
  }

  // Start broadcasting GPS
  async function startBroadcast() {
    setError(null);
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    // Create broadcast channel
    const bus = createBusChannel();
    channelRef.current = bus;

    // Watch phone position
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,     // Every 3 seconds
        distanceInterval: 5,    // Or every 5 meters
      },
      (loc) => {
        const { latitude, longitude } = loc.coords;
        const speed = loc.coords.speed || 0;

        setLocation({ lat: latitude, lng: longitude, speed });
        setUpdateCount((prev) => prev + 1);

        // Broadcast to all subscribers
        bus.sendLocation(latitude, longitude, speed);
      }
    );

    watchRef.current = subscription;
    setBroadcasting(true);
  }

  // Stop broadcasting
  function stopBroadcast() {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.stop();
      channelRef.current = null;
    }
    setBroadcasting(false);
    setUpdateCount(0);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => stopBroadcast();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={broadcasting ? ["#10b981", "#059669"] : [c.primaryGradientStart, c.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerIcon}>
            {broadcasting ? "📡" : "🚌"}
          </Text>
          <Text style={styles.headerTitle}>
            {broadcasting ? "Broadcasting Live" : "Bus Driver Mode"}
          </Text>
          <Text style={styles.headerSub}>
            {broadcasting
              ? "Students and parents can see your location"
              : "Start broadcasting to share your live location"
            }
          </Text>
        </LinearGradient>

        {/* Status */}
        {error && (
          <View style={[styles.errorBox, { backgroundColor: "#ef444420" }]}>
            <Text style={{ color: "#ef4444", fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {location && (
          <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Latitude</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>{location.lat.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Longitude</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>{location.lng.toFixed(6)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Speed</Text>
              <Text style={[styles.infoValue, { color: c.text }]}>
                {(location.speed * 3.6).toFixed(1)} km/h
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Updates Sent</Text>
              <Text style={[styles.infoValue, { color: c.primary }]}>{updateCount}</Text>
            </View>
          </View>
        )}

        {/* Broadcast toggle */}
        <TouchableOpacity
          onPress={broadcasting ? stopBroadcast : startBroadcast}
          activeOpacity={0.8}
          style={styles.btnWrap}
        >
          <LinearGradient
            colors={broadcasting ? ["#ef4444", "#dc2626"] : ["#10b981", "#059669"]}
            style={styles.bigButton}
          >
            <Text style={styles.bigButtonText}>
              {broadcasting ? "Stop Broadcasting" : "Start Broadcasting"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {!broadcasting && (
          <Text style={[styles.hint, { color: c.textMuted }]}>
            Open "Track Bus" on another phone to see your live location on a map.
          </Text>
        )}

        {broadcasting && (
          <View style={[styles.pulseWrap]}>
            <View style={[styles.pulseOuter, { borderColor: "#10b981" }]} />
            <View style={[styles.pulseInner, { backgroundColor: "#10b981" }]} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 20 },
  header: {
    borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 20,
  },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4, textAlign: "center" },
  errorBox: { borderRadius: 12, padding: 12, marginBottom: 16 },
  infoCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)",
  },
  infoLabel: { fontSize: 13, fontWeight: "600" },
  infoValue: { fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] },
  btnWrap: { marginBottom: 16 },
  bigButton: {
    borderRadius: 16, paddingVertical: 18, alignItems: "center",
  },
  bigButtonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  hint: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  pulseWrap: { alignItems: "center", marginTop: 30 },
  pulseOuter: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 3, opacity: 0.3,
    position: "absolute",
  },
  pulseInner: {
    width: 20, height: 20, borderRadius: 10, marginTop: 20,
  },
});
