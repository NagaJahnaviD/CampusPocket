// ============================================================
// formatters.js – Formatting utilities for display
// ============================================================

/**
 * Format a number as a percentage string.
 * Example: 85.5 → "85.5%"
 * Returns "0%" for null/undefined.
 */
export function formatPercentage(value) {
  if (value === null || value === undefined) return "0%";
  return `${value}%`;
}

/**
 * Format a number as Indian Rupee currency.
 * Example: 5000 → "₹5,000"
 */
export function formatCurrency(value) {
  if (value === null || value === undefined) return "₹0";
  // toLocaleString adds commas for thousands
  return `₹${value.toLocaleString("en-IN")}`;
}

/**
 * Format a date string into a readable format.
 * Example: "2025-04-14" → "14 Apr 2025"
 * Returns "" for null/undefined.
 */
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
