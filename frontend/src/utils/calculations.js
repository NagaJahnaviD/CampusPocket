// ============================================================
// calculations.js – Frontend calculation helpers
// ============================================================

/**
 * Calculate attendance percentage.
 * Formula: (PRESENT + LATE) / Total Sessions * 100
 *
 * @param {number} presentCount – number of "present" sessions
 * @param {number} lateCount    – number of "late" sessions (still counts!)
 * @param {number} totalSessions – total number of sessions
 * @returns {number} attendance percentage (0–100), rounded to 2 decimals
 */
export function calculateAttendancePercentage(presentCount, lateCount, totalSessions) {
  // Avoid dividing by zero
  if (!totalSessions || totalSessions === 0) return 0;

  const attended = presentCount + lateCount;
  const percentage = (attended / totalSessions) * 100;

  // Round to 2 decimal places
  return Math.round(percentage * 100) / 100;
}

/**
 * Calculate the average grade from an array of percentage values.
 * Formula: sum of all percentages / count
 *
 * @param {number[]} percentages – array of grade percentages
 * @returns {number} average percentage, rounded to 2 decimals
 */
export function calculateAverageGrade(percentages) {
  // Return 0 for empty arrays
  if (!percentages || percentages.length === 0) return 0;

  const sum = percentages.reduce((total, p) => total + p, 0);
  const average = sum / percentages.length;

  // Round to 2 decimal places
  return Math.round(average * 100) / 100;
}
