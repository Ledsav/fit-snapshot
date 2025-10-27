import ContactsModal from "@/components/settings/ContactsModal";
import { DailyReminder } from "@/components/settings/DailyReminder";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { StorageManager } from "@/components/settings/StorageManager";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";
import Colors from "@/constants/Colors";
import { FREE_TIER_LIMITS } from "@/constants/Features";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PaywallModal from "@/components/monetization/PaywallModal";
import { PremiumBadge } from "@/components/monetization/PremiumBadge";

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
        borderColor: theme.primary + '40'
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
      <Ionicons
        name={icon as any}
        size={24}
        color={theme.primary}
      />
    </View>
    <Text style={[styles.settingText, { color: theme.text }]}>{title}</Text>
    {value && (
      <Text style={[styles.settingValue, { color: theme.text }]}>{value}</Text>
    )}
    <Ionicons name="chevron-forward" size={20} color={theme.text} />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const { effectiveColorScheme, themeMode } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t, locale } = useLocalization();
  const { isPremium, subscriptionStatus, featureUsage, setTestPremiumStatus } = useUser();
  const { user, userInfo, signIn, signOut: handleSignOut } = useAuth();
  const router = useRouter();
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
    Alert.alert(
      "Manage Subscription",
      "You can manage your subscription in the App Store or Google Play.",
      [{ text: "OK" }]
    );
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Account
          </Text>
          {user ? (
            <View>
              <View
                style={[
                  styles.settingItem,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.primary + '40',
                  },
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
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
            <LinearGradient
              colors={[theme.primary + '20', theme.primary + '05']}
              style={styles.premiumCard}
            >
              <View style={styles.premiumHeader}>
                <PremiumBadge size="large" />
                <Text style={[styles.premiumTitle, { color: theme.text }]}>
                  {t("settings.premiumActive")}
                </Text>
              </View>
              <Text style={[styles.premiumSubtitle, { color: theme.text }]}>
                {t("settings.thankYouMessage")}
              </Text>
              <View style={styles.premiumStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {featureUsage.photoCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>{t("settings.photos")}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>∞</Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>{t("settings.limit")}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.manageButton, { borderColor: theme.primary }]}
                onPress={handleManageSubscription}
              >
                <Text style={[styles.manageButtonText, { color: theme.primary }]}>
                  {t("settings.manageSubscription")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={styles.upgradeCard}
              onPress={handleUpgradePress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[theme.primary, theme.primary + 'CC']}
                style={styles.upgradeGradient}
              >
                <Ionicons name="star" size={40} color="#FFF" />
                <Text style={styles.upgradeTitle}>{t("settings.upgradeToPremium")}</Text>
                <Text style={styles.upgradeSubtitle}>
                  {t("settings.unlimitedPhotosAnalytics")}
                </Text>
                <View style={styles.upgradeStats}>
                  <Text style={styles.upgradeStatsText}>
                    {featureUsage.photoCount} / {FREE_TIER_LIMITS.MAX_PHOTOS} {t("settings.photosUsed")}
                  </Text>
                </View>
                <View style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>{t("settings.seePlans")}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Test Mode Toggle (for development) */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.settingItem,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.primary + '40',
              },
            ]}
            onPress={handleTestPremiumToggle}
          >
            <View style={[styles.iconContainer, { backgroundColor: theme.warning + '20' }]}>
              <Ionicons name="flask-outline" size={24} color={theme.warning} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>
              {t("settings.testPremium")} ({isPremium ? t("settings.on") : t("settings.off")})
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("settings.reminders")}
          </Text>
          <DailyReminder />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("settings.storage")}
          </Text>
          <StorageManager />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
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
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    marginTop: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.6,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.7,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  premiumCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 12,
  },
  premiumTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  premiumSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  premiumStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  manageButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  upgradeCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8,
  },
  upgradeGradient: {
    padding: 24,
    alignItems: "center",
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 12,
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 14,
    color: "#FFF",
    opacity: 0.9,
    marginBottom: 16,
    textAlign: "center",
  },
  upgradeStats: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  upgradeStatsText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  upgradeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
