// ============================================================
// Tests for shared UI components
// ============================================================

import React from "react";
import { render } from "@testing-library/react-native";

import FeeStatusBadge from "../src/components/FeeStatusBadge";
import EmptyState from "../src/components/EmptyState";
import ErrorMessage from "../src/components/ErrorMessage";
import StatCard from "../src/components/StatCard";

// ----------------------------------------------------------
// FeeStatusBadge Tests
// ----------------------------------------------------------
describe("FeeStatusBadge", () => {
  it("should_render_paid_badge", () => {
    const { getByText } = render(<FeeStatusBadge status="PAID" />);
    expect(getByText(/PAID/)).toBeTruthy();
  });

  it("should_render_pending_badge", () => {
    const { getByText } = render(<FeeStatusBadge status="PENDING" />);
    expect(getByText(/PENDING/)).toBeTruthy();
  });

  it("should_render_alert_badge_for_overdue_fee", () => {
    const { getByText } = render(<FeeStatusBadge status="OVERDUE" />);
    expect(getByText(/OVERDUE/)).toBeTruthy();
  });
});

// ----------------------------------------------------------
// EmptyState Tests
// ----------------------------------------------------------
describe("EmptyState", () => {
  it("should_render_empty_state_message", () => {
    const { getByText } = render(<EmptyState message="No data found" />);
    expect(getByText("No data found")).toBeTruthy();
  });
});

// ----------------------------------------------------------
// ErrorMessage Tests
// ----------------------------------------------------------
describe("ErrorMessage", () => {
  it("should_render_error_text", () => {
    const { getByText } = render(<ErrorMessage message="Something went wrong" />);
    expect(getByText("Something went wrong")).toBeTruthy();
  });

  it("should_render_retry_button_when_onRetry_provided", () => {
    const mockRetry = jest.fn();
    const { getByText } = render(
      <ErrorMessage message="Error" onRetry={mockRetry} />
    );
    expect(getByText("Try Again")).toBeTruthy();
  });
});

// ----------------------------------------------------------
// StatCard Tests
// ----------------------------------------------------------
describe("StatCard", () => {
  it("should_render_label_and_value", () => {
    const { getByText } = render(
      <StatCard label="Attendance" value="85%" />
    );
    expect(getByText("Attendance")).toBeTruthy();
    expect(getByText("85%")).toBeTruthy();
  });

  it("should_render_helper_text_when_provided", () => {
    const { getByText } = render(
      <StatCard label="Grade" value="90%" helperText="Great job!" />
    );
    expect(getByText("Great job!")).toBeTruthy();
  });
});
