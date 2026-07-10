import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Photo } from "@/services/photoStorage";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  spacing,
  borderRadius,
  typography,
  elevation,
  iconSize,
} from "@/constants/DesignSystem";

type ConsistencyHeatmapProps = {
  photos: Photo[];
};

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ photos }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { t } = useLocalization();

  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 69); 

  
  const dayOfWeek = startDate.getDay();
  if (dayOfWeek !== 0) {
    startDate.setDate(startDate.getDate() - dayOfWeek);
  }

  const days = Array.from({ length: 70 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return date;
  });

  
  const photosByDate = new Map<string, number>();
  photos.forEach(photo => {
    const photoDate = new Date(photo.date);
    photoDate.setHours(0, 0, 0, 0);
    const dateKey = photoDate.toISOString().split('T')[0];
    photosByDate.set(dateKey, (photosByDate.get(dateKey) || 0) + 1);
  });

  
  const maxPhotosPerDay = Math.max(...Array.from(photosByDate.values()), 1);

  const getIntensityColor = (count: number) => {
    if (count === 0) return withOpacity(theme.text, overlayOpacity.subtle);
    const intensity = count / maxPhotosPerDay;
    if (intensity >= 0.75) return theme.primary;
    if (intensity >= 0.5) return withOpacity(theme.primary, overlayOpacity.veryHeavy);
    if (intensity >= 0.25) return withOpacity(theme.primary, overlayOpacity.heavy);
    return withOpacity(theme.primary, overlayOpacity.medium);
  };

  
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  
  const monthLabels = weeks.map((week, index) => {
    const firstDay = week[0];
    if (index === 0) {
      return firstDay.toLocaleDateString('en-US', { month: 'short' });
    }
    const prevWeek = weeks[index - 1];
    const prevMonth = prevWeek[0].getMonth();
    const currentMonth = firstDay.getMonth();
    if (prevMonth !== currentMonth) {
      return firstDay.toLocaleDateString('en-US', { month: 'short' });
    }
    return '';
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground, borderColor: theme.primary },
        elevation.md,
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        {t("home.consistency") || "Consistency Tracker"}
      </Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        {t("home.last10Weeks") || "Last 10 weeks"}
      </Text>

      <View style={styles.calendarWrapper}>
        <View style={styles.heatmapContainer}>
          <View style={styles.monthLabels}>
            {monthLabels.map((month, i) => (
              <View key={i} style={styles.monthLabelContainer}>
                <Text style={[styles.monthLabel, { color: theme.text }]}>
                  {month}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((day, dayIndex) => {
                  const dateKey = day.toISOString().split('T')[0];
                  const count = photosByDate.get(dateKey) || 0;
                  return (
                    <View
                      key={dayIndex}
                      style={[
                        styles.day,
                        {
                          backgroundColor: getIntensityColor(count),
                        },
                      ]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: theme.text }]}>Less</Text>
        <View style={styles.legendSquares}>
          <View style={[styles.legendSquare, { backgroundColor: withOpacity(theme.text, overlayOpacity.subtle) }]} />
          <View style={[styles.legendSquare, { backgroundColor: withOpacity(theme.primary, overlayOpacity.medium) }]} />
          <View style={[styles.legendSquare, { backgroundColor: withOpacity(theme.primary, overlayOpacity.heavy) }]} />
          <View style={[styles.legendSquare, { backgroundColor: withOpacity(theme.primary, overlayOpacity.veryHeavy) }]} />
          <View style={[styles.legendSquare, { backgroundColor: theme.primary }]} />
        </View>
        <Text style={[styles.legendText, { color: theme.text }]}>More</Text>
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
  title: {
    ...typography.body,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.small,
    opacity: 0.6,
    marginBottom: spacing.md,
  },
  calendarWrapper: {
    marginBottom: spacing.lg,
  },
  heatmapContainer: {
    alignItems: "center",
  },
  monthLabels: {
    flexDirection: "row",
    marginBottom: spacing.xs,
    height: spacing.lg,
  },
  monthLabelContainer: {
    width: 28,
    alignItems: "center",
  },
  monthLabel: {
    ...typography.tiny,
    opacity: 0.6,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  week: {
    gap: spacing.xs,
  },
  day: {
    width: iconSize.md,
    height: iconSize.md,
    borderRadius: borderRadius.sm / 2,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  legendText: {
    ...typography.small,
    opacity: 0.6,
  },
  legendSquares: {
    flexDirection: "row",
    gap: spacing.xs / 2,
  },
  legendSquare: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: borderRadius.sm / 4,
  },
});
