/**
 * Design System Constants
 * Central source of truth for all design tokens
 *
 * This file contains standardized values for spacing, typography, colors,
 * shadows, and other design elements to ensure consistency across the app.
 */

// Spacing Scale (based on 4px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

// Font family tokens (Measured Confidence type system)
export const fontFamily = {
  display: "Fraunces_500Medium_Italic", // editorial voice — photos, motivational copy
  displayRegular: "Fraunces_500Medium",
  mono: "IBMPlexMono_500Medium", // precision voice — stats, dates, labels
  monoSemiBold: "IBMPlexMono_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
} as const;

// Type-scale tokens for Measured Confidence components (additive — does not
// touch `typography`, which other screens still rely on unchanged).
export const preciseType = {
  wordmark: { fontSize: 12, letterSpacing: 2 },        // Header top bar
  caption: { fontSize: 11, letterSpacing: 0.5 },       // ContactSheetFrame caption, before/after labels
  statValue: { fontSize: 20 },                          // InstrumentStrip big numbers
  statLabel: { fontSize: 9, letterSpacing: 1 },        // InstrumentStrip small labels
  badgeValue: { fontSize: 14 },                         // StreakBadge count
  badgeLabel: { fontSize: 10, letterSpacing: 1 },      // StreakBadge label, NextPhotoReminder action
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },  // Home screen section labels (Latest Photo, Tips)
  message: { fontSize: 16 },                            // NextPhotoReminder title
  subtitle: { fontSize: 13 },                           // NextPhotoReminder subtitle
  tipHeadline: { fontSize: 17 },                        // ShreddedTipsCarousel main tip
  tipBody: { fontSize: 14 },                            // ShreddedTipsCarousel clarification
} as const;

// Typography Scale
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  smallBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  tiny: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
  },
} as const;

// Border Radius Scale
export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  round: 999, // For fully rounded buttons/elements
} as const;

// Icon Size Scale
export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
  xxl: 48,
  xxxl: 60, // Used for hero icons like StreakCard flame
} as const;

// Opacity Scale
export const opacity = {
  disabled: 0.38,
  hint: 0.5,
  secondary: 0.6,
  medium: 0.7,
  high: 0.87,
  opaque: 1,
} as const;

// Elevation/Shadow Presets for iOS and Android
export const elevation = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// Touch Target Sizes (WCAG compliant)
export const touchTarget = {
  min: 44, // Minimum WCAG compliant touch target
  comfortable: 48,
  large: 56,
  xlarge: 64,
} as const;

// Common Overlay Colors (function to generate theme-aware overlays)
export const overlays = (themeColors: any) => ({
  dark: {
    light: 'rgba(0, 0, 0, 0.4)',
    medium: 'rgba(0, 0, 0, 0.6)',
    heavy: 'rgba(0, 0, 0, 0.8)',
  },
  light: {
    light: 'rgba(255, 255, 255, 0.4)',
    medium: 'rgba(255, 255, 255, 0.6)',
    heavy: 'rgba(255, 255, 255, 0.8)',
  },
  primary: {
    light: `${themeColors.primary}26`, // 15% opacity
    medium: `${themeColors.primary}40`, // 25% opacity
    heavy: `${themeColors.primary}66`, // 40% opacity
  },
  success: {
    light: `${themeColors.success}26`,
    medium: `${themeColors.success}40`,
    heavy: `${themeColors.success}66`,
  },
  error: {
    light: `${themeColors.error}26`,
    medium: `${themeColors.error}40`,
    heavy: `${themeColors.error}66`,
  },
  warning: {
    light: `${themeColors.warning}26`,
    medium: `${themeColors.warning}40`,
    heavy: `${themeColors.warning}66`,
  },
});

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Animation Durations (in milliseconds)
export const duration = {
  fastest: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slowest: 800,
} as const;

// Common Layout Values
export const layout = {
  screenPadding: spacing.xl,
  sectionSpacing: spacing.xxxl,
  cardPadding: spacing.xl,
  listItemPadding: spacing.lg,
} as const;

// Helper function to get responsive spacing based on screen width
export const getResponsiveSpacing = (width: number) => {
  if (width < 375) {
    // Small screens
    return {
      screenPadding: spacing.lg,
      sectionSpacing: spacing.xxl,
    };
  } else if (width >= 375 && width < 768) {
    // Medium screens (most phones)
    return {
      screenPadding: spacing.xl,
      sectionSpacing: spacing.xxxl,
    };
  } else {
    // Large screens (tablets)
    return {
      screenPadding: spacing.xxl,
      sectionSpacing: spacing.huge,
    };
  }
};

// Export all design tokens
export default {
  spacing,
  fontFamily,
  preciseType,
  typography,
  borderRadius,
  iconSize,
  opacity,
  elevation,
  touchTarget,
  overlays,
  zIndex,
  duration,
  layout,
  getResponsiveSpacing,
};
