// Color definitions — "Measured Confidence" palette (Graphite & Brass)
const colors = {
  ink: "#14161A",         // app background (dark)
  surface: "#1D2025",     // card/panel background (dark)
  surfaceLight: "#F7F4EE",// card/panel background (light)
  paper: "#EDEAE2",       // primary text (dark) / app background (light) / photo mats
  steel: "#4A5A63",       // dividers, secondary surfaces, hairline borders
  mist: "#8B9198",        // secondary/caption text, inactive icons
  brass: "#C9A227",       // precision accent — active states, primary actions, data highlights
  ember: "#D1603D",       // reserved exclusively for streaks/achievements/milestones
  sage: "#7A9E7E",        // success
  gold: "#D1943D",        // warning
  brick: "#B23B3B",       // error
  haze: "#5C7A8A",        // info
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

const tintColorLight = colors.brass;
const tintColorDark = colors.brass;

/**
 * Helper function to add opacity to hex colors
 * @param hex - The hex color string (e.g., "#00C676")
 * @param opacity - The opacity value between 0 and 1 (e.g., 0.5 for 50%)
 * @returns The hex color with opacity (e.g., "#00C67680")
 */
export const withOpacity = (hex: string, opacity: number): string => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Calculate alpha value (0-255) and convert to hex
  const alpha = Math.round(opacity * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0');

  return `#${cleanHex}${alphaHex}`;
};

/**
 * Common overlay opacity values
 * Use these with withOpacity() for consistent transparency
 */
export const overlayOpacity = {
  subtle: 0.15,   // 15% - Very light overlay
  light: 0.25,    // 25% - Light overlay
  medium: 0.4,    // 40% - Medium overlay
  heavy: 0.6,     // 60% - Heavy overlay
  veryHeavy: 0.8, // 80% - Very heavy overlay
} as const;

export default {
  light: {
    text: colors.ink,
    background: colors.paper,
    tint: tintColorLight,
    tabIconDefault: colors.mist,
    tabIconSelected: tintColorLight,
    primary: colors.brass,
    secondary: colors.steel,
    accent: colors.steel,
    cardBackground: colors.surfaceLight,
    milestone: colors.ember,
    success: colors.sage,
    warning: colors.gold,
    error: colors.brick,
    info: colors.haze,
    transparent: colors.transparent,
  },
  dark: {
    text: colors.paper,
    background: colors.ink,
    tint: tintColorDark,
    tabIconDefault: colors.mist,
    tabIconSelected: tintColorDark,
    primary: colors.brass,
    secondary: colors.steel,
    accent: colors.steel,
    cardBackground: colors.surface,
    milestone: colors.ember,
    success: colors.sage,
    warning: colors.gold,
    error: colors.brick,
    info: colors.haze,
    transparent: colors.transparent,
  },
};
