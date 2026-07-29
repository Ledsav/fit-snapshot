/**
 * Standardized Badge Component
 *
 * A reusable badge component for labels, tags, and status indicators.
 * Supports multiple variants and sizes.
 *
 * Usage:
 * <Badge text="Premium" variant="primary" size="medium" />
 * <Badge text="New" variant="success" size="small" />
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';
import {
  borderRadius,
  spacing,
  typography,
} from '@/constants/DesignSystem';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  outlined?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
  outlined = false,
  style,
  textStyle,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  // Size configurations
  const sizeStyles = {
    small: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    medium: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.md,
    },
    large: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
  };

  // Typography by size
  const textSizeStyles = {
    small: typography.tiny,
    medium: typography.small,
    large: typography.caption,
  };

  // Color configurations
  const getVariantColors = () => {
    const variantColorMap = {
      primary: theme.primary,
      secondary: theme.secondary,
      success: theme.success,
      warning: theme.warning,
      error: theme.error,
      info: theme.info,
      neutral: theme.tabIconDefault,
    };

    const color = variantColorMap[variant];

    if (outlined) {
      return {
        backgroundColor: 'transparent',
        borderColor: color,
        textColor: color,
      };
    } else {
      return {
        backgroundColor: withOpacity(color, overlayOpacity.light),
        borderColor: 'transparent',
        textColor: color,
      };
    }
  };

  const colors = getVariantColors();

  return (
    <View
      style={[
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          borderWidth: outlined ? 1.5 : 0,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          textSizeStyles[size],
          { color: colors.textColor },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.round,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});
