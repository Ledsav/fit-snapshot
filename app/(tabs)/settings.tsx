import PaywallModal from "@/components/monetization/PaywallModal";
import { PremiumBadge } from "@/components/monetization/PremiumBadge";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";
import ContactsModal from "@/components/settings/ContactsModal";
import { DailyReminder } from "@/components/settings/DailyReminder";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { StorageManager } from "@/components/settings/StorageManager";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import Colors, { overlayOpacity, withOpacity } from "@/constants/Colors";
import {
  borderRadius,
  opacity as designOpacity,
  fontFamily,
  preciseType,
  iconSize,
  spacing,
  typography
} from "@/constants/DesignSystem";
import { FREE_TIER_LIMITS } from "@/constants/Features";
import { useAuth } from "@/context/AuthContext";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SettingItem: React.FC<{
  title: string;
  onPress: () => void;
  icon: string;
  theme: any;
  value?: string;
}> = ({ title, onPress, icon, theme, value }) => (
  <TouchableOpacity
    style={[
      styles.settingItem,
      {
        backgroundColor: theme.cardBackground,
        borderColor: withOpacity(theme.secondary, overlayOpacity.light)
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
      <Ionicons name={icon as any} size={20} color={theme.primary} />
    </View>
    <Text style={[styles.settingText, { color: theme.text, fontFamily: fontFamily.body }]}>{title}</Text>
    {value && (
      <Text style={[styles.settingValue, { color: theme.secondary, fontFamily: fontFamily.mono }]}>{value}</Text>
    )}
    <Ionicons name="chevron-forward" size={18} color={theme.secondary} />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { effectiveColorScheme, themeMode } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t, locale } = useLocalization();
  const { isPremium, featureUsage, setTestPremiumStatus, restorePurchases } = useUser();
  const { user, userInfo, signIn, signOut: handleSignOut } = useAuth();
  const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] =
    useState(false);
  const [isThemeSelectorVisible, setIsThemeSelectorVisible] = useState(false);
  const [isContactsModalVisible, setIsContactsModalVisible] = useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  const handleLanguagePress = () => {
    setIsLanguageSelectorVisible(true);
  };

  const handleThemePress = () => {
    setIsThemeSelectorVisible(true);
  };

  const handleContactsPress = () => {
    setIsContactsModalVisible(true);
  };

  const handleTutorialPress = () => {
    setIsTutorialVisible(true);
  };

  const handleUpgradePress = () => {
    setIsPaywallVisible(true);
  };

  const handleManageSubscription = () => {
    Linking.openURL('https://play.google.com/store/account/subscriptions').catch(() =>
      Alert.alert(t('settings.manageSubscription'), 'Open Google Play to manage your subscription.')
    );
  };

  const handleRestorePress = async () => {
    try {
      const { isPremium: restored } = await restorePurchases();
      Alert.alert(
        t('settings.restorePurchases'),
        restored ? t('paywall.restoreSuccess') : t('paywall.restoreNone')
      );
    } catch {
      Alert.alert(t('settings.restorePurchases'), t('paywall.purchaseError'));
    }
  };

  const handleTestPremiumToggle = () => {
    Alert.alert(
      "Test Mode",
      isPremium ? "Disable Premium for testing?" : "Enable Premium for testing?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => setTestPremiumStatus(!isPremium),
        },
      ]
    );
  };

  const handleSignInPress = async () => {
    try {
      await signIn();
      Alert.alert("Success", "Signed in successfully!");
    } catch (error: any) {
      Alert.alert("Sign In Failed", error.message || "Failed to sign in with Google");
    }
  };

  const handleSignOutPress = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await handleSignOut();
              Alert.alert("Signed Out", "You have been signed out successfully.");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to sign out");
            }
          },
        },
      ]
    );
  };

  const getThemeDisplayName = () => {
    switch (themeMode) {
      case 'light':
        return t('settings.light');
      case 'dark':
        return t('settings.dark');
      case 'system':
        return t('settings.system');
      default:
        return themeMode;
    }
  };

  const getLanguageDisplayName = (locale: string) => {
    switch (locale) {
      case "en":
        return "English";
      case "es":
        return "Español";
      case "it":
        return "Italiano";
      case "de":
        return "Deutsch";
      case "fr":
        return "Français";
      default:
        return locale;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("settings.title")}
        </Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.text }]}>
            Account
          </Text>
          {user ? (
            <View>
              <View
                style={[
                  styles.settingItem,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: withOpacity(theme.primary, overlayOpacity.medium),
                  },
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
                  <Ionicons name="person" size={24} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.settingText, { color: theme.text }]}>
                    {userInfo?.displayName || userInfo?.email || 'User'}
                  </Text>
                  {userInfo?.email && userInfo?.displayName && (
                    <Text style={[styles.settingValue, { color: theme.text, opacity: 0.6 }]}>
                      {userInfo.email}
                    </Text>
                  )}
                </View>
              </View>
              <SettingItem
                title="Sign Out"
                onPress={handleSignOutPress}
                icon="log-out-outline"
                theme={theme}
              />
            </View>
          ) : (
            <SettingItem
              title="Sign In"
              onPress={handleSignInPress}
              icon="log-in-outline"
              theme={theme}
            />
          )}
        </View>

        {/* Premium Section */}
        <View style={styles.section}>
          {isPremium ? (
            <View style={[styles.premiumCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
              <View style={styles.premiumHeader}>
                <PremiumBadge size="large" />
                <Text style={[styles.premiumTitle, { color: theme.text, fontFamily: fontFamily.display }]}>
                  {t("settings.premiumActive")}
                </Text>
              </View>
              <Text style={[styles.premiumSubtitle, preciseType.subtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
                {t("settings.thankYouMessage")}
              </Text>
              <View
                style={[
                  styles.premiumStats,
                  {
                    borderTopColor: withOpacity(theme.secondary, overlayOpacity.light),
                    borderBottomColor: withOpacity(theme.secondary, overlayOpacity.light),
                  },
                ]}
              >
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text, fontFamily: fontFamily.mono }]}>
                    {featureUsage.photoCount}
                  </Text>
                  <Text style={[styles.statLabel, preciseType.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
                    {t("settings.photos").toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary, fontFamily: fontFamily.mono }]}>&#8734;</Text>
                  <Text style={[styles.statLabel, preciseType.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
                    {t("settings.limit").toUpperCase()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.manageButton, { borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}
                onPress={handleManageSubscription}
              >
                <Text style={[styles.manageButtonText, preciseType.badgeLabel, { color: theme.text, fontFamily: fontFamily.mono }]}>
                  {t("settings.manageSubscription").toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.upgradeCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
              onPress={handleUpgradePress}
              activeOpacity={0.85}
            >
              <Text style={[styles.upgradeTitle, { color: theme.text, fontFamily: fontFamily.display }]}>
                {t("settings.upgradeToPremium")}
              </Text>
              <Text style={[styles.upgradeSubtitle, preciseType.subtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
                {t("settings.unlimitedPhotosAnalytics")}
              </Text>
              <Text style={[styles.upgradeStatsText, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
                {featureUsage.photoCount} / {FREE_TIER_LIMITS.MAX_PHOTOS} {t("settings.photosUsed").toUpperCase()}
              </Text>
              <View style={[styles.upgradeButton, { backgroundColor: theme.primary }]}>
                <Text style={[styles.upgradeButtonText, preciseType.badgeLabel, { color: theme.background, fontFamily: fontFamily.mono }]}>
                  {t("settings.seePlans").toUpperCase()}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={theme.background} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.cardBackground, borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}
            onPress={handleRestorePress}
          >
            <View style={[styles.iconContainer, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
              <Ionicons name="refresh-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.restorePurchases')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Test Mode Toggle (development only) */}
        {__DEV__ && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.settingItem,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: withOpacity(theme.primary, overlayOpacity.medium),
                },
              ]}
              onPress={handleTestPremiumToggle}
            >
              <View style={[styles.iconContainer, { backgroundColor: withOpacity(theme.warning, overlayOpacity.subtle) }]}>
                <Ionicons name="flask-outline" size={24} color={theme.warning} />
              </View>
              <Text style={[styles.settingText, { color: theme.text }]}>
                {t("settings.testPremium")} ({isPremium ? t("settings.on") : t("settings.off")})
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.text }]}>
            {t("settings.reminders")}
          </Text>
          <DailyReminder />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.text }]}>
            {t("settings.storage")}
          </Text>
          <StorageManager />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.text }]}>
            {t("settings.support")}
          </Text>
          <SettingItem
            title={t("settings.viewTutorial")}
            onPress={handleTutorialPress}
            icon="book-outline"
            theme={theme}
          />
          <SettingItem
            title={t("settings.helpAndFeedback")}
            onPress={handleContactsPress}
            icon="help-circle-outline"
            theme={theme}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.text }]}>
            {t("settings.appearance")}
          </Text>
          <SettingItem
            title={t("settings.theme")}
            onPress={handleThemePress}
            icon="color-palette-outline"
            theme={theme}
            value={getThemeDisplayName()}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.text }]}>
            {t("settings.language")}
          </Text>
          <SettingItem
            title={t("settings.selectLanguage")}
            onPress={handleLanguagePress}
            icon="language-outline"
            theme={theme}
            value={getLanguageDisplayName(locale)}
          />
        </View>
      </ScrollView>

      <ThemeSelector
        isVisible={isThemeSelectorVisible}
        onClose={() => setIsThemeSelectorVisible(false)}
      />

      <LanguageSelector
        isVisible={isLanguageSelectorVisible}
        onClose={() => setIsLanguageSelectorVisible(false)}
      />

      <ContactsModal
        isVisible={isContactsModalVisible}
        onClose={() => setIsContactsModalVisible(false)}
      />

      <Modal
        visible={isTutorialVisible}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <OnboardingCarousel onComplete={() => setIsTutorialVisible(false)} />
      </Modal>

      <PaywallModal
        visible={isPaywallVisible}
        onClose={() => setIsPaywallVisible(false)}
        source="settings"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xxxl,
    marginTop: spacing.huge,
  },
  section: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.mono,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    opacity: designOpacity.secondary,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  settingText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.md,
    fontWeight: "500",
  },
  settingValue: {
    ...typography.caption,
    marginRight: spacing.sm,
    opacity: designOpacity.medium,
  },
  iconContainer: {
    width: iconSize.xl,
    height: iconSize.xl,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  premiumTitle: {
    fontSize: 18,
    fontStyle: "italic",
  },
  premiumSubtitle: {
    marginBottom: spacing.xl,
  },
  premiumStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
  },
  statLabel: {
    marginTop: spacing.xs,
  },
  manageButton: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  manageButtonText: {},
  upgradeCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  upgradeTitle: {
    fontSize: 18,
    fontStyle: "italic",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  upgradeSubtitle: {
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  upgradeStatsText: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  upgradeButtonText: {},
});
