/**
 * Paywall Modal Component
 *
 * Premium upgrade modal showing benefits and pricing options.
 * This is where users will be directed to upgrade to premium.
 */

import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';
import { Feature, getPremiumBenefits } from '@/constants/Features';
import { useLocalization } from '@/context/LocalizationContext';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { getDefaultOffering, purchasePackage } from '@/services/purchaseService';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  spacing,
  borderRadius,
  elevation,
  fontFamily,
  preciseType,
  typography,
  iconSize,
  opacity as designOpacity,
} from '@/constants/DesignSystem';
import { Button } from '@/components/ui';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  source?: string;
  feature?: Feature;
}

const { width, height } = Dimensions.get('window');

const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  source = 'unknown',
  feature,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { restorePurchases } = useUser();
  const { t } = useLocalization();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (!process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY) return;
    getDefaultOffering()
      .then((o) => {
        setOffering(o);
        setSelectedPkg(o?.annual ?? o?.availablePackages?.[0] ?? null);
      })
      .catch(() => setOffering(null));
  }, [visible]);

  const annualPkg = offering?.annual ?? null;
  const lifetimePkg = offering?.lifetime ?? null;

  // Get translated premium benefits
  const premiumBenefits = getPremiumBenefits(t);

  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setIsProcessing(true);
    try {
      const result = await purchasePackage(selectedPkg);
      if (result.userCancelled) return;
      if (result.status?.isPremium) {
        onClose(); // UserContext listener refreshes premium state automatically
        return;
      }
      alert(result.error ?? t('paywall.purchaseError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const { isPremium } = await restorePurchases();
      alert(isPremium ? t('paywall.restoreSuccess') : t('paywall.restoreNone'));
      if (isPremium) onClose();
    } catch {
      alert(t('paywall.purchaseError'));
    } finally {
      setIsRestoring(false);
    }
  };

  const PricingCard = ({
    pkg,
    title,
    subtitle,
    priceSuffix,
    isPopular,
  }: {
    pkg: PurchasesPackage;
    title: string;
    subtitle: string;
    priceSuffix?: string;
    isPopular?: boolean;
  }) => {
    const isSelected = selectedPkg?.identifier === pkg.identifier;

    return (
      <TouchableOpacity
        style={[
          styles.pricingCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isSelected ? theme.primary : withOpacity(theme.secondary, overlayOpacity.light),
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedPkg(pkg)}
        activeOpacity={0.8}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.popularBadgeText, { color: theme.background, fontFamily: fontFamily.mono }]}>
              {t("paywall.mostPopular").toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.pricingHeader}>
          <View style={[styles.radioButton, { borderColor: isSelected ? theme.primary : theme.secondary }]}>
            {isSelected && (
              <View style={[styles.radioButtonInner, { backgroundColor: theme.primary }]} />
            )}
          </View>
          <View style={styles.pricingInfo}>
            <Text style={[styles.pricingTitle, { color: theme.text, fontFamily: fontFamily.body }]}>{title}</Text>
            <Text style={[styles.pricingSubtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.pricingBottom}>
          <Text style={[styles.pricingPrice, { color: theme.primary, fontFamily: fontFamily.mono }]}>
            {pkg.product.priceString}{priceSuffix ?? ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={[styles.fullContainer, { backgroundColor: theme.background }]}>
        <SafeAreaView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text
              style={[styles.heroTitle, preciseType.heroTitle, { color: theme.text, fontFamily: fontFamily.display }]}
            >
              {t("paywall.upgradeTitle")}
            </Text>
            <Text style={[styles.heroSubtitle, preciseType.tipBody, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {t("paywall.upgradeSubtitle")}
            </Text>
          </View>

          {/* Benefits List */}
          <View style={styles.benefitsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("paywall.premiumBenefits")}
            </Text>
            {premiumBenefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <View
                  style={[
                    styles.benefitIconContainer,
                    { backgroundColor: theme.primary + '15' },
                  ]}
                >
                  <Ionicons name={benefit.icon} size={24} color={theme.primary} />
                </View>
                <View style={styles.benefitText}>
                  <Text style={[styles.benefitTitle, { color: theme.text }]}>
                    {benefit.title}
                  </Text>
                  <Text style={[styles.benefitDescription, { color: theme.text }]}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Options */}
          <View style={styles.pricingContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('paywall.choosePlan')}
            </Text>

            {annualPkg && (
              <PricingCard
                pkg={annualPkg}
                title={t('paywall.annual')}
                subtitle={t('paywall.freeTrial')}
                priceSuffix={t('paywall.perYear')}
                isPopular
              />
            )}
            {lifetimePkg && (
              <PricingCard
                pkg={lifetimePkg}
                title={t('paywall.lifetime')}
                subtitle={t('paywall.oneTimePayment')}
              />
            )}
          </View>

          {/* Purchase Button */}
          <Button
            title={isProcessing ? t("paywall.processing") : t("paywall.continueToPayment")}
            onPress={handlePurchase}
            variant="primary"
            size="large"
            loading={isProcessing}
            disabled={isProcessing || !selectedPkg}
            icon={<Ionicons name="cart" size={iconSize.md} color={theme.background} />}
            iconPosition="left"
            style={styles.purchaseButton}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {t("paywall.cancelAnytime")}
            </Text>
            <Text style={[styles.trustLine, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
              {t("paywall.trustLine")}
            </Text>
            <Text style={[styles.footerText, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {t("paywall.termsAgreement")}
            </Text>
            <TouchableOpacity onPress={handleRestore} disabled={isRestoring} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.footerText, { color: theme.primary, fontFamily: fontFamily.body }]}>
                {isRestoring ? t('paywall.restoring') : t('paywall.restore')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
    zIndex: 11,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.huge,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  heroTitle: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  benefitsContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
  },
  benefitIconContainer: {
    width: iconSize.xxl,
    height: iconSize.xxl,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  benefitDescription: {
    ...typography.caption,
    opacity: designOpacity.medium,
    lineHeight: 20,
  },
  pricingContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  pricingCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  popularBadgeText: {
    ...typography.tiny,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  radioButton: {
    width: iconSize.md,
    height: iconSize.md,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: borderRadius.round,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingTitle: {
    ...typography.h4,
  },
  pricingSubtitle: {
    ...typography.caption,
    opacity: designOpacity.secondary,
    marginTop: 2,
  },
  pricingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 36,
  },
  pricingPrice: {
    ...typography.h2,
  },
  purchaseButton: {
    marginHorizontal: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  trustLine: {
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});

export default PaywallModal;
