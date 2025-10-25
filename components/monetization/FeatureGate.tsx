/**
 * FeatureGate Component
 *
 * Wrapper component that controls access to premium features.
 * Shows upgrade prompt or locked state when user doesn't have access.
 */

import Colors from '@/constants/Colors';
import { Feature } from '@/constants/Features';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { ReactNode, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import PaywallModal from './PaywallModal';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean; 
  customMessage?: string;
  containerStyle?: ViewStyle; 
  compact?: boolean; 
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showPreview = true,
  customMessage,
  containerStyle,
  compact = false,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { hasFeatureAccess } = useUser();
  const [showPaywall, setShowPaywall] = useState(false);

  const hasAccess = hasFeatureAccess(feature);

  if (hasAccess) {
    return <View style={containerStyle}>{children}</View>;
  }

  
  if (fallback) {
    return <View style={containerStyle}>{fallback}</View>;
  }

  
  return (
    <View style={[styles.container, containerStyle]}>
      {showPreview ? (
        <>
          <View style={styles.previewContainer}>
            <View style={{ opacity: 0.3 }}>{children}</View>
            <BlurView intensity={80} style={StyleSheet.absoluteFill} tint={effectiveColorScheme} />
          </View>

          <View style={styles.lockedOverlay}>
            <View style={[
              styles.lockContainer,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.primary,
              },
              compact && styles.lockContainerCompact
            ]}>
              <Ionicons
                name="lock-closed"
                size={compact ? 24 : 32}
                color={theme.primary}
              />
              <Text style={[
                styles.lockTitle,
                { color: theme.text },
                compact && styles.lockTitleCompact
              ]}>
                Premium Feature
              </Text>
              {!compact && (
                <Text style={[styles.lockMessage, { color: theme.text }]}>
                  {customMessage || 'Upgrade to Premium to unlock this feature'}
                </Text>
              )}
              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  { backgroundColor: theme.primary },
                  compact && styles.upgradeButtonCompact
                ]}
                onPress={() => setShowPaywall(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="star" size={compact ? 16 : 20} color={theme.background} />
                <Text style={[
                  styles.upgradeButtonText,
                  { color: theme.background },
                  compact && styles.upgradeButtonTextCompact
                ]}>
                  {compact ? 'Upgrade' : 'Upgrade Now'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={[
          styles.lockContainer,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.primary,
          },
          compact && styles.lockContainerCompact,
          styles.lockContainerStandalone
        ]}>
          <Ionicons
            name="lock-closed"
            size={compact ? 24 : 32}
            color={theme.primary}
          />
          <Text style={[
            styles.lockTitle,
            { color: theme.text },
            compact && styles.lockTitleCompact
          ]}>
            Premium Feature
          </Text>
          {!compact && (
            <Text style={[styles.lockMessage, { color: theme.text }]}>
              {customMessage || 'Upgrade to Premium to unlock this feature'}
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.upgradeButton,
              { backgroundColor: theme.primary },
              compact && styles.upgradeButtonCompact
            ]}
            onPress={() => setShowPaywall(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="star" size={compact ? 16 : 20} color={theme.background} />
            <Text style={[
              styles.upgradeButtonText,
              { color: theme.background },
              compact && styles.upgradeButtonTextCompact
            ]}>
              {compact ? 'Upgrade' : 'Upgrade Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
  },
  previewContainer: {
    position: 'relative',
    minHeight: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 12,
  },
  lockContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  lockContainerCompact: {
    padding: 16,
  },
  lockContainerStandalone: {
    width: '100%',
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  lockTitleCompact: {
    fontSize: 16,
    marginTop: 8,
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
  upgradeButtonCompact: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  upgradeButtonTextCompact: {
    fontSize: 14,
  },
});

export default FeatureGate;
