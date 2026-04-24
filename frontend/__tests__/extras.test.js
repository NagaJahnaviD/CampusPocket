// ============================================================
// Tests for Extra Feature screens
// ============================================================
// TDD: Written BEFORE implementation.
// ============================================================

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// ----------------------------------------------------------
// Mocks
// ----------------------------------------------------------
const mockPush = jest.fn();
let mockParams = {};

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
  Slot: () => null,
}));

let mockAuthValues = {
  profile: { id: "u1", full_name: "Arjun", username: "arjun_s", role: "student" },
  role: "student",
  loading: false,
  session: { access_token: "abc" },
};

jest.mock("../src/context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => mockAuthValues,
}));

const mockFetchGradeGoal = jest.fn();
const mockFetchLeaderboard = jest.fn();
const mockFetchCampusEvents = jest.fn();
const mockFetchCirculars = jest.fn();
const mockFetchStudentActivities = jest.fn();
const mockFetchStudentDashboard = jest.fn();
const mockFetchStudentClassrooms = jest.fn();

jest.mock("../src/services/api", () => ({
  __esModule: true,
  fetchGradeGoal: (...a) => mockFetchGradeGoal(...a),
  fetchLeaderboard: (...a) => mockFetchLeaderboard(...a),
  fetchCampusEvents: (...a) => mockFetchCampusEvents(...a),
  fetchCirculars: (...a) => mockFetchCirculars(...a),
  fetchStudentActivities: (...a) => mockFetchStudentActivities(...a),
  fetchStudentDashboard: (...a) => mockFetchStudentDashboard(...a),
  fetchStudentClassrooms: (...a) => mockFetchStudentClassrooms(...a),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  fetchCurrentProfile: jest.fn(),
}));

// Import AFTER mocks
import GradeGoal from "../app/student/grade-goal";
import Leaderboard from "../app/student/leaderboard/[classroomId]";
import Calendar from "../app/calendar";
import Circulars from "../app/circulars";
import Activities from "../app/activities";

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

// ----------------------------------------------------------
// 1. Grade Goal Setter
// ----------------------------------------------------------
describe("GradeGoal", () => {
  it("should_calculate_grade_goal_when_target_entered", async () => {
    // Mock: student has 2 classrooms (now from fetchStudentClassrooms)
    mockFetchStudentClassrooms.mockResolvedValue({
      data: [
        { classroom_id: "c1", class_name: "Mathematics 10A" },
        { classroom_id: "c2", class_name: "Science 10A" },
      ],
      error: null,
    });

    mockFetchGradeGoal.mockResolvedValue({
      data: {
        current_average: 78,
        target_percentage: 90,
        needed_average_percentage: 95,
        is_possible: true,
        message: "You need to average 95% on remaining assignments",
      },
      error: null,
    });

    const { findByText, getByPlaceholderText, getByText } = render(
      <GradeGoal />
    );

    // Wait for classrooms to load
    const mathOption = await findByText("Mathematics 10A");
    expect(mathOption).toBeTruthy();

    // Select classroom and enter target
    fireEvent.press(mathOption);
    fireEvent.changeText(getByPlaceholderText("Target %"), "90");

    await act(async () => {
      fireEvent.press(getByText("Calculate"));
    });

    // Verify the API was called with correct args
    await waitFor(() => {
      expect(mockFetchGradeGoal).toHaveBeenCalledWith("c1", 90);
    });

    // Result card should appear
    const resultCard = await findByText(/Result/i);
    expect(resultCard).toBeTruthy();

    // Should show the needed average value
    const neededLabel = await findByText(/You Need/i);
    expect(neededLabel).toBeTruthy();
  });
});

