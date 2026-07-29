import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Photo } from "@/services/photoStorage";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  spacing,
  borderRadius,
  typography,
  iconSize,
  elevation,
} from "@/constants/DesignSystem";

type WeeklyProgressChartProps = {
  photos: Photo[];
};

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ photos }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  const now = new Date();

  const weeks = Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const count = photos.filter(photo => {
      const photoDate = new Date(photo.date);
      return photoDate >= weekStart && photoDate < weekEnd;
    }).length;

    return {
      label: `W${4 - i}`,
      count,
      weekStart,
      weekEnd,
    };
  }).reverse();

  const maxCount = Math.max(...weeks.map(w => w.count), 1);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground, borderColor: theme.primary },
        elevation.md,
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconChip, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
          <Ionicons name="bar-chart-outline" size={iconSize.sm} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("home.weeklyActivity") || "Weekly Activity"}
        </Text>
      </View>
      <View style={styles.chartContainer}>
        {weeks.map((week, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: theme.primary,
                    height: `${(week.count / maxCount) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: theme.text }]}>{week.label}</Text>
            <Text style={[styles.barCount, { color: theme.text }]}>{week.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconChip: {
    width: iconSize.lg,
    height: iconSize.lg,
    borderRadius: borderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.body,
    fontWeight: "bold",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  barWrapper: {
    width: "80%",
    height: 80,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "100%",
    borderRadius: borderRadius.sm,
    minHeight: spacing.xs,
  },
  barLabel: {
    ...typography.small,
    fontWeight: "600",
    opacity: 0.7,
  },
  barCount: {
    ...typography.caption,
    fontWeight: "bold",
  },
});
