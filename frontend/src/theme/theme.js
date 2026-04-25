// ============================================================
// theme.js – Modern Peach & Nothing OS design system
// ============================================================
// Light: Peach / coral warmth
// Dark:  Blue-green depth (Nothing OS inspired)
// ============================================================

const palette = {
  // ── Peach primary (light mode) ──
  peach:        "#FF9B71",      // Vibrant peach (accent / buttons)
  peachLight:   "#FFD7BA",      // Soft peach
  peachSoft:    "rgba(255, 155, 113, 0.12)",
  peachBg:      "#FFF8F5",      // Off-white peach shell

  // ── Blue-green primary (dark mode) ──
  teal:         "#00E676",      // Nothing green
  tealLight:    "#69F0AE",      // Lighter green
  tealSoft:     "rgba(0, 230, 118, 0.15)",
  tealDark:     "#00C853",

  // ── Accent ──
  coral:        "#FF6B6B",      // Warm coral
  blue:         "#007AFF",      // Action blue

  // ── Status ──
  success:      "#00E676",
  successSoft:  "rgba(0, 230, 118, 0.12)",
  rose:         "#f43f5e",
  roseSoft:     "rgba(244, 63, 94, 0.12)",
  amber:        "#FFBF00",      // Amber alert
  amberSoft:    "rgba(255, 191, 0, 0.12)",

  // ── Neutrals (Nothing OS) ──
  white:        "#FFFFFF",
  shell:        "#FFF8F5",      // Peach off-white
  gray50:       "#F9F9F9",      // Soft gray surface
  gray100:      "#f1f5f9",
  gray200:      "#EDEDED",      // Subtle border
  gray300:      "#cbd5e1",
  gray400:      "#94a3b8",
  gray500:      "#64748B",      // Slate gray body text
  gray600:      "#475569",
  gray700:      "#334155",
  gray800:      "#1e293b",
  gray900:      "#121212",      // Deep obsidian
  gray950:      "#0a0a0a",
};

// ── Light Mode: Peach warmth ──
const lightColors = {
  primary:              palette.peach,
  primaryLight:         palette.peachSoft,
  primaryGradientStart: "#FF9B71",
  primaryGradientEnd:   "#FFD7BA",
  accent:               palette.blue,
  accentSoft:           "rgba(0, 122, 255, 0.10)",

  background:           palette.shell,
  surface:              palette.white,
  surfaceElevated:      palette.white,

  text:                 palette.gray900,       // Deep obsidian
  textSecondary:        palette.gray500,       // Slate gray
  textMuted:            palette.gray400,

  error:                palette.rose,
  errorSoft:            palette.roseSoft,
  success:              palette.success,
  successSoft:          palette.successSoft,
  warning:              palette.amber,
  warningSoft:          palette.amberSoft,
  danger:               palette.rose,

  border:               palette.gray200,
  divider:              palette.gray200,
  shadow:               "rgba(255, 155, 113, 0.10)",
  overlay:              "rgba(0, 0, 0, 0.4)",
  cardGlow:             "rgba(255, 155, 113, 0.06)",
  statusBarStyle:       "dark",
};

// ── Dark Mode: True Dark (Nothing OS inspired with Peach Accents) ──
const darkColors = {
  primary:              palette.peach,
  primaryLight:         palette.peachSoft,
  primaryGradientStart: "#FF9B71",
  primaryGradientEnd:   "#FFD7BA",
  accent:               palette.peachLight,
  accentSoft:           "rgba(255, 155, 113, 0.15)",

  background:           "#000000",
  surface:              "#121212",
  surfaceElevated:      "#1e1e1e",

  text:                 palette.gray50,
  textSecondary:        "rgba(255, 255, 255, 0.8)",
  textMuted:            palette.gray500,

  error:                "#fb7185",
  errorSoft:            "rgba(251, 113, 133, 0.15)",
  success:              "#69F0AE",
  successSoft:          "rgba(105, 240, 174, 0.15)",
  warning:              "#FFBF00",
  warningSoft:          "rgba(255, 191, 0, 0.15)",
  danger:               "#fb7185",

  border:               "#262626",
  divider:              "#262626",
  shadow:               "rgba(0, 0, 0, 0.3)",
  overlay:              "rgba(0, 0, 0, 0.6)",
  cardGlow:             "rgba(255, 155, 113, 0.08)",
  statusBarStyle:       "light",
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
    sm: 8,
    md: 16,
    lg: 20,       // Card radius (Nothing OS rounded)
    xl: 32,       // Extra rounded
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
