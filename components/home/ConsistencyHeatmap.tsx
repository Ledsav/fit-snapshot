import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Photo } from "@/services/photoStorage";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

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
    if (count === 0) return theme.text + '15';
    const intensity = count / maxPhotosPerDay;
    if (intensity >= 0.75) return theme.primary;
    if (intensity >= 0.5) return theme.primary + 'CC';
    if (intensity >= 0.25) return theme.primary + '80';
    return theme.primary + '50';
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
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
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
          <View style={[styles.legendSquare, { backgroundColor: theme.text + '10' }]} />
          <View style={[styles.legendSquare, { backgroundColor: theme.primary + '66' }]} />
          <View style={[styles.legendSquare, { backgroundColor: theme.primary + '99' }]} />
          <View style={[styles.legendSquare, { backgroundColor: theme.primary + 'CC' }]} />
          <View style={[styles.legendSquare, { backgroundColor: theme.primary }]} />
        </View>
        <Text style={[styles.legendText, { color: theme.text }]}>More</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  calendarWrapper: {
    marginBottom: 16,
  },
  heatmapContainer: {
    alignItems: "center",
  },
  monthLabels: {
    flexDirection: "row",
    marginBottom: 4,
    height: 16,
  },
  monthLabelContainer: {
    width: 28,
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 9,
    opacity: 0.6,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    gap: 4,
  },
  week: {
    gap: 4,
  },
  day: {
    width: 24,
    height: 24,
    borderRadius: 3,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 4,
  },
  legendText: {
    fontSize: 11,
    opacity: 0.6,
  },
  legendSquares: {
    flexDirection: "row",
    gap: 3,
  },
  legendSquare: {
    width: 16,
    height: 16,
    borderRadius: 2,
  },
});
