/**
 * Standardized Button Component
 *
 * A reusable button component with multiple variants and sizes.
 * All buttons meet WCAG touch target requirements (minimum 44x44px).
 *
 * Usage:
 * <Button title="Click Me" onPress={handlePress} variant="primary" size="medium" />
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
import Colors from '@/constants/Colors';
import {
  borderRadius,
  spacing,
  typography,
  elevation,
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

  // Size configurations
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

  // Variant configurations
  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: theme.primary,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: theme.secondary,
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    danger: {
      backgroundColor: theme.error,
      borderWidth: 0,
    },
  };

  // Text color configurations
  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: theme.background },
    secondary: { color: theme.background },
    outline: { color: theme.primary },
    ghost: { color: theme.primary },
    danger: { color: theme.background },
  };

  // Typography by size
  const textSizeStyles = {
    small: typography.caption,
    medium: typography.body,
    large: typography.h4,
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        // Apply elevation only to solid variants
        (variant === 'primary' || variant === 'secondary' || variant === 'danger') &&
          !isDisabled &&
          elevation.md,
        fullWidth && styles.fullWidth,
        isDisabled && { opacity: opacity.disabled },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? theme.primary
              : theme.background
          }
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {title && (
            <Text
              style={[
                styles.text,
                textSizeStyles[size],
                textVariantStyles[variant],
                icon && iconPosition === 'left' && { marginLeft: spacing.sm },
                icon && iconPosition === 'right' && { marginRight: spacing.sm },
                textStyle,
              ]}
            >
              {title}
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
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
});
