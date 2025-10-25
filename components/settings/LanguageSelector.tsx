import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalization } from "@/context/LocalizationContext";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

interface Language {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  // Add more languages here
];

interface LanguageSelectorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  isVisible,
  onClose,
}) => {
  const { locale, setLocale, t } = useLocalization();
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        { borderBottomColor: theme.primary },
        locale === item.code && { backgroundColor: theme.primary + '1A' },
      ]}
      onPress={() => {
        setLocale(item.code);
        onClose();
      }}
    >
      <Text style={[styles.languageName, { color: theme.text }]}>
        {item.name}
      </Text>
      {locale === item.code && (
        <Ionicons name="checkmark" size={24} color={theme.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t("settings.selectLanguage")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={languages}
            renderItem={renderLanguageItem}
            keyExtractor={(item) => item.code}
            style={styles.languageList}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  languageList: {
    flexGrow: 0,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageName: {
    fontSize: 16,
  },
});
