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
