/**
 * Premium Badge Component
 *
 * Visual indicator for premium features and premium users.
 */

import Colors from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface PremiumBadgeProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'icon' | 'text' | 'full';
  style?: ViewStyle;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  size = 'medium',
  variant = 'full',
  style,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  const sizes = {
    small: { icon: 14, text: 10, padding: 4 },
    medium: { icon: 18, text: 12, padding: 6 },
    large: { icon: 24, text: 14, padding: 8 },
  };

  const currentSize = sizes[size];

  if (variant === 'icon') {
    return (
      <View style={[styles.iconContainer, style]}>
        <Ionicons name="star" size={currentSize.icon} color={theme.primary} />
      </View>
    );
  }

  if (variant === 'text') {
    return (
      <View
        style={[
          styles.textContainer,
          { backgroundColor: theme.primary + '20', padding: currentSize.padding },
          style,
        ]}
      >
        <Text
          style={[styles.text, { color: theme.primary, fontSize: currentSize.text }]}
        >
          PREMIUM
        </Text>
      </View>
    );
  }

  
  return (
    <LinearGradient
      colors={[theme.primary, theme.primary + 'CC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.fullContainer, { padding: currentSize.padding }, style]}
    >
      <Ionicons name="star" size={currentSize.icon} color="#FFF" />
      <Text style={[styles.fullText, { fontSize: currentSize.text }]}>PREMIUM</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  text: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  fullText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default PremiumBadge;
