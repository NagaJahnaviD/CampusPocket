// ============================================================
// Tests for Realtime + AI services (Step 9 – Optional)
// ============================================================
// TDD: Written BEFORE implementation.
// ============================================================

import React from "react";
import { render, waitFor } from "@testing-library/react-native";

// ----------------------------------------------------------
// Mock Supabase client for realtime tests
// ----------------------------------------------------------
const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockRemoveChannel = jest.fn();

const mockChannel = {
  on: mockOn,
  subscribe: mockSubscribe,
};

// Make .on() chainable
mockOn.mockReturnValue(mockChannel);
mockSubscribe.mockReturnValue(mockChannel);

jest.mock("../src/services/supabaseClient", () => ({
  __esModule: true,
  supabase: {
    channel: (...args) => mockChannel,
    removeChannel: (...args) => mockRemoveChannel(...args),
  },
}));

// Mock AuthContext for AIInsightCard
jest.mock("../src/context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => ({
    profile: { id: "u1", full_name: "Arjun" },
    role: "student",
  }),
}));

// Import AFTER mocks
import {
  subscribeToAttendanceUpdates,
  unsubscribe,
} from "../src/services/realtimeService";

import {
  generateStudentInsight,
} from "../src/services/aiInsightService";

import AIInsightCard from "../src/components/AIInsightCard";

beforeEach(() => {
  jest.clearAllMocks();
  // Re-chain after clear
  mockOn.mockReturnValue(mockChannel);
  mockSubscribe.mockReturnValue(mockChannel);
});

// ----------------------------------------------------------
// 1. Realtime Attendance Subscription
// ----------------------------------------------------------
describe("realtimeService", () => {
  it("should_call_onChange_when_attendance_realtime_event_arrives", () => {
    const onChange = jest.fn();

    const channel = subscribeToAttendanceUpdates("student-1", onChange);

    // Should have set up a channel and subscribed
    expect(mockOn).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalled();

    // Simulate a realtime event by calling the callback registered with .on()
    const onCall = mockOn.mock.calls[0];
    // .on('postgres_changes', { ... }, callback)
    const callback = onCall[2];
    callback({ new: { student_user_id: "student-1", status: "present" } });

    // onChange should have been called with the new data
    expect(onChange).toHaveBeenCalledWith({
      new: { student_user_id: "student-1", status: "present" },
    });
  });

  it("should_unsubscribe_channel", () => {
    unsubscribe(mockChannel);
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });
});

// ----------------------------------------------------------
// 2. AI Insight Service
// ----------------------------------------------------------
describe("aiInsightService", () => {
  it("should_return_fallback_when_ai_key_missing", async () => {
    // No EXPO_PUBLIC_GEMINI_API_KEY set
    const result = await generateStudentInsight({
      attendance_percentage: 85,
      average_grade: 78,
    });

    // Should return a fallback object, not crash
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("weaknesses");
    expect(result).toHaveProperty("recommendations");
  });
});

// ----------------------------------------------------------
// 3. AIInsightCard Component
// ----------------------------------------------------------
describe("AIInsightCard", () => {
  it("should_show_fallback_when_ai_key_missing", async () => {
    const { getByText } = render(
      <AIInsightCard studentData={{ attendance_percentage: 85 }} />
    );

    // Wait for async state updates to finish
    await waitFor(() => {
      expect(getByText(/AI insights/i)).toBeTruthy();
    });
  });

  it("should_render_strengths_weaknesses_recommendations", async () => {
    // Provide pre-computed insights
    const insights = {
      strengths: ["Good attendance at 90%"],
      weaknesses: ["Math grades need improvement"],
      recommendations: ["Practice more math problems"],
    };

    const { findByText } = render(
      <AIInsightCard studentData={{}} insights={insights} />
    );

    const strength = await findByText(/Good attendance/);
    expect(strength).toBeTruthy();

    const weakness = await findByText(/Math grades/);
    expect(weakness).toBeTruthy();

    const rec = await findByText(/Practice more/);
    expect(rec).toBeTruthy();
  });
});
