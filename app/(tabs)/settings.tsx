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
import ContactsModal from "@/components/settings/ContactsModal";

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
      <Text style={[styles.settingValue, { color: theme.text }]}>{value}</Text>
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
  const [isContactsModalVisible, setIsContactsModalVisible] = useState(false);

  const handleLanguagePress = () => {
    setIsLanguageSelectorVisible(true);
  };

  const handleContactsPress = () => {
    setIsContactsModalVisible(true);
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
            {t("settings.support")}
          </Text>
          <SettingItem
            title={t("settings.helpAndFeedback")}
            onPress={handleContactsPress}
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
            value={getLanguageDisplayName(locale)}
          />
        </View>
      </ScrollView>

      <LanguageSelector
        isVisible={isLanguageSelectorVisible}
        onClose={() => setIsLanguageSelectorVisible(false)}
      />

      <ContactsModal
        isVisible={isContactsModalVisible}
        onClose={() => setIsContactsModalVisible(false)}
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
