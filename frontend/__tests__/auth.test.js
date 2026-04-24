// ============================================================
// Tests for AuthContext and Login Screen (index.js)
// ============================================================

import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// ----------------------------------------------------------
// Mock the API adapter
// ----------------------------------------------------------
const mockLoginUser = jest.fn();
const mockLogoutUser = jest.fn();
const mockFetchCurrentProfile = jest.fn();

jest.mock("../src/services/api", () => ({
  __esModule: true,
  loginUser: (...args) => mockLoginUser(...args),
  logoutUser: (...args) => mockLogoutUser(...args),
  fetchCurrentProfile: (...args) => mockFetchCurrentProfile(...args),
}));

// ----------------------------------------------------------
// Mock expo-router
// ----------------------------------------------------------
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  __esModule: true,
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
  }),
  Redirect: () => null,
  Slot: () => null,
}));

// Import AFTER mocks are set up
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import IndexScreen from "../app/index";
import { Text } from "react-native";

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------------
// Helper: wrap component with AuthProvider for testing
// ----------------------------------------------------------
function renderWithAuth(component) {
  return render(<AuthProvider>{component}</AuthProvider>);
}

// ----------------------------------------------------------
// Helper: component that displays AuthContext values
// ----------------------------------------------------------
function AuthDisplay() {
  const { profile, role, loading } = useAuth();
  return (
    <>
      <Text testID="loading">{loading ? "loading" : "ready"}</Text>
      <Text testID="role">{role || "none"}</Text>
      <Text testID="name">{profile?.full_name || "none"}</Text>
    </>
  );
}

// ----------------------------------------------------------
// AuthContext Tests
// ----------------------------------------------------------
describe("AuthContext", () => {
  it("should_provide_default_values", () => {
    const { getByTestId } = renderWithAuth(<AuthDisplay />);
    expect(getByTestId("role").props.children).toBe("none");
    expect(getByTestId("name").props.children).toBe("none");
  });

  it("should_set_profile_and_role_after_sign_in", async () => {
    mockLoginUser.mockResolvedValue({
      data: { session: { access_token: "abc" } },
      error: null,
    });
    mockFetchCurrentProfile.mockResolvedValue({
      data: { id: "u1", full_name: "Arjun", role: "student" },
      error: null,
    });

    function SignInTrigger() {
      const { signIn, profile, role } = useAuth();
      return (
        <>
          <Text testID="role">{role || "none"}</Text>
          <Text testID="name">{profile?.full_name || "none"}</Text>
          <Text testID="signin" onPress={() => signIn("arjun_s", "password123")}>
            Sign In
          </Text>
        </>
      );
    }

    const { getByTestId } = renderWithAuth(<SignInTrigger />);

    await act(async () => {
      fireEvent.press(getByTestId("signin"));
    });

    await waitFor(() => {
      expect(getByTestId("role").props.children).toBe("student");
      expect(getByTestId("name").props.children).toBe("Arjun");
    });
  });

  it("should_clear_state_after_sign_out", async () => {
    mockLoginUser.mockResolvedValue({ data: { session: {} }, error: null });
    mockFetchCurrentProfile.mockResolvedValue({
      data: { id: "u1", full_name: "Arjun", role: "student" },
      error: null,
    });
    mockLogoutUser.mockResolvedValue({ data: {}, error: null });

    function SignOutTrigger() {
      const { signIn, signOut, role } = useAuth();
      return (
        <>
          <Text testID="role">{role || "none"}</Text>
          <Text testID="signin" onPress={() => signIn("arjun_s", "pass")}>In</Text>
          <Text testID="signout" onPress={() => signOut()}>Out</Text>
        </>
      );
    }

    const { getByTestId } = renderWithAuth(<SignOutTrigger />);

    await act(async () => {
      fireEvent.press(getByTestId("signin"));
    });
    await waitFor(() => {
      expect(getByTestId("role").props.children).toBe("student");
    });

    await act(async () => {
      fireEvent.press(getByTestId("signout"));
    });
    await waitFor(() => {
      expect(getByTestId("role").props.children).toBe("none");
    });
  });
});

// ----------------------------------------------------------
// Login Screen Tests (now at app/index.js)
// ----------------------------------------------------------
describe("LoginScreen", () => {
  it("should_show_login_form", () => {
    const { getByPlaceholderText, getByText } = renderWithAuth(<IndexScreen />);
    expect(getByText("Campus Pocket")).toBeTruthy();
    expect(getByPlaceholderText(/arjun/i)).toBeTruthy();
    expect(getByPlaceholderText(/password/i)).toBeTruthy();
    expect(getByText("Sign In")).toBeTruthy();
  });

  it("should_call_sign_in_when_login_button_pressed", async () => {
    mockLoginUser.mockResolvedValue({ data: { session: {} }, error: null });
    mockFetchCurrentProfile.mockResolvedValue({
      data: { id: "u1", role: "student", full_name: "Arjun" },
      error: null,
    });

    const { getByPlaceholderText, getByText } = renderWithAuth(<IndexScreen />);

    fireEvent.changeText(getByPlaceholderText(/arjun/i), "arjun_s");
    fireEvent.changeText(getByPlaceholderText(/password/i), "password123");

    await act(async () => {
      fireEvent.press(getByText("Sign In"));
    });

    expect(mockLoginUser).toHaveBeenCalledWith("arjun_s", "password123");
  });

  it("should_show_error_when_login_fails", async () => {
    mockLoginUser.mockResolvedValue({
      data: null,
      error: "Invalid login credentials",
    });

    const { getByPlaceholderText, getByText, findByText } = renderWithAuth(
      <IndexScreen />
    );

    fireEvent.changeText(getByPlaceholderText(/arjun/i), "wrong");
    fireEvent.changeText(getByPlaceholderText(/password/i), "wrong");

    await act(async () => {
      fireEvent.press(getByText("Sign In"));
    });

    const errorText = await findByText("Invalid login credentials");
    expect(errorText).toBeTruthy();
  });

  it("should_route_to_student_home_when_role_is_student", async () => {
    mockLoginUser.mockResolvedValue({ data: { session: {} }, error: null });
    mockFetchCurrentProfile.mockResolvedValue({
      data: { id: "u1", role: "student", full_name: "Arjun" },
      error: null,
    });

    const { getByPlaceholderText, getByText } = renderWithAuth(<IndexScreen />);

    fireEvent.changeText(getByPlaceholderText(/arjun/i), "arjun_s");
    fireEvent.changeText(getByPlaceholderText(/password/i), "password123");

    await act(async () => {
      fireEvent.press(getByText("Sign In"));
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/student");
    });
  });

  it("should_route_to_parent_home_when_role_is_parent", async () => {
    mockLoginUser.mockResolvedValue({ data: { session: {} }, error: null });
    mockFetchCurrentProfile.mockResolvedValue({
      data: { id: "p1", role: "parent", full_name: "Vikram" },
      error: null,
    });

    const { getByPlaceholderText, getByText } = renderWithAuth(<IndexScreen />);

    fireEvent.changeText(getByPlaceholderText(/arjun/i), "vikram_parent");
    fireEvent.changeText(getByPlaceholderText(/password/i), "password123");

    await act(async () => {
      fireEvent.press(getByText("Sign In"));
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/parent");
    });
  });
});
