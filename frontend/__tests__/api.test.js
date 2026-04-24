// ============================================================
// Tests for the API adapter (src/services/api.js)
// ============================================================
// TDD: Written BEFORE the implementation.
// We mock the Supabase client so tests don't need a database.
// ============================================================

// ----------------------------------------------------------
// Mock setup — must be BEFORE imports
// ----------------------------------------------------------

// Create mock functions
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn();
const mockRpc = jest.fn();
const mockFrom = jest.fn();

// Mock the supabaseClient module
// The path must match what api.js uses when resolved from this file
jest.mock("../src/services/supabaseClient", () => {
  return {
    __esModule: true,
    supabase: {
      auth: {
        signInWithPassword: (...args) => mockSignInWithPassword(...args),
        signOut: (...args) => mockSignOut(...args),
      },
      rpc: (...args) => mockRpc(...args),
      from: (...args) => mockFrom(...args),
    },
  };
});

// Now import the functions we're testing
import {
  usernameToEmail,
  loginUser,
  logoutUser,
  fetchCurrentProfile,
  fetchStudentDashboard,
  fetchStudentClassReport,
  fetchParentDashboard,
  fetchParentChildReport,
  linkChild,
  fetchCampusEvents,
  fetchCirculars,
  fetchStudentActivities,
  fetchLeaderboard,
  fetchGradeGoal,
} from "../src/services/api";

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// ----------------------------------------------------------
// Username → Email conversion
// ----------------------------------------------------------
describe("usernameToEmail", () => {
  it("should_convert_username_to_demo_email", () => {
    expect(usernameToEmail("arjun_s")).toBe("arjun_s@campuspocket.demo");
  });

  it("should_convert_any_username_to_demo_email", () => {
    expect(usernameToEmail("jahnavi")).toBe("jahnavi@campuspocket.demo");
  });
});

// ----------------------------------------------------------
// loginUser
// ----------------------------------------------------------
describe("loginUser", () => {
  it("should_return_data_on_successful_login", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: { access_token: "abc" }, user: { id: "u1" } },
      error: null,
    });

    const result = await loginUser("arjun_s", "password123");

    expect(result.data).toBeTruthy();
    expect(result.error).toBeNull();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "arjun_s@campuspocket.demo",
      password: "password123",
    });
  });

  it("should_return_clean_error_when_login_fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "Invalid login credentials" },
    });

    const result = await loginUser("wrong", "wrong");

    expect(result.data).toBeNull();
    expect(result.error).toBe("Invalid login credentials");
  });

  it("should_return_data_error_shape_from_api_functions", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { session: {}, user: {} },
      error: null,
    });

    const result = await loginUser("test", "test");

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("error");
  });
});

// ----------------------------------------------------------
// logoutUser
// ----------------------------------------------------------
describe("logoutUser", () => {
  it("should_return_success_on_logout", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const result = await logoutUser();

    expect(result.error).toBeNull();
    expect(mockSignOut).toHaveBeenCalled();
  });
});

// ----------------------------------------------------------
// RPC-based functions
// ----------------------------------------------------------
describe("fetchCurrentProfile", () => {
  it("should_call_get_my_profile_rpc", async () => {
    mockRpc.mockResolvedValue({
      data: [{ id: "u1", full_name: "Arjun", role: "student" }],
      error: null,
    });

    const result = await fetchCurrentProfile();

    expect(mockRpc).toHaveBeenCalledWith("get_my_profile");
    expect(result.data).toBeTruthy();
    expect(result.error).toBeNull();
  });
});

describe("fetchStudentDashboard", () => {
  it("should_call_get_student_dashboard_rpc", async () => {
    mockRpc.mockResolvedValue({
      data: { attendance_percentage: 85 },
      error: null,
    });

    const result = await fetchStudentDashboard();

    expect(mockRpc).toHaveBeenCalledWith("get_student_dashboard");
    expect(result.data.attendance_percentage).toBe(85);
    expect(result.error).toBeNull();
  });
});

describe("fetchStudentClassReport", () => {
  it("should_call_rpc_with_classroom_id", async () => {
    mockRpc.mockResolvedValue({ data: { average_grade: 90 }, error: null });

    await fetchStudentClassReport("class-1");

    expect(mockRpc).toHaveBeenCalledWith("get_student_class_report", {
      p_classroom_id: "class-1",
    });
  });
});

describe("fetchParentDashboard", () => {
  it("should_call_get_parent_dashboard_rpc", async () => {
    mockRpc.mockResolvedValue({ data: { children: [] }, error: null });

    const result = await fetchParentDashboard();

    expect(mockRpc).toHaveBeenCalledWith("get_parent_dashboard");
    expect(result.error).toBeNull();
  });
});

describe("fetchParentChildReport", () => {
  it("should_call_rpc_with_child_id", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });

    await fetchParentChildReport("child-1");

    expect(mockRpc).toHaveBeenCalledWith("get_parent_child_report", {
      p_child_id: "child-1",
    });
  });
});

describe("linkChild", () => {
  it("should_call_rpc_with_username_and_password", async () => {
    mockRpc.mockResolvedValue({ data: { success: true }, error: null });

    await linkChild("arjun_s", "password123");

    expect(mockRpc).toHaveBeenCalledWith("link_child_to_parent", {
      p_child_username: "arjun_s",
      p_child_password: "password123",
    });
  });
});

describe("fetchLeaderboard", () => {
  it("should_call_rpc_with_classroom_id", async () => {
    mockRpc.mockResolvedValue({ data: { leaderboard: [] }, error: null });

    await fetchLeaderboard("class-1");

    expect(mockRpc).toHaveBeenCalledWith("get_anonymized_leaderboard", {
      p_classroom_id: "class-1",
    });
  });
});

describe("fetchGradeGoal", () => {
  it("should_call_rpc_with_classroom_and_target", async () => {
    mockRpc
      .mockResolvedValueOnce({ data: [{ id: "student-1" }], error: null })
      .mockResolvedValueOnce({
        data: { possible: true, needed_average_percentage: 95 },
        error: null,
      });

    await fetchGradeGoal("class-1", 90);

    expect(mockRpc).toHaveBeenCalledWith("get_my_profile");
    expect(mockRpc).toHaveBeenCalledWith("calculate_grade_goal", {
      p_student_id: "student-1",
      p_classroom_id: "class-1",
      p_target_percentage: 90,
    });
  });
});

// ----------------------------------------------------------
// Table-query based functions
// ----------------------------------------------------------
describe("fetchCampusEvents", () => {
  it("should_query_campus_event_table", async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [{ title: "Sports Day" }],
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await fetchCampusEvents();

    expect(mockFrom).toHaveBeenCalledWith("campus_event");
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });
});

describe("fetchCirculars", () => {
  it("should_query_digital_circular_table", async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [{ title: "Notice" }],
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await fetchCirculars();

    expect(mockFrom).toHaveBeenCalledWith("digital_circular");
    expect(result.error).toBeNull();
  });
});

describe("fetchStudentActivities", () => {
  it("should_query_student_activity_with_join", async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [
        {
          id: "sa-1",
          joined_at: "2025-01-01",
          extracurricular_activity: {
            id: "a-1",
            name: "Chess Club",
            description: "Play chess",
            day_of_week: "Monday",
            time_slot: "3-4 PM",
          },
        },
      ],
      error: null,
    });
    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await fetchStudentActivities("student-1");

    expect(mockFrom).toHaveBeenCalledWith("student_activity");
    expect(result.data[0].name).toBe("Chess Club");
    expect(result.error).toBeNull();
  });
});
