// ============================================================
// Tests for utility functions (formatters + calculations)
// ============================================================
// TDD: These tests are written BEFORE the implementation.
// They should FAIL initially, then PASS after we write the code.
// ============================================================

import {
  formatPercentage,
  formatCurrency,
  formatDate,
} from "../src/utils/formatters";

import {
  calculateAttendancePercentage,
  calculateAverageGrade,
} from "../src/utils/calculations";

// ----------------------------------------------------------
// Formatter Tests
// ----------------------------------------------------------
describe("formatPercentage", () => {
  it("should_format_number_as_percentage_string", () => {
    // Arrange
    const value = 85.5;
    // Act
    const result = formatPercentage(value);
    // Assert
    expect(result).toBe("85.5%");
  });

  it("should_return_0_percent_for_zero", () => {
    expect(formatPercentage(0)).toBe("0%");
  });

  it("should_return_0_percent_for_null", () => {
    expect(formatPercentage(null)).toBe("0%");
  });

  it("should_return_0_percent_for_undefined", () => {
    expect(formatPercentage(undefined)).toBe("0%");
  });
});

describe("formatCurrency", () => {
  it("should_format_number_with_rupee_symbol", () => {
    expect(formatCurrency(5000)).toBe("₹5,000");
  });

  it("should_return_zero_rupee_for_zero", () => {
    expect(formatCurrency(0)).toBe("₹0");
  });
});

describe("formatDate", () => {
  it("should_format_date_string_to_readable_format", () => {
    const result = formatDate("2025-04-14");
    // Should contain the month and day at minimum
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("should_return_empty_string_for_null", () => {
    expect(formatDate(null)).toBe("");
  });
});

// ----------------------------------------------------------
// Calculation Tests
// ----------------------------------------------------------
describe("calculateAttendancePercentage", () => {
  it("should_calculate_attendance_using_present_and_late", () => {
    // Arrange: 5 present, 2 late, 10 total sessions
    // Formula: (PRESENT + LATE) / Total * 100 = (5+2)/10*100 = 70
    const result = calculateAttendancePercentage(5, 2, 10);
    // Assert
    expect(result).toBe(70);
  });

  it("should_return_zero_attendance_when_total_sessions_is_zero", () => {
    const result = calculateAttendancePercentage(0, 0, 0);
    expect(result).toBe(0);
  });

  it("should_return_100_when_all_present", () => {
    const result = calculateAttendancePercentage(10, 0, 10);
    expect(result).toBe(100);
  });

  it("should_count_late_as_attended", () => {
    // All 10 sessions are late — still counts as attended
    const result = calculateAttendancePercentage(0, 10, 10);
    expect(result).toBe(100);
  });
});

describe("calculateAverageGrade", () => {
  it("should_calculate_average_grade_from_percentages", () => {
    // Arrange: grades are 80, 90, 70 → average = 80
    const result = calculateAverageGrade([80, 90, 70]);
    expect(result).toBe(80);
  });

  it("should_return_zero_for_empty_array", () => {
    const result = calculateAverageGrade([]);
    expect(result).toBe(0);
  });

  it("should_handle_single_grade", () => {
    const result = calculateAverageGrade([95]);
    expect(result).toBe(95);
  });

  it("should_round_to_two_decimal_places", () => {
    // 33.33 + 33.33 + 33.34 = 100 / 3 = 33.33
    const result = calculateAverageGrade([10, 20, 30]);
    expect(result).toBe(20);
  });
});
