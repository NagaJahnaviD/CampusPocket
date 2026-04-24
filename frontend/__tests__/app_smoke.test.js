// ============================================================
// Smoke test – Verifies that the app entry renders login
// ============================================================

import React from "react";
import { render } from "@testing-library/react-native";

// Mock expo-router
jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  Redirect: ({ href }) => null,
  Slot: () => null,
}));

// Mock AuthContext
jest.mock("../src/context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => ({
    session: null,
    role: null,
    loading: false,
    signIn: jest.fn(),
  }),
}));

// Mock the API
jest.mock("../src/services/api", () => ({
  __esModule: true,
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  fetchCurrentProfile: jest.fn(),
}));

import IndexScreen from "../app/index";

describe("App Smoke Test", () => {
  it("should_render_campus_pocket_loading_screen", () => {
    const { getByText } = render(<IndexScreen />);
    expect(getByText("Campus Pocket")).toBeTruthy();
  });

  it("should_show_login_form", () => {
    const { getByText } = render(<IndexScreen />);
    expect(getByText("Sign In")).toBeTruthy();
  });
});
