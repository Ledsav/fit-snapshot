import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import {
  spacing,
  borderRadius,
  typography,
  iconSize,
} from "@/constants/DesignSystem";

type Achievement = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
};

type AchievementBadgesProps = {
  photos: Photo[];
  currentStreak: number;
};

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({ photos, currentStreak }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { t } = useLocalization();

  const now = new Date();
  const daysSinceFirstPhoto = photos.length > 0
    ? Math.floor((now.getTime() - new Date(photos[0].date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const achievements: Achievement[] = [
    {
      id: "first-photo",
      icon: "camera",
      title: t("achievements.firstPhoto") || "First Step",
      description: t("achievements.firstPhotoDesc") || "Take your first photo",
      unlocked: photos.length >= 1,
    },
    {
      id: "7-day-streak",
      icon: "flame",
      title: t("achievements.sevenDayStreak") || "Week Warrior",
      description: t("achievements.sevenDayStreakDesc") || "7-day streak",
      unlocked: currentStreak >= 7,
      progress: Math.min(currentStreak, 7),
      total: 7,
    },
    {
      id: "30-photos",
      icon: "images",
      title: t("achievements.thirtyPhotos") || "Photographer",
      description: t("achievements.thirtyPhotosDesc") || "Take 30 photos",
      unlocked: photos.length >= 30,
      progress: Math.min(photos.length, 30),
      total: 30,
    },
    {
      id: "30-days",
      icon: "calendar",
      title: t("achievements.monthJourney") || "Month Journey",
      description: t("achievements.monthJourneyDesc") || "30 days of tracking",
      unlocked: daysSinceFirstPhoto >= 30,
      progress: Math.min(daysSinceFirstPhoto, 30),
      total: 30,
    },
    {
      id: "100-photos",
      icon: "trophy",
      title: t("achievements.hundredPhotos") || "Centurion",
      description: t("achievements.hundredPhotosDesc") || "Take 100 photos",
      unlocked: photos.length >= 100,
      progress: Math.min(photos.length, 100),
      total: 100,
    },
    {
      id: "all-types",
      icon: "checkmark-done-circle",
      title: t("achievements.allTypes") || "Complete Set",
      description: t("achievements.allTypesDesc") || "Photo of each angle",
      unlocked: new Set(photos.map(p => p.type)).size >= 3,
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("home.achievements") || "Achievements"}
        </Text>
        <Text style={[styles.count, { color: theme.text }]}>
          {unlockedCount}/{achievements.length}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[
              styles.badge,
              {
                backgroundColor: achievement.unlocked ? theme.primary : theme.cardBackground,
                borderColor: achievement.unlocked ? theme.primary : withOpacity(theme.text, overlayOpacity.medium),
              },
            ]}
          >
            <Ionicons
              name={achievement.icon}
              size={iconSize.lg}
              color={achievement.unlocked ? theme.background : withOpacity(theme.text, overlayOpacity.medium)}
            />
            <Text
              style={[
                styles.badgeTitle,
                {
                  color: achievement.unlocked ? theme.background : theme.text,
                },
              ]}
            >
              {achievement.title}
            </Text>
            <Text
              style={[
                styles.badgeDescription,
                {
                  color: achievement.unlocked ? theme.background : theme.text,
                  opacity: achievement.unlocked ? 0.9 : 0.5,
                },
              ]}
            >
              {achievement.description}
            </Text>
            {!achievement.unlocked && achievement.progress !== undefined && achievement.total !== undefined && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: withOpacity(theme.text, overlayOpacity.light) }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.primary,
                        width: `${(achievement.progress / achievement.total) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.text }]}>
                  {achievement.progress}/{achievement.total}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: "bold",
  },
  count: {
    ...typography.caption,
    fontWeight: "600",
    opacity: 0.7,
  },
  scrollView: {
    marginHorizontal: -spacing.xl,
    flexGrow: 0,
    flexShrink: 0,
  },
  scrollViewContent: {
    paddingHorizontal: spacing.xl,
  },
  badge: {
    width: 140,
    height: 160,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    marginRight: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTitle: {
    ...typography.caption,
    fontWeight: "bold",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  badgeDescription: {
    ...typography.small,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginTop: spacing.sm,
  },
  progressBar: {
    height: spacing.xs,
    borderRadius: borderRadius.sm / 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: borderRadius.sm / 4,
  },
  progressText: {
    ...typography.tiny,
    textAlign: "center",
    marginTop: spacing.xs,
    fontWeight: "600",
  },
});
