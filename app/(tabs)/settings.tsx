import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { DailyReminder } from "@/components/settings/DailyReminder";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalization } from "@/context/LocalizationContext";
import { LanguageSelector } from "@/components/settings/LanguageSelector";

const SettingItem: React.FC<{
  title: string;
  onPress: () => void;
  icon: string;
  theme: any;
  value?: string;
}> = ({ title, onPress, icon, theme, value }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <Ionicons
      name={icon as any}
      size={24}
      color={theme.text}
      style={styles.icon}
    />
    <Text style={[styles.settingText, { color: theme.text }]}>{title}</Text>
    {value && (
      <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
        {value}
      </Text>
    )}
    <Ionicons name="chevron-forward" size={24} color={theme.text} />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { t, locale } = useLocalization();
  const [isLanguageSelectorVisible, setIsLanguageSelectorVisible] =
    useState(false);

  const handleAccountPress = () => {
    // Navigate to account settings
  };

  const handleNotificationsPress = () => {
    // Navigate to notifications settings
  };

  const handlePrivacyPress = () => {
    // Navigate to privacy settings
  };

  const handleHelpPress = () => {
    // Navigate to help/support
  };

  const handleLanguagePress = () => {
    setIsLanguageSelectorVisible(true);
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
            {t("settings.user")}
          </Text>
          <SettingItem
            title={t("settings.account")}
            onPress={handleAccountPress}
            icon="person-outline"
            theme={theme}
          />
          <SettingItem
            title={t("settings.notifications")}
            onPress={handleNotificationsPress}
            icon="notifications-outline"
            theme={theme}
          />
          <SettingItem
            title={t("settings.privacy")}
            onPress={handlePrivacyPress}
            icon="lock-closed-outline"
            theme={theme}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("settings.reminders")}
          </Text>
          <DailyReminder />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("settings.support")}
          </Text>
          <SettingItem
            title={t("settings.helpAndFeedback")}
            onPress={handleHelpPress}
            icon="help-circle-outline"
            theme={theme}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {t("settings.language")}
          </Text>
          <SettingItem
            title={t("settings.language")}
            onPress={handleLanguagePress}
            icon="language-outline"
            theme={theme}
            value={locale === "en" ? "English" : "Español"}
          />
        </View>
      </ScrollView>

      <LanguageSelector
        isVisible={isLanguageSelectorVisible}
        onClose={() => setIsLanguageSelectorVisible(false)}
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  settingText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
  },
  settingValue: {
    fontSize: 14,
    marginRight: 10,
  },
  icon: {
    marginRight: 10,
  },
});
