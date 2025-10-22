import ContactsModal from "@/components/settings/ContactsModal";
import { DailyReminder } from "@/components/settings/DailyReminder";
import { LanguageSelector } from "@/components/settings/LanguageSelector";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { StorageManager } from "@/components/settings/StorageManager";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
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
  const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] =
    useState(false);
  const [isThemeSelectorVisible, setIsThemeSelectorVisible] = useState(false);
  const [isContactsModalVisible, setIsContactsModalVisible] = useState(false);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);

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
});
