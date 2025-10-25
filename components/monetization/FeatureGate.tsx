/**
 * FeatureGate Component
 *
 * Wrapper component that controls access to premium features.
 * Shows upgrade prompt or locked state when user doesn't have access.
 */

import React, { useState, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Feature } from '@/constants/Features';
import Colors from '@/constants/Colors';
import PaywallModal from './PaywallModal';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean; // Show blurred preview of content
  customMessage?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showPreview = true,
  customMessage,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { hasFeatureAccess } = useUser();
  const [showPaywall, setShowPaywall] = useState(false);

  const hasAccess = hasFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default locked UI with blur preview
  return (
    <View style={styles.container}>
      {showPreview && (
        <View style={styles.previewContainer}>
          <View style={{ opacity: 0.3 }}>{children}</View>
          <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={effectiveColorScheme} />
        </View>
      )}

      <View style={[styles.lockedOverlay, !showPreview && { position: 'relative' }]}>
        <View style={[styles.lockContainer, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="lock-closed" size={32} color={theme.primary} />
          <Text style={[styles.lockTitle, { color: theme.text }]}>Premium Feature</Text>
          <Text style={[styles.lockMessage, { color: theme.text }]}>
            {customMessage || 'Upgrade to Premium to unlock this feature'}
          </Text>
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
            onPress={() => setShowPaywall(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={20} color={theme.background} />
            <Text style={[styles.upgradeButtonText, { color: theme.background }]}>
              Upgrade Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        source="feature_gate"
        feature={feature}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 150,
  },
  previewContainer: {
    position: 'relative',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 300,
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  lockMessage: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeatureGate;
