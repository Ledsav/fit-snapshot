import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import * as Linking from "expo-linking";

interface ContactsModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const ContactsModal: React.FC<ContactsModalProps> = ({
  isVisible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { t } = useLocalization();

  const handleEmailPress = () => {
    Linking.openURL("mailto:alberto.valdes.rey.official@gmail.com");
  };

  const handlePhonePress = () => {
    Linking.openURL("tel:+1234567890");
  };

  const handleWebsitePress = () => {
    Linking.openURL("https://ledsav.github.io/");
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.modalContainer, { backgroundColor: theme.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("contacts.title")}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.contactItem}
            onPress={handleEmailPress}
          >
            <Ionicons name="mail-outline" size={24} color={theme.text} />
            <Text style={[styles.contactText, { color: theme.text }]}>
              alberto.valdes.rey.official@gmail.com
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.contactItem}
            onPress={handlePhonePress}
          >
            <Ionicons name="call-outline" size={24} color={theme.text} />
            <Text style={[styles.contactText, { color: theme.text }]}>
              +1 (234) 567-890
            </Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={styles.contactItem}
            onPress={handleWebsitePress}
          >
            <Ionicons name="globe-outline" size={24} color={theme.text} />
            <Text style={[styles.contactText, { color: theme.text }]}>
              www.ledsav.github.io
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  contactText: {
    fontSize: 16,
    marginLeft: 10,
  },
});

export default ContactsModal;
