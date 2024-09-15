import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  ViewStyle,
  TextStyle,
} from "react-native";
import { NotificationService } from "@/services/notificationService";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { useLocalization } from "@/context/LocalizationContext";

interface TimeSelectorProps {
  value: number | string;
  onIncrease: () => void;
  onDecrease: () => void;
  label: string;
  theme: {
    text: string;
  };
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  value,
  onIncrease,
  onDecrease,
  label,
  theme,
}) => (
  <View style={styles.timeSelectorContainer}>
    <Text style={[styles.timeSelectorLabel, { color: theme.text }]}>
      {label}
    </Text>
    <View style={styles.timeSelector}>
      <TouchableOpacity onPress={onDecrease} style={styles.timeSelectorButton}>
        <Ionicons name="chevron-down" size={24} color={theme.text} />
      </TouchableOpacity>
      <Text style={[styles.timeSelectorValue, { color: theme.text }]}>
        {value}
      </Text>
      <TouchableOpacity onPress={onIncrease} style={styles.timeSelectorButton}>
        <Ionicons name="chevron-up" size={24} color={theme.text} />
      </TouchableOpacity>
    </View>
  </View>
);

export const DailyReminder: React.FC = () => {
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [amPm, setAmPm] = useState<"AM" | "PM">("AM");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [reminders, setReminders] = useState<
    Notifications.NotificationRequest[]
  >([]);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { t } = useLocalization();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const scheduledReminders =
        await NotificationService.getScheduledReminders();
      setReminders(scheduledReminders);
    } catch (error) {
      console.error("Failed to load reminders:", error);
    }
  };

  const handleSetReminder = async () => {
    try {
      let selectedHour = hour;
      if (amPm === "PM" && hour !== 12) selectedHour += 12;
      if (amPm === "AM" && hour === 12) selectedHour = 0;

      await NotificationService.scheduleReminder(selectedHour, minute);
      Alert.alert(
        t("dailyReminder.reminderSet"),
        `${t("dailyReminder.reminderSetMessage")} ${formatTime(
          selectedHour,
          minute
        )}`
      );
      setShowModal(false);
      loadReminders();
    } catch (error) {
      console.error("Failed to set reminder:", error);
      Alert.alert("Error", "Failed to set reminder. Please try again.");
    }
  };
  const handleDeleteReminder = async (id: string) => {
    try {
      await NotificationService.cancelReminder(id);
      loadReminders();
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      Alert.alert("Error", "Failed to delete reminder. Please try again.");
    }
  };

  const formatTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const getReminderTime = (
    trigger: Notifications.NotificationTrigger
  ): string => {
    if ("hour" in trigger && "minute" in trigger) {
      return formatTime(trigger.hour, trigger.minute);
    }
    return "Unknown time";
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={24} color={theme.background} />
        <Text style={[styles.addButtonText, { color: theme.background }]}>
          {t("dailyReminder.addReminder")}
        </Text>
      </TouchableOpacity>

      <ScrollView style={styles.reminderList}>
        {reminders.map((item) => (
          <View key={item.identifier} style={styles.reminderItem}>
            <View style={styles.reminderInfo}>
              <Ionicons
                name="alarm-outline"
                size={24}
                color={theme.text}
                style={styles.icon}
              />
              <Text style={[styles.reminderText, { color: theme.text }]}>
                {getReminderTime(item.trigger)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteReminder(item.identifier)}
            >
              <Ionicons name="trash-outline" size={24} color={theme.error} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.background }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t("dailyReminder.setDailyReminder")}
            </Text>
            <View style={styles.timePickerContainer}>
              <TimeSelector
                value={hour}
                onIncrease={() => setHour((prev) => (prev % 12) + 1)}
                onDecrease={() => setHour((prev) => ((prev - 2 + 12) % 12) + 1)}
                label={t("dailyReminder.hour")}
                theme={theme}
              />
              <TimeSelector
                value={minute.toString().padStart(2, "0")}
                onIncrease={() => setMinute((prev) => (prev + 1) % 60)}
                onDecrease={() => setMinute((prev) => (prev - 1 + 60) % 60)}
                label={t("dailyReminder.minute")}
                theme={theme}
              />
              <TimeSelector
                value={amPm}
                onIncrease={() =>
                  setAmPm((prev) => (prev === "AM" ? "PM" : "AM"))
                }
                onDecrease={() =>
                  setAmPm((prev) => (prev === "AM" ? "PM" : "AM"))
                }
                label="AM/PM"
                theme={theme}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.error }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>
                  {t("dailyReminder.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.success }]}
                onPress={handleSetReminder}
              >
                <Text style={styles.modalButtonText}>
                  {t("dailyReminder.setReminder")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

interface Style {
  container: ViewStyle;
  title: TextStyle;
  addButton: ViewStyle;
  addButtonText: TextStyle;
  reminderList: ViewStyle;
  reminderItem: ViewStyle;
  reminderInfo: ViewStyle;
  reminderText: TextStyle;
  deleteButton: ViewStyle;
  icon: ViewStyle;
  modalContainer: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  timePickerContainer: ViewStyle;
  timeSelectorContainer: ViewStyle;
  timeSelectorLabel: TextStyle;
  timeSelector: ViewStyle;
  timeSelectorButton: ViewStyle;
  timeSelectorValue: TextStyle;
  modalButtons: ViewStyle;
  modalButton: ViewStyle;
  modalButtonText: TextStyle;
}

const styles = StyleSheet.create<Style>({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  reminderList: {
    flex: 1,
  },
  reminderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  reminderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  reminderText: {
    fontSize: 18,
    marginLeft: 10,
  },
  deleteButton: {
    padding: 5,
  },
  icon: {
    marginRight: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  timeSelectorContainer: {
    alignItems: "center",
  },
  timeSelectorLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  timeSelector: {
    alignItems: "center",
  },
  timeSelectorButton: {
    padding: 5,
  },
  timeSelectorValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
    width: "45%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textAlignVertical: "center",
  },
});
