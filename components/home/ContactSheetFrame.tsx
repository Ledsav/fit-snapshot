import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, borderRadius, fontFamily, preciseType } from "@/constants/DesignSystem";

interface ContactSheetFrameProps {
  caption: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const TICK_COUNT = 10;

// The app's signature photo treatment: a paper mat with sprocket-hole ticks
// and a mono caption, applied everywhere a progress photo is shown.
export const ContactSheetFrame: React.FC<ContactSheetFrameProps> = ({
  caption,
  children,
  style,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  return (
    <View style={[styles.mat, { backgroundColor: theme.cardBackground }, style]}>
      <View style={styles.ticks}>
        {Array.from({ length: TICK_COUNT }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.tick,
              { backgroundColor: withOpacity(theme.secondary, overlayOpacity.medium) },
            ]}
          />
        ))}
      </View>
      <View style={styles.content}>{children}</View>
      <Text style={[styles.caption, preciseType.caption, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
        {caption}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mat: {
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  ticks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  tick: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  content: {
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  caption: {
    marginTop: spacing.sm,
  },
});
