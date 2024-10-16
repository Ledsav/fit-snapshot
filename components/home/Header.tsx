import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { t } = useLocalization();

  const motivationalQuotes = t("header.motivationalQuotes");

  const randomQuote = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    return motivationalQuotes[randomIndex];
  }, [motivationalQuotes]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.background, theme.transparent]}
        style={styles.headerGradient}
      >
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.text }]}>
          {randomQuote}
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
