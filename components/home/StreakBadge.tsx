import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { spacing, borderRadius, iconSize, fontFamily, preciseType } from "@/constants/DesignSystem";

type StreakBadgeProps = {
  streak: number;
  best?: number;
};

// The one place the 10% "athletic" accent (ember) is allowed to show up.
// Deliberately compact — a milestone signal, not a primary metric.
export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, best }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: withOpacity(theme.milestone, overlayOpacity.subtle) },
      ]}
    >
      <Ionicons name="flame" size={iconSize.sm} color={theme.milestone} />
      <Text style={[styles.count, preciseType.badgeValue, { color: theme.milestone, fontFamily: fontFamily.mono }]}>
        {streak}
      </Text>
      <Text style={[styles.label, preciseType.badgeLabel, { color: theme.milestone, fontFamily: fontFamily.mono }]}>
        {t("home.streak").toUpperCase()}
      </Text>
      {!!best && best > streak && (
        <Text style={[styles.best, preciseType.statLabel, { color: theme.milestone, fontFamily: fontFamily.mono }]}>
          · {(t("home.streakBest") || "Best").toUpperCase()} {best}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    gap: spacing.xs,
  },
  count: {},
  label: {},
  best: {},
});
