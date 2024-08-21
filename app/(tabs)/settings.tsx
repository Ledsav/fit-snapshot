import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { DailyReminder } from "@/components/settings/DailyReminder";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        <DailyReminder />
        {/* Add more settings options here */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
