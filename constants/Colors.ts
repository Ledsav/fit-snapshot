// Color definitions
const colors = {
  limeGreen: "#CCFF00",
  darkGray: "#1A1A1A",
  mediumGray: "#2A2A2A",
  lightGray: "#3A3A3A",
  white: "#FFFFFF",
  black: "#000000",
  teal: "#20B2AA",
  coral: "#FF6B6B",
  skyBlue: "#87CEEB",
  lime: "#32CD32",
  amber: "#FFBF00",
  charcoal: "#36454F",
  transparent: "transparent",
};

const tintColorLight = colors.limeGreen;
const tintColorDark = colors.limeGreen;

export default {
  light: {
    text: colors.white,
    background: colors.darkGray,
    tint: tintColorLight,
    tabIconDefault: colors.lightGray,
    tabIconSelected: tintColorLight,
    primary: colors.limeGreen,
    secondary: colors.mediumGray,
    accent: colors.white,
    cardBackground: colors.mediumGray,
    success: colors.lime,
    warning: colors.amber,
    error: colors.coral,
    info: colors.skyBlue,
    teal: colors.teal,
    charcoal: colors.charcoal,
    transparent: colors.transparent,
  },
  dark: {
    text: colors.white,
    background: colors.darkGray,
    tint: tintColorDark,
    tabIconDefault: colors.lightGray,
    tabIconSelected: tintColorDark,
    primary: colors.limeGreen,
    secondary: colors.mediumGray,
    accent: colors.white,
    cardBackground: colors.mediumGray,
    success: colors.lime,
    warning: colors.amber,
    error: colors.coral,
    info: colors.skyBlue,
    teal: colors.teal,
    charcoal: colors.charcoal,
    transparent: colors.transparent,
  },
};
