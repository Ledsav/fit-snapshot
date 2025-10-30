/**
 * Standardized Card Component
 *
 * A reusable card component with consistent styling across the app.
 *
 * Variants:
 * - default: Elevated card with shadow for main content (StreakCard, LatestPhotoCard)
 * - interactive: Bordered card for clickable items (Settings items, selectable options)
 * - emphasized: Bordered + elevated for important status (ProgressSummary, warnings)
 * - flat: Plain card with no elevation or border (rare use)
 *
 * Usage:
 * <Card variant="default" padding="lg">
 *   <Text>Card content</Text>
 * </Card>
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';
import {
  borderRadius,
  spacing,
  elevation,
} from '@/constants/DesignSystem';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'emphasized' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'lg',
  style,
  onPress,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  // Padding configurations
  const paddingStyles = {
    none: {},
    sm: { padding: spacing.sm },
    md: { padding: spacing.md },
    lg: { padding: spacing.xl },
    xl: { padding: spacing.xxl },
  };

  // Variant configurations - Semantic and consistent
  const variantStyles: Record<string, ViewStyle> = {
    // Main content cards (StreakCard, LatestPhotoCard, premium cards)
    default: {
      backgroundColor: theme.cardBackground,
      ...elevation.md,
      borderWidth: 0,
    },
    // Interactive/clickable cards (Settings items, selectable options)
    interactive: {
      backgroundColor: theme.cardBackground,
      borderWidth: 1,
      borderColor: withOpacity(theme.primary, overlayOpacity.light),
    },
    // Important status/metrics (ProgressSummary, alert cards)
    emphasized: {
      backgroundColor: theme.cardBackground,
      borderWidth: 2,
      borderColor: theme.primary,
      ...elevation.md,
    },
    // Plain cards with no decoration
    flat: {
      backgroundColor: theme.cardBackground,
    },
  };

  const content = (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        paddingStyles[padding],
        style,
      ]}
    >
      {children}
    </View>
  );

  // If onPress provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});
