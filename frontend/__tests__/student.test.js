// ============================================================
// Tests for Student Portal screens
// ============================================================
// TDD: Written BEFORE implementation.
// ============================================================

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

// ----------------------------------------------------------
// Mock expo-router
// ----------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockParams = {};

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
  Slot: () => null,
}));

// ----------------------------------------------------------
// Mock AuthContext
// ----------------------------------------------------------
let mockAuthValues = {
  profile: { id: "u1", full_name: "Arjun Sharma", username: "arjun_s", role: "student" },
  role: "student",
  loading: false,
  session: { access_token: "abc" },
  signOut: jest.fn().mockResolvedValue(undefined),
};

jest.mock("../src/context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => mockAuthValues,
}));

// ----------------------------------------------------------
// Mock API
// ----------------------------------------------------------
const mockFetchStudentDashboard = jest.fn();
const mockFetchStudentClassReport = jest.fn();
const mockFetchStudentClassrooms = jest.fn();
const mockFetchCampusEvents = jest.fn();
const mockFetchCirculars = jest.fn();

jest.mock("../src/services/api", () => ({
  __esModule: true,
  fetchStudentDashboard: (...args) => mockFetchStudentDashboard(...args),
  fetchStudentClassReport: (...args) => mockFetchStudentClassReport(...args),
  fetchStudentClassrooms: (...args) => mockFetchStudentClassrooms(...args),
  fetchCampusEvents: (...args) => mockFetchCampusEvents(...args),
  fetchCirculars: (...args) => mockFetchCirculars(...args),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  fetchCurrentProfile: jest.fn(),
}));

// Import AFTER mocks
import StudentHome from "../app/student/index";
import ClassReport from "../app/student/class/[classroomId]";

// Reset mocks
beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockFetchCampusEvents.mockResolvedValue({ data: [], error: null });
  mockFetchCirculars.mockResolvedValue({ data: [], error: null });
  mockFetchStudentClassrooms.mockResolvedValue({ data: [
    { classroom_id: "c1", class_name: "Mathematics 10A", subject: "Math" },
    { classroom_id: "c2", class_name: "Science 10A", subject: "Science" },
  ], error: null });
});

// ----------------------------------------------------------
// Student Dashboard Tests
// ----------------------------------------------------------
describe("StudentHome", () => {
  const MOCK_DASHBOARD = {
    attendance_percentage: 85.5,
    average_grade: 78.2,
    unpaid_fees_count: 1,
    upcoming_events: [],
  };

  it("should_render_student_dashboard_cards", async () => {
    mockFetchStudentDashboard.mockResolvedValue({
      data: MOCK_DASHBOARD,
      error: null,
    });

    const { findByText } = render(<StudentHome />);

    // Should show welcome message with student name
    await waitFor(() => {
      expect(mockFetchStudentDashboard).toHaveBeenCalled();
    });

    // Should show attendance and grade stats
    const attendanceText = await findByText(/85.5%/);
    expect(attendanceText).toBeTruthy();

    const gradeText = await findByText(/78.2%/);
    expect(gradeText).toBeTruthy();
  });

  it("should_render_classroom_list", async () => {
    mockFetchStudentDashboard.mockResolvedValue({
      data: MOCK_DASHBOARD,
      error: null,
    });

    const { findByText } = render(<StudentHome />);

    const mathClass = await findByText("Mathematics 10A");
    expect(mathClass).toBeTruthy();

    const scienceClass = await findByText("Science 10A");
    expect(scienceClass).toBeTruthy();
  });

  it("should_show_empty_state_when_no_classrooms", async () => {
    mockFetchStudentDashboard.mockResolvedValue({
      data: MOCK_DASHBOARD,
      error: null,
    });
    mockFetchStudentClassrooms.mockResolvedValue({ data: [], error: null });

    const { findByText } = render(<StudentHome />);

    const emptyText = await findByText(/no class/i);
    expect(emptyText).toBeTruthy();
  });

  it("should_open_class_report_when_classroom_pressed", async () => {
    mockFetchStudentDashboard.mockResolvedValue({
      data: MOCK_DASHBOARD,
      error: null,
    });

    const { findByText } = render(<StudentHome />);

    const mathClass = await findByText("Mathematics 10A");
    fireEvent.press(mathClass);

    expect(mockPush).toHaveBeenCalledWith("/student/class/c1");
  });

  it("should_show_error_state_on_api_failure", async () => {
    mockFetchStudentDashboard.mockResolvedValue({
      data: null,
      error: "Network error",
    });

    const { findByText } = render(<StudentHome />);

    const errorText = await findByText(/network error/i);
    expect(errorText).toBeTruthy();
  });
});

// ----------------------------------------------------------
// Class Report Tests
// ----------------------------------------------------------
describe("ClassReport", () => {
  const MOCK_REPORT = {
    class_name: "Mathematics 10A",
    attendance_percentage: 90,
    average_grade: 82,
    assignments: [
      { id: "a1", title: "Homework 1", percentage: 85 },
      { id: "a2", title: "Quiz 1", percentage: 92 },
      { id: "a3", title: "Midterm Exam", percentage: 78 },
    ],
  };

  it("should_render_assignment_scores_in_class_report", async () => {
    mockParams = { classroomId: "c1" };
    mockFetchStudentClassReport.mockResolvedValue({
      data: MOCK_REPORT,
      error: null,
    });

    const { findByText } = render(<ClassReport />);

    // Should show class name
    const className = await findByText("Mathematics 10A");
    expect(className).toBeTruthy();

    // Should show assignment titles and scores
    const hw = await findByText("Homework 1");
    expect(hw).toBeTruthy();

    const quiz = await findByText("Quiz 1");
    expect(quiz).toBeTruthy();
  });

  it("should_render_attendance_for_class", async () => {
    mockParams = { classroomId: "c1" };
    mockFetchStudentClassReport.mockResolvedValue({
      data: MOCK_REPORT,
      error: null,
    });

    const { findByText } = render(<ClassReport />);

    const attendance = await findByText(/90%/);
    expect(attendance).toBeTruthy();
  });

  it("should_not_render_classmate_names", async () => {
    mockParams = { classroomId: "c1" };
    mockFetchStudentClassReport.mockResolvedValue({
      data: {
        ...MOCK_REPORT,
        // Even if data somehow includes classmate info, it must not render
        classmates: [{ name: "Priya Patel" }, { name: "Rohan Gupta" }],
      },
      error: null,
    });

    const { queryByText } = render(<ClassReport />);

    await waitFor(() => {
      expect(queryByText("Priya Patel")).toBeNull();
      expect(queryByText("Rohan Gupta")).toBeNull();
    });
  });
});
