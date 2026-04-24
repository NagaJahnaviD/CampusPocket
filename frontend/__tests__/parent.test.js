// ============================================================
// Tests for Parent Portal screens
// ============================================================
// TDD: Written BEFORE implementation.
// ============================================================

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

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
  profile: { id: "p1", full_name: "Vikram Sharma", username: "vikram_parent", role: "parent" },
  role: "parent",
  loading: false,
  session: { access_token: "abc" },
  signOut: jest.fn().mockResolvedValue(undefined),
  refreshProfile: jest.fn(),
};

jest.mock("../src/context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => mockAuthValues,
}));

// ----------------------------------------------------------
// Mock API
// ----------------------------------------------------------
const mockFetchParentDashboard = jest.fn();
const mockFetchParentChildReport = jest.fn();
const mockLinkChild = jest.fn();

jest.mock("../src/services/api", () => ({
  __esModule: true,
  fetchParentDashboard: (...args) => mockFetchParentDashboard(...args),
  fetchParentChildReport: (...args) => mockFetchParentChildReport(...args),
  linkChild: (...args) => mockLinkChild(...args),
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  fetchCurrentProfile: jest.fn(),
}));

// Import AFTER mocks
import ParentHome from "../app/parent/index";
import ChildDetail from "../app/parent/child/[childId]";
import LinkChild from "../app/parent/link-child";

// Reset mocks
beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

// ----------------------------------------------------------
// Parent Dashboard Tests
// ----------------------------------------------------------
describe("ParentHome", () => {
  const MOCK_DASHBOARD = {
    children: [
      {
        child_id: "s1",
        child_name: "Arjun Sharma",
        attendance_percentage: 85,
        average_grade: 78,
        unpaid_fees_count: 0,
      },
      {
        child_id: "s2",
        child_name: "Priya Patel",
        attendance_percentage: 92,
        average_grade: 88,
        unpaid_fees_count: 1,
      },
    ],
  };

  it("should_render_linked_children_summary_cards", async () => {
    mockFetchParentDashboard.mockResolvedValue({
      data: MOCK_DASHBOARD,
      error: null,
    });

    const { findByText } = render(<ParentHome />);

    const arjun = await findByText("Arjun Sharma");
    expect(arjun).toBeTruthy();

    const priya = await findByText("Priya Patel");
    expect(priya).toBeTruthy();
  });

  it("should_show_bold_alert_for_pending_fee", async () => {
    mockFetchParentDashboard.mockResolvedValue({
      data: MOCK_DASHBOARD,
      error: null,
    });

    const { findByText } = render(<ParentHome />);

    const pendingBadge = await findByText("PENDING");
    expect(pendingBadge).toBeTruthy();
  });

  it("should_show_bold_alert_for_overdue_fee", async () => {
    const dashWithOverdue = {
      children: [
        {
          child_id: "s1",
          child_name: "Arjun Sharma",
          child_username: "arjun_s",
          overall_attendance_percentage: 85,
          overall_average_grade: 78,
          fee_status: "OVERDUE",
        },
      ],
    };

    mockFetchParentDashboard.mockResolvedValue({
      data: dashWithOverdue,
      error: null,
    });

    const { findByText } = render(<ParentHome />);

    const overdueBadge = await findByText("OVERDUE");
    expect(overdueBadge).toBeTruthy();
  });

  it("should_open_child_detail_when_child_card_pressed", async () => {
    mockFetchParentDashboard.mockResolvedValue({
      data: MOCK_DASHBOARD,
      error: null,
    });

    const { findByText } = render(<ParentHome />);

    const arjunCard = await findByText("Arjun Sharma");
    fireEvent.press(arjunCard);

    expect(mockPush).toHaveBeenCalledWith("/parent/child/s1");
  });

  it("should_show_empty_state_when_no_children_linked", async () => {
    mockFetchParentDashboard.mockResolvedValue({
      data: { children: [] },
      error: null,
    });

    const { findByText } = render(<ParentHome />);

    const emptyText = await findByText(/no child/i);
    expect(emptyText).toBeTruthy();
  });
});

// ----------------------------------------------------------
// Child Detail Tests
// ----------------------------------------------------------
describe("ChildDetail", () => {
  const MOCK_CHILD_REPORT = {
    child_name: "Arjun Sharma",
    overall_attendance_percentage: 85,
    overall_average_grade: 78,
    fee_status: "PAID",
    classrooms: [
      {
        classroom_id: "c1",
        class_name: "Mathematics 10A",
        attendance_percentage: 90,
        average_grade: 82,
        assignments: [
          { id: "a1", title: "Homework 1", percentage: 88 },
        ],
      },
    ],
    activities: [
      { id: "act1", name: "Chess Club" },
    ],
  };

  it("should_render_child_profile_and_stats", async () => {
    mockParams = { childId: "s1" };
    mockFetchParentChildReport.mockResolvedValue({
      data: MOCK_CHILD_REPORT,
      error: null,
    });

    const { findByText } = render(<ChildDetail />);

    const name = await findByText("Arjun Sharma");
    expect(name).toBeTruthy();

    const attendance = await findByText(/85%/);
    expect(attendance).toBeTruthy();
  });

  it("should_render_class_wise_data", async () => {
    mockParams = { childId: "s1" };
    mockFetchParentChildReport.mockResolvedValue({
      data: MOCK_CHILD_REPORT,
      error: null,
    });

    const { findByText } = render(<ChildDetail />);

    const mathClass = await findByText("Mathematics 10A");
    expect(mathClass).toBeTruthy();
  });
});

// ----------------------------------------------------------
// Link Child Tests
// ----------------------------------------------------------
describe("LinkChild", () => {
  it("should_submit_child_link_form_with_username_and_password", async () => {
    mockLinkChild.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<LinkChild />);

    fireEvent.changeText(getByPlaceholderText("Child Username"), "arjun_s");
    fireEvent.changeText(getByPlaceholderText("Child Password"), "password123");

    await act(async () => {
      fireEvent.press(getByText("Link Child"));
    });

    expect(mockLinkChild).toHaveBeenCalledWith("arjun_s", "password123");
  });

  it("should_show_success_message_on_link", async () => {
    mockLinkChild.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const { getByPlaceholderText, getByText, findByText } = render(
      <LinkChild />
    );

    fireEvent.changeText(getByPlaceholderText("Child Username"), "arjun_s");
    fireEvent.changeText(getByPlaceholderText("Child Password"), "password123");

    await act(async () => {
      fireEvent.press(getByText("Link Child"));
    });

    const successMsg = await findByText(/linked successfully/i);
    expect(successMsg).toBeTruthy();
  });

  it("should_show_error_when_child_link_fails", async () => {
    mockLinkChild.mockResolvedValue({
      data: null,
      error: "Invalid child credentials",
    });

    const { getByPlaceholderText, getByText, findByText } = render(
      <LinkChild />
    );

    fireEvent.changeText(getByPlaceholderText("Child Username"), "wrong");
    fireEvent.changeText(getByPlaceholderText("Child Password"), "wrong");

    await act(async () => {
      fireEvent.press(getByText("Link Child"));
    });

    const errorMsg = await findByText("Invalid child credentials");
    expect(errorMsg).toBeTruthy();
  });
});
