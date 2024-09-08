import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NotificationService } from "@/services/notificationService";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export const DailyReminder: React.FC = () => {
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  const handleSetReminder = async () => {
    try {
      await NotificationService.scheduleReminder(
        reminderTime.getHours(),
        reminderTime.getMinutes()
      );
      Alert.alert(
        "Reminder Set",
        `You'll be reminded daily at ${reminderTime.toLocaleTimeString()}`
      );
    } catch (error) {
      console.error("Failed to set reminder:", error);
      Alert.alert("Error", "Failed to set reminder. Please try again.");
    }
  };

  const onChangeTime = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || reminderTime;
    setShowTimePicker(false);
    setReminderTime(currentTime);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        Set Daily Reminder
      </Text>
      <TouchableOpacity
        style={[styles.reminderButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowTimePicker(true)}
      >
        <Text style={[styles.reminderButtonText, { color: theme.background }]}>
          Set Reminder Time: {reminderTime.toLocaleTimeString()}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={reminderTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeTime}
        />
      )}
      <TouchableOpacity
        style={[styles.setReminderButton, { backgroundColor: theme.success }]}
        onPress={handleSetReminder}
      >
        <Text
          style={[styles.setReminderButtonText, { color: theme.background }]}
        >
          Set Daily Reminder
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  reminderButton: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  reminderButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  setReminderButton: {
    padding: 15,
    borderRadius: 15,
  },
  setReminderButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
});
