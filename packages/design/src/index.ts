/**
 * VRRON design tokens.
 * Direction: dark, violet + electric blue, restrained glow, Arabic-first.
 * One memorable element (the glow behind the wordmark); everything else quiet.
 */

export const colors = {
  background: "#07070C",
  surface: "#0F0F1A",
  surfaceRaised: "#16162A",
  border: "#26263F",

  textPrimary: "#F2F2FA",
  textSecondary: "#A3A3C2",
  textMuted: "#8484A6",

  violet: "#7C3AED",
  violetLight: "#A78BFA",
  blue: "#2F7BFF",
  blueLight: "#7FB0FF",

  success: "#34D399",
  danger: "#F87171",
} as const;

/** RGB triplets for building translucent glow layers: `rgba(${rgb}, alpha)`. */
export const glowRgb = {
  violet: "124, 58, 237",
  blue: "47, 123, 255",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const fontFamily = {
  regular: "IBMPlexSansArabic_400Regular",
  semiBold: "IBMPlexSansArabic_600SemiBold",
  bold: "IBMPlexSansArabic_700Bold",
} as const;

/**
 * Type scale. Arabic needs generous line height; never apply letterSpacing
 * to Arabic text (it breaks letter joining). Use it only on Latin wordmarks.
 */
export const fontSize = {
  caption: 12,
  body: 16,
  bodyLarge: 18,
  title: 22,
  headline: 28,
  display: 44,
} as const;

export const lineHeight = {
  caption: 18,
  body: 26,
  bodyLarge: 29,
  title: 34,
  headline: 42,
  display: 52,
} as const;

export const motion = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

export const theme = {
  colors,
  glowRgb,
  spacing,
  radius,
  fontFamily,
  fontSize,
  lineHeight,
  motion,
} as const;
