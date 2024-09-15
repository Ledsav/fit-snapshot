import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";

const motivationalQuotes = [
  "Transform your body, transform your life!",
  "Every photo is a step towards your goal.",
  "Capture your progress, fuel your motivation.",
];

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.background, theme.transparent]}
        style={styles.headerGradient}
      >
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          {
            motivationalQuotes[
              Math.floor(Math.random() * motivationalQuotes.length)
            ]
          }
        </Text>
      </LinearGradient>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
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
