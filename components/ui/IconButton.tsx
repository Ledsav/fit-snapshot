/**
 * Standardized IconButton Component
 *
 * A reusable icon button component with proper touch targets.
 * Automatically meets WCAG requirements (minimum 44x44px).
 *
 * Usage:
 * <IconButton
 *   icon={<Ionicons name="close" size={24} />}
 *   onPress={handleClose}
 *   variant="ghost"
 *   size="medium"
 * />
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';
import {
  borderRadius,
  spacing,
  elevation,
  touchTarget,
  opacity,
} from '@/constants/DesignSystem';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'light';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  rounded?: boolean; // If true, makes button fully circular
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'ghost',
  size = 'medium',
  disabled = false,
  style,
  rounded = false,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  // Size configurations (ensures WCAG compliance)
  const sizeStyles = {
    small: {
      width: touchTarget.min,
      height: touchTarget.min,
      padding: spacing.sm,
    },
    medium: {
      width: touchTarget.comfortable,
      height: touchTarget.comfortable,
      padding: spacing.md,
    },
    large: {
      width: touchTarget.large,
      height: touchTarget.large,
      padding: spacing.lg,
    },
  };

  // Variant configurations
  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: theme.primary,
    },
    secondary: {
      backgroundColor: theme.secondary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: theme.error,
    },
    light: {
      backgroundColor: withOpacity(theme.background, overlayOpacity.medium),
    },
  };

  // Border radius based on rounded prop and size
  const getBorderRadius = () => {
    if (rounded) {
      return borderRadius.round;
    }
    switch (size) {
      case 'small':
        return borderRadius.sm;
      case 'medium':
        return borderRadius.md;
      case 'large':
        return borderRadius.lg;
      default:
        return borderRadius.md;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        { borderRadius: getBorderRadius() },
        // Apply elevation only to solid variants
        (variant === 'primary' || variant === 'secondary' || variant === 'danger') &&
          !disabled &&
          elevation.md,
        disabled && { opacity: opacity.disabled },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{icon}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
