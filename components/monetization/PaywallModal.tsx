/**
 * Paywall Modal Component
 *
 * Premium upgrade modal showing benefits and pricing options.
 * This is where users will be directed to upgrade to premium.
 */

import Colors from '@/constants/Colors';
import { Feature, getPremiumBenefits, PRICING } from '@/constants/Features';
import { useLocalization } from '@/context/LocalizationContext';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  source?: string; 
  feature?: Feature; 
}

type PricingPlan = 'monthly' | 'annual' | 'lifetime';

const { width, height } = Dimensions.get('window');

const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  source = 'unknown',
  feature,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { setTestPremiumStatus } = useUser();
  const { t } = useLocalization();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('annual');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get translated premium benefits
  const premiumBenefits = getPremiumBenefits(t);

  const handlePurchase = async () => {
    setIsProcessing(true);

    try {
      
      
      console.log('Purchase initiated:', {
        plan: selectedPlan,
        source,
        feature,
        priceId: PRICING[selectedPlan].priceId,
      });

      
      await new Promise((resolve) => setTimeout(resolve, 1000));

      
      await setTestPremiumStatus(true);

      alert('Premium activated! (Testing mode)');
      onClose();
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const PricingCard = ({
    plan,
    price,
    title,
    subtitle,
    savings,
    isPopular,
  }: {
    plan: PricingPlan;
    price: string;
    title: string;
    subtitle: string;
    savings?: string;
    isPopular?: boolean;
  }) => {
    const isSelected = selectedPlan === plan;

    return (
      <TouchableOpacity
        style={[
          styles.pricingCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isSelected ? theme.primary : 'transparent',
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedPlan(plan)}
        activeOpacity={0.8}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.popularBadgeText, { color: theme.background }]}>
              {t("paywall.mostPopular")}
            </Text>
          </View>
        )}
        <View style={styles.pricingHeader}>
          <View style={styles.radioButton}>
            {isSelected && (
              <View
                style={[styles.radioButtonInner, { backgroundColor: theme.primary }]}
              />
            )}
          </View>
          <View style={styles.pricingInfo}>
            <Text style={[styles.pricingTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.pricingSubtitle, { color: theme.text }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.pricingBottom}>
          <Text style={[styles.pricingPrice, { color: theme.primary }]}>{t("paywall.currency")}{price}</Text>
          {savings && (
            <View style={[styles.savingsBadge, { backgroundColor: theme.success + '20' }]}>
              <Text style={[styles.savingsText, { color: theme.success }]}>
                {t("paywall.save")} {savings}%
              </Text>
            </View>
          )}
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
          <LinearGradient
            colors={[theme.primary + '20', theme.primary + '05']}
            style={styles.hero}
          >
            <Ionicons name="star" size={48} color={theme.primary} />
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              {t("paywall.upgradeTitle")}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.text }]}>
              {t("paywall.upgradeSubtitle")}
            </Text>
          </LinearGradient>

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
              {t("paywall.choosePlan")}
            </Text>

            <PricingCard
              plan="annual"
              price={PRICING.annual.price.toFixed(2)}
              title={t("paywall.annual")}
              subtitle={`${t("paywall.currency")}${PRICING.annual.monthlyEquivalent}${t("paywall.perMonth")}`}
              savings={PRICING.annual.savings.toString()}
              isPopular
            />

            <PricingCard
              plan="monthly"
              price={PRICING.monthly.price.toFixed(2)}
              title={t("paywall.monthly")}
              subtitle={t("paywall.billedMonthly")}
            />

            <PricingCard
              plan="lifetime"
              price={PRICING.lifetime.price.toFixed(2)}
              title={t("paywall.lifetime")}
              subtitle={t("paywall.oneTimePayment")}
            />
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              { backgroundColor: theme.primary },
              isProcessing && { opacity: 0.6 },
            ]}
            onPress={handlePurchase}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <Ionicons name="cart" size={24} color={theme.background} />
            <Text style={[styles.purchaseButtonText, { color: theme.background }]}>
              {isProcessing ? t("paywall.processing") : t("paywall.continueToPayment")}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.text }]}>
              {t("paywall.cancelAnytime")}
            </Text>
            <Text style={[styles.footerText, { color: theme.text }]}>
              {t("paywall.termsAgreement")}
            </Text>
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
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
  benefitsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  pricingContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  pricingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  pricingInfo: {
    flex: 1,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pricingSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  pricingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 36,
  },
  pricingPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
});

export default PaywallModal;
