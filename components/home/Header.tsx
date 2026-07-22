import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, fontFamily, preciseType } from "@/constants/DesignSystem";

const logo = require("@/assets/images/logo-fs.png");

interface HeaderProps {
  title: string;
}

// Slim instrument-panel top bar. Replaces the gradient hero + italic
// motivational quote, which was the single strongest "generic wellness app"
// tell in the original design.
export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderBottomColor: withOpacity(theme.secondary, overlayOpacity.light),
        },
      ]}
    >
      <View style={styles.row}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.wordmark, preciseType.wordmark, { color: theme.text, fontFamily: fontFamily.mono }]}>
          {title.toUpperCase()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 28,
    height: 28,
  },
  wordmark: {},
});
