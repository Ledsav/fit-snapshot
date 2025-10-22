import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";

type WeeklyProgressChartProps = {
  photos: Photo[];
};

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({ photos }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { t } = useLocalization();

  // Get photos from last 4 weeks
  const now = new Date();
  const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

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
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t("home.weeklyActivity") || "Weekly Activity"}
      </Text>
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
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
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
    gap: 4,
  },
  barWrapper: {
    width: "80%",
    height: 80,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.7,
  },
  barCount: {
    fontSize: 13,
    fontWeight: "bold",
  },
});
