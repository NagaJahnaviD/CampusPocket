// ============================================================
// theme.js – Premium design system with dark/light modes
// ============================================================

const palette = {
  // Primary brand colors
  indigo: "#6366f1",
  indigoLight: "#818cf8",
  indigoDark: "#4f46e5",
  indigoSoft: "rgba(99, 102, 241, 0.12)",

  // Accent
  emerald: "#10b981",
  emeraldSoft: "rgba(16, 185, 129, 0.12)",

  // Status
  rose: "#f43f5e",
  roseSoft: "rgba(244, 63, 94, 0.12)",
  amber: "#f59e0b",
  amberSoft: "rgba(245, 158, 11, 0.12)",
  sky: "#0ea5e9",

  // Neutrals
  white: "#ffffff",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray300: "#cbd5e1",
  gray400: "#94a3b8",
  gray500: "#64748b",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1e293b",
  gray900: "#0f172a",
  gray950: "#020617",
};

const lightColors = {
  primary: palette.indigo,
  primaryLight: palette.indigoSoft,
  primaryGradientStart: "#6366f1",
  primaryGradientEnd: "#8b5cf6",
  accent: palette.emerald,
  accentSoft: palette.emeraldSoft,
  background: palette.gray50,
  surface: palette.white,
  surfaceElevated: palette.white,
  text: palette.gray900,
  textSecondary: palette.gray500,
  textMuted: palette.gray400,
  error: palette.rose,
  errorSoft: palette.roseSoft,
  success: palette.emerald,
  successSoft: palette.emeraldSoft,
  warning: palette.amber,
  warningSoft: palette.amberSoft,
  danger: palette.rose,
  border: palette.gray200,
  divider: palette.gray100,
  shadow: "rgba(0, 0, 0, 0.08)",
  overlay: "rgba(0, 0, 0, 0.4)",
  cardGlow: "rgba(99, 102, 241, 0.06)",
  statusBarStyle: "dark",
};

const darkColors = {
  primary: palette.indigoLight,
  primaryLight: "rgba(129, 140, 248, 0.15)",
  primaryGradientStart: "#4f46e5",
  primaryGradientEnd: "#7c3aed",
  accent: palette.emerald,
  accentSoft: "rgba(16, 185, 129, 0.15)",
  background: palette.gray950,
  surface: palette.gray900,
  surfaceElevated: palette.gray800,
  text: palette.gray50,
  textSecondary: palette.gray400,
  textMuted: palette.gray600,
  error: "#fb7185",
  errorSoft: "rgba(251, 113, 133, 0.15)",
  success: "#34d399",
  successSoft: "rgba(52, 211, 153, 0.15)",
  warning: "#fbbf24",
  warningSoft: "rgba(251, 191, 36, 0.15)",
  danger: "#fb7185",
  border: palette.gray800,
  divider: palette.gray800,
  shadow: "rgba(0, 0, 0, 0.3)",
  overlay: "rgba(0, 0, 0, 0.6)",
  cardGlow: "rgba(129, 140, 248, 0.08)",
  statusBarStyle: "light",
};

const shared = {
  fontSize: {
    xs: 11,
    small: 12,
    medium: 14,
    large: 16,
    title: 20,
    heading: 26,
    hero: 32,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
};

// Build full theme for a given mode
export function buildTheme(mode = "light") {
  const colors = mode === "dark" ? darkColors : lightColors;
  return { colors, ...shared, mode };
}

// Default export for backward compatibility
const theme = buildTheme("light");
export default theme;
