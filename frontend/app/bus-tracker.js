// ============================================================
// app/bus-tracker.js – Live Bus Tracker (Map View)
// ============================================================
// Subscribes to bus location via Supabase Realtime and
// displays it on an OpenStreetMap (via WebView).
// No API keys needed!
// ============================================================
import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, StyleSheet, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useTheme } from "../src/context/ThemeContext";
import { subscribeToBusLocation } from "../src/services/busTrackingService";

// Default center (India) — will be overridden by first bus location
const DEFAULT_LAT = 17.385;
const DEFAULT_LNG = 78.4867;

export default function BusTrackerScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const [busLocation, setBusLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connected, setConnected] = useState(false);
  const webviewRef = useRef(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for "live" indicator
  useEffect(() => {
    if (busLocation) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [busLocation]);

  // Subscribe to bus location updates
  useEffect(() => {
    setConnected(true);

    const unsubscribe = subscribeToBusLocation((payload) => {
      setBusLocation(payload);
      setLastUpdate(new Date());

      // Update map marker via JS injection
      if (webviewRef.current && payload.lat && payload.lng) {
        const js = `updateBusLocation(${payload.lat}, ${payload.lng}, ${payload.speed || 0}); true;`;
        webviewRef.current.injectJavaScript(js);
      }
    });

    return () => {
      setConnected(false);
      unsubscribe();
    };
  }, []);

  // Time since last update
  const timeSinceUpdate = lastUpdate
    ? Math.round((Date.now() - lastUpdate.getTime()) / 1000)
    : null;

  // Leaflet map HTML (OpenStreetMap — free, no API key)
  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; }
    .bus-icon {
      background: #10b981;
      border: 3px solid #fff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .pulse-ring {
      position: absolute;
      top: -8px; left: -8px;
      width: 40px; height: 40px;
      border-radius: 50%;
      border: 2px solid #10b981;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    .waiting-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      color: #fff;
      font-family: sans-serif;
      font-size: 16px;
      text-align: center;
      padding: 20px;
    }
    .waiting-overlay.hidden { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="waiting" class="waiting-overlay">
    <div>
      <div style="font-size:18px; margin-bottom:12px;"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>
      <div style="font-weight:bold; font-size:18px;">Waiting for bus...</div>
      <div style="margin-top:8px; opacity:0.7; font-size:13px;">
        The bus location will appear<br>once the driver starts broadcasting.
      </div>
    </div>
  </div>

  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
    }).setView([${DEFAULT_LAT}, ${DEFAULT_LNG}], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Bus marker with custom icon
    var busIcon = L.divIcon({
      html: '<div class="bus-icon"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div><div class="pulse-ring"></div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    var busMarker = null;
    var pathLine = null;
    var pathCoords = [];

    function updateBusLocation(lat, lng, speed) {
      // Hide waiting overlay
      document.getElementById('waiting').className = 'waiting-overlay hidden';

      if (!busMarker) {
        // First update — create marker and center map
        busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(map);
        busMarker.bindPopup('<b>School Bus</b><br>Speed: ' + (speed * 3.6).toFixed(1) + ' km/h');
        map.setView([lat, lng], 16);

        // Start path trail
        pathCoords.push([lat, lng]);
        pathLine = L.polyline(pathCoords, {
          color: '#FF9B71',
          weight: 4,
          opacity: 0.6,
          dashArray: '10, 8',
        }).addTo(map);
      } else {
        // Update marker position smoothly
        busMarker.setLatLng([lat, lng]);
        busMarker.setPopupContent('<b>School Bus</b><br>Speed: ' + (speed * 3.6).toFixed(1) + ' km/h');
        map.panTo([lat, lng], { animate: true, duration: 1 });

        // Extend path trail
        pathCoords.push([lat, lng]);
        if (pathLine) pathLine.setLatLngs(pathCoords);
      }
    }
  </script>
</body>
</html>
  `;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={["top"]}>
      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={styles.statusLeft}>
          <Animated.View
            style={[
              styles.liveDot,
              { backgroundColor: busLocation ? "#10b981" : "#f59e0b" },
              { opacity: busLocation ? pulseAnim : 1 },
            ]}
          />
          <Text style={[styles.statusText, { color: c.text }]}>
            {busLocation ? "Bus is LIVE" : "Waiting for bus..."}
          </Text>
        </View>
        {busLocation && (
          <Text style={[styles.speedText, { color: c.primary }]}>
            {(busLocation.speed * 3.6).toFixed(0)} km/h
          </Text>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          source={{ html: mapHTML }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scrollEnabled={false}
          originWhitelist={["*"]}
        />
      </View>

      {/* Bottom info */}
      {busLocation && (
        <View style={[styles.bottomInfo, { backgroundColor: c.surface, borderTopColor: c.border }]}>
          <View style={styles.bottomRow}>
            <Text style={[styles.bottomLabel, { color: c.textMuted }]}>Position</Text>
            <Text style={[styles.bottomValue, { color: c.text }]}>
              {busLocation.lat.toFixed(4)}, {busLocation.lng.toFixed(4)}
            </Text>
          </View>
          {lastUpdate && (
            <View style={styles.bottomRow}>
              <Text style={[styles.bottomLabel, { color: c.textMuted }]}>Last Update</Text>
              <Text style={[styles.bottomValue, { color: c.text }]}>
                {lastUpdate.toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  statusBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 15, fontWeight: "700" },
  speedText: { fontSize: 16, fontWeight: "800" },
  mapContainer: { flex: 1 },
  webview: { flex: 1 },
  bottomInfo: {
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1,
  },
  bottomRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: 4,
  },
  bottomLabel: { fontSize: 12, fontWeight: "600" },
  bottomValue: { fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
});
