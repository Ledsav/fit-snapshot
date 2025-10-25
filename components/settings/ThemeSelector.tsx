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
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";

interface ThemeOption {
  mode: 'light' | 'dark' | 'system';
  icon: string;
}

interface ThemeSelectorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  isVisible,
  onClose,
}) => {
  const { t } = useLocalization();
  const { themeMode, setThemeMode, effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  const themeOptions: ThemeOption[] = [
    { mode: 'light', icon: 'sunny' },
    { mode: 'dark', icon: 'moon' },
    { mode: 'system', icon: 'phone-portrait' },
  ];

  const getThemeName = (mode: string) => {
    switch (mode) {
      case 'light':
        return t('settings.light');
      case 'dark':
        return t('settings.dark');
      case 'system':
        return t('settings.system');
      default:
        return mode;
    }
  };

  const renderThemeItem = ({ item }: { item: ThemeOption }) => (
    <TouchableOpacity
      style={[
        styles.themeItem,
        { borderBottomColor: theme.primary + '20' },
        themeMode === item.mode && {
          backgroundColor: theme.primary + '10',
        },
      ]}
      onPress={() => {
        setThemeMode(item.mode);
        onClose();
      }}
    >
      <View style={styles.themeInfo}>
        <Ionicons
          name={item.icon as any}
          size={24}
          color={themeMode === item.mode ? theme.primary : theme.text}
          style={styles.themeIcon}
        />
        <Text
          style={[
            styles.themeName,
            {
              color: themeMode === item.mode ? theme.primary : theme.text,
              fontWeight: themeMode === item.mode ? '600' : '400',
            },
          ]}
        >
          {getThemeName(item.mode)}
        </Text>
      </View>
      {themeMode === item.mode && (
        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
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
              {t("settings.theme")}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={themeOptions}
            renderItem={renderThemeItem}
            keyExtractor={(item) => item.mode}
            style={styles.themeList}
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
  themeList: {
    flexGrow: 0,
  },
  themeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    marginBottom: 4,
  },
  themeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeIcon: {
    marginRight: 12,
  },
  themeName: {
    fontSize: 16,
  },
});
