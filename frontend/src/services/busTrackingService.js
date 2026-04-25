// ============================================================
// busTrackingService.js – Live Bus Tracking via Supabase Realtime
// ============================================================
// Uses Supabase Realtime Broadcast (NO database tables needed).
//
// How it works:
//   - Bus driver phone sends GPS coords to a Supabase channel
//   - Student/parent phones subscribe to the same channel
//   - Location updates appear in real-time on the map
//
// No tables, no schema changes, just Realtime magic!
// ============================================================

import { supabase } from "./supabaseClient";

const BUS_CHANNEL = "bus-location"; // Channel name

// ----------------------------------------------------------
// DRIVER SIDE: Broadcast current location
// ----------------------------------------------------------
// Call this from the driver's phone every few seconds.
// Sends { lat, lng, timestamp, speed } to all subscribers.
export function createBusChannel() {
  const channel = supabase.channel(BUS_CHANNEL, {
    config: { broadcast: { self: true } },
  });

  channel.subscribe();

  return {
    channel,
    // Send a location update
    sendLocation: (lat, lng, speed = 0) => {
      channel.send({
        type: "broadcast",
        event: "location",
        payload: {
          lat,
          lng,
          speed,
          timestamp: Date.now(),
        },
      });
    },
    // Clean up
    stop: () => {
      supabase.removeChannel(channel);
    },
  };
}

// ----------------------------------------------------------
// VIEWER SIDE: Subscribe to bus location updates
// ----------------------------------------------------------
// Call this from student/parent screens.
// onLocation(payload) fires each time bus position is updated.
export function subscribeToBusLocation(onLocation) {
  const channel = supabase
    .channel(BUS_CHANNEL)
    .on("broadcast", { event: "location" }, (msg) => {
      if (msg.payload) {
        onLocation(msg.payload);
      }
    })
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}
