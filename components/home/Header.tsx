import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import {
  spacing,
  borderRadius,
  typography,
} from "@/constants/DesignSystem";

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
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
    borderBottomLeftRadius: borderRadius.xxxl,
    borderBottomRightRadius: borderRadius.xxxl,
  },
  headerGradient: {
    padding: spacing.xl,
    paddingTop: 60,
    borderBottomLeftRadius: borderRadius.xxxl,
    borderBottomRightRadius: borderRadius.xxxl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    fontStyle: "italic",
  },
});
