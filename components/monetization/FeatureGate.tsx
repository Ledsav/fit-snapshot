/**
 * FeatureGate Component
 *
 * Wrapper that controls access to premium features. When the user lacks
 * access it renders one quiet PremiumLock row that opens the shared paywall
 * on tap — no blur overlay, no bespoke card, no silent no-op.
 */

import { Feature } from '@/constants/Features';
import { useLocalization } from '@/context/LocalizationContext';
import { useUser } from '@/context/UserContext';
import React, { ReactNode, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { PremiumLock } from './PremiumLock';
import PaywallModal from './PaywallModal';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean; // accepted for API compatibility; no longer blurs
  customMessage?: string;
  containerStyle?: ViewStyle;
  compact?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  customMessage,
  containerStyle,
  compact = false,
}) => {
  const { hasFeatureAccess } = useUser();
  const { t } = useLocalization();
  const [showPaywall, setShowPaywall] = useState(false);

  if (hasFeatureAccess(feature)) {
    return <View style={containerStyle}>{children}</View>;
  }

  if (fallback) {
    return <View style={containerStyle}>{fallback}</View>;
  }

  return (
    <View style={containerStyle}>
      <PremiumLock
        title={customMessage || t('featureGate.premiumFeature')}
        onPress={() => setShowPaywall(true)}
        compact={compact}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        source="feature_gate"
        feature={feature}
      />
    </View>
  );
};

export default FeatureGate;
