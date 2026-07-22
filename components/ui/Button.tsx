/**
 * Standardized Button Component
 *
 * The single button system for the app (Measured Confidence).
 * Mono uppercase label, hairline or solid fill, no drop shadow.
 * All buttons meet WCAG touch target requirements (minimum 44x44px).
 *
 * Variants:
 * - primary:   brass fill — the one action that matters in a view
 * - ghost:     transparent + steel hairline — secondary action
 * - outline:   alias of ghost (kept for API compatibility)
 * - secondary: subtle steel fill (kept for API compatibility)
 * - danger:    transparent + brick border/label — destructive
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';
import {
  borderRadius,
  spacing,
  fontFamily,
  preciseType,
  touchTarget,
  opacity,
} from '@/constants/DesignSystem';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  const sizeStyles = {
    small: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: touchTarget.min,
    },
    medium: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: touchTarget.comfortable,
    },
    large: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xxl,
      minHeight: touchTarget.large,
    },
  };

  const hairline = withOpacity(theme.secondary, overlayOpacity.light);

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.primary },
    secondary: {
      backgroundColor: withOpacity(theme.secondary, overlayOpacity.subtle),
      borderWidth: 1,
      borderColor: hairline,
    },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: hairline },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: hairline },
    danger: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: withOpacity(theme.error, overlayOpacity.heavy),
    },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: theme.onAccent },
    secondary: { color: theme.text },
    outline: { color: theme.text },
    ghost: { color: theme.text },
    danger: { color: theme.error },
  };

  const spinnerColor =
    variant === 'primary' ? theme.onAccent : variant === 'danger' ? theme.error : theme.text;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && { opacity: opacity.disabled },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {title && (
            <Text
              style={[styles.text, preciseType.badgeLabel, textVariantStyles[variant], textStyle]}
            >
              {title.toUpperCase()}
            </Text>
          )}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.mono,
  },
  fullWidth: {
    width: '100%',
  },
});