// ----------------------------------------------------------
// 2. Anonymized Leaderboard
// ----------------------------------------------------------
describe("Leaderboard", () => {
  const MOCK_LEADERBOARD = {
    leaderboard: [
      { rank: 1, label: "Student #1", average_percentage: 95, is_me: false },
      { rank: 2, label: "Student #2", average_percentage: 88, is_me: true },
      { rank: 3, label: "Student #3", average_percentage: 82, is_me: false },
    ],
  };

  it("should_render_anonymized_leaderboard_without_names", async () => {
    mockParams = { classroomId: "c1" };
    mockFetchLeaderboard.mockResolvedValue({
      data: MOCK_LEADERBOARD,
      error: null,
    });

    const { findByText, queryByText } = render(<Leaderboard />);

    // Should show anonymous labels
    const s1 = await findByText("Student #1");
    expect(s1).toBeTruthy();

    const s3 = await findByText("Student #3");
    expect(s3).toBeTruthy();

    // Should NOT show real names
    expect(queryByText("Arjun Sharma")).toBeNull();
    expect(queryByText("Priya Patel")).toBeNull();
  });

  it("should_highlight_current_student_in_leaderboard", async () => {
    mockParams = { classroomId: "c1" };
    mockFetchLeaderboard.mockResolvedValue({
      data: MOCK_LEADERBOARD,
      error: null,
    });

    const { findByText } = render(<Leaderboard />);

    // Student #2 has is_me: true — should show indicator
    const myEntry = await findByText(/You/);
    expect(myEntry).toBeTruthy();
  });
});

// ----------------------------------------------------------
// 3. Campus Calendar
// ----------------------------------------------------------
describe("Calendar", () => {
  it("should_render_calendar_events_grouped_by_date", async () => {
    mockFetchCampusEvents.mockResolvedValue({
      data: [
        { id: "e1", title: "Sports Day", event_date: "2025-05-10", event_type: "event" },
        { id: "e2", title: "Math Exam", event_date: "2025-05-10", event_type: "exam" },
        { id: "e3", title: "Summer Break", event_date: "2025-06-01", event_type: "holiday" },
      ],
      error: null,
    });

    const { findByText } = render(<Calendar />);

    const sportsDay = await findByText("Sports Day");
    expect(sportsDay).toBeTruthy();

    const mathExam = await findByText("Math Exam");
    expect(mathExam).toBeTruthy();

    const summerBreak = await findByText("Summer Break");
    expect(summerBreak).toBeTruthy();
  });
});

// ----------------------------------------------------------
// 4. Digital Circulars
// ----------------------------------------------------------
describe("Circulars", () => {
  it("should_render_digital_circulars", async () => {
    mockFetchCirculars.mockResolvedValue({
      data: [
        {
          id: "c1",
          title: "Annual Day Notice",
          body: "All students must attend the annual day event.",
          published_at: "2025-04-01",
          audience: "all",
        },
        {
          id: "c2",
          title: "Fee Reminder",
          body: "Please pay your fees by end of month.",
          published_at: "2025-04-10",
          audience: "parents",
        },
      ],
      error: null,
    });

    const { findByText } = render(<Circulars />);

    const notice = await findByText("Annual Day Notice");
    expect(notice).toBeTruthy();

    const feeReminder = await findByText("Fee Reminder");
    expect(feeReminder).toBeTruthy();
  });
});

// ----------------------------------------------------------
// 5. Extracurricular Activities
// ----------------------------------------------------------
describe("Activities", () => {
  it("should_render_extracurricular_activities", async () => {
    mockFetchStudentActivities.mockResolvedValue({
      data: [
        {
          id: "a1",
          name: "Chess Club",
          description: "Weekly chess practice",
          day_of_week: "Monday",
          time_slot: "3:00 - 4:00 PM",
        },
        {
          id: "a2",
          name: "Basketball",
          description: "School basketball team",
          day_of_week: "Wednesday",
          time_slot: "4:00 - 5:30 PM",
        },
      ],
      error: null,
    });

    const { findByText } = render(<Activities />);

    const chess = await findByText("Chess Club");
    expect(chess).toBeTruthy();

    const basketball = await findByText("Basketball");
    expect(basketball).toBeTruthy();

    const monday = await findByText(/Monday/);
    expect(monday).toBeTruthy();
  });
});
