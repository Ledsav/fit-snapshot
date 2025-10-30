// Color definitions
const colors = {
  emerald: "#00C676",        // vibrant green highlight
  forest: "#003B2B",         // deep forest green (background depth)
  midnight: "#0A0F0D",       // near-black base tone
  graphite: "#1E2422",       // subtle dark gray for panels
  slate: "#2D3432",          // secondary surfaces
  mist: "#E0F2E9",           // soft light text or accent
  white: "#FFFFFF",
  black: "#000000",
  teal: "#00A896",           // cool accent
  coral: "#FF6B6B",          // alert or contrast color
  amber: "#FFBF00",          // warning / highlight
  sky: "#89DCEB",            // info / secondary accent
  transparent: "transparent",
};

const tintColorLight = colors.emerald;
const tintColorDark = colors.emerald;

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
    text: colors.graphite,
    background: colors.mist,
    tint: tintColorLight,
    tabIconDefault: colors.slate,
    tabIconSelected: tintColorLight,
    primary: colors.emerald,
    secondary: colors.teal,
    accent: colors.forest,
    cardBackground: colors.white,
    success: colors.emerald,
    warning: colors.amber,
    error: colors.coral,
    info: colors.sky,
    transparent: colors.transparent,
  },
  dark: {
    text: colors.mist,
    background: colors.midnight,
    tint: tintColorDark,
    tabIconDefault: colors.slate,
    tabIconSelected: tintColorDark,
    primary: colors.emerald,
    secondary: colors.forest,
    accent: colors.teal,
    cardBackground: colors.graphite,
    success: colors.emerald,
    warning: colors.amber,
    error: colors.coral,
    info: colors.sky,
    transparent: colors.transparent,
  },
};
