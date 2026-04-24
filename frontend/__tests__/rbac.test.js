// ============================================================
// Tests for ProtectedRoute (RBAC)
// ============================================================
// TDD: Written BEFORE implementation.
// ============================================================

import React from "react";
import { Text } from "react-native";
import { render, waitFor } from "@testing-library/react-native";

// ----------------------------------------------------------
// Mock expo-router
// ----------------------------------------------------------
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ replace: mockReplace }),
  Slot: ({ children }) => children || null,
}));

// ----------------------------------------------------------
// Mock AuthContext with controllable values
// ----------------------------------------------------------
let mockAuthValues = {};

jest.mock("../src/context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => mockAuthValues,
}));

// Import AFTER mocks
import ProtectedRoute from "../src/components/ProtectedRoute";

// Reset before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockAuthValues = {
    role: null,
    loading: false,
    session: null,
  };
});

// ----------------------------------------------------------
// Tests
// ----------------------------------------------------------
describe("ProtectedRoute", () => {
  it("should_render_children_when_role_matches", () => {
    // Arrange: user is a logged-in student
    mockAuthValues = {
      role: "student",
      loading: false,
      session: { access_token: "abc" },
    };

    // Act: render ProtectedRoute for students
    const { getByText } = render(
      <ProtectedRoute allowedRole="student">
        <Text>Student Dashboard</Text>
      </ProtectedRoute>
    );

    // Assert: child content is rendered
    expect(getByText("Student Dashboard")).toBeTruthy();
  });

  it("should_show_loading_screen_while_loading", () => {
    mockAuthValues = {
      role: null,
      loading: true,
      session: null,
    };

    const { getByText } = render(
      <ProtectedRoute allowedRole="student">
        <Text>Dashboard</Text>
      </ProtectedRoute>
    );

    // Should show loading, NOT the child
    expect(getByText("Loading...")).toBeTruthy();
  });

  it("should_redirect_unauthenticated_user_to_login", async () => {
    // Arrange: no session, no role
    mockAuthValues = {
      role: null,
      loading: false,
      session: null,
    };

    render(
      <ProtectedRoute allowedRole="student">
        <Text>Dashboard</Text>
      </ProtectedRoute>
    );

    // Assert: redirected to /login
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("should_redirect_student_away_from_parent_route", async () => {
    // Arrange: user is a student trying to access parent route
    mockAuthValues = {
      role: "student",
      loading: false,
      session: { access_token: "abc" },
    };

    render(
      <ProtectedRoute allowedRole="parent">
        <Text>Parent Dashboard</Text>
      </ProtectedRoute>
    );

    // Assert: redirected to /student (their correct portal)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/student");
    });
  });

  it("should_redirect_parent_away_from_student_route", async () => {
    // Arrange: user is a parent trying to access student route
    mockAuthValues = {
      role: "parent",
      loading: false,
      session: { access_token: "abc" },
    };

    render(
      <ProtectedRoute allowedRole="student">
        <Text>Student Dashboard</Text>
      </ProtectedRoute>
    );

    // Assert: redirected to /parent (their correct portal)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/parent");
    });
  });
});
