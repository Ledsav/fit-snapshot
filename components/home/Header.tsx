import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

const motivationalQuotes = [
  "Transform your body, transform your life!",
  "Every photo is a step towards your goal.",
  "Capture your progress, fuel your motivation.",
];

export const Header = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  return (
    <LinearGradient
      colors={[theme.primary, theme.background]}
      style={styles.headerGradient}
    >
      <Text style={[styles.title, { color: theme.background }]}>
        Fitness Tracker
      </Text>
      <Text style={[styles.subtitle, { color: theme.background }]}>
        {
          motivationalQuotes[
            Math.floor(Math.random() * motivationalQuotes.length)
          ]
        }
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: "italic",
  },
});
