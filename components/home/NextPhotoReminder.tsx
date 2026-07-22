import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import { useRouter } from "expo-router";
import { spacing, borderRadius, iconSize, fontFamily, preciseType } from "@/constants/DesignSystem";

type NextPhotoReminderProps = {
  latestPhoto: Photo | null;
};

export const NextPhotoReminder: React.FC<NextPhotoReminderProps> = ({ latestPhoto }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const router = useRouter();

  const message = (() => {
    if (!latestPhoto) {
      return {
        title: t("home.takeFirstPhoto") || "Take Your First Photo!",
        subtitle: t("home.startJourney") || "Start your transformation journey today",
        icon: "camera-outline" as const,
        color: theme.primary,
      };
    }

    const daysSinceLastPhoto = Math.floor(
      (new Date().getTime() - new Date(latestPhoto.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastPhoto === 0) {
      return {
        title: t("home.photoTakenToday") || "Photo Taken Today!",
        subtitle: t("home.keepItUp") || "Great job staying consistent",
        icon: "checkmark-circle-outline" as const,
        color: theme.success,
      };
    } else if (daysSinceLastPhoto === 1) {
      return {
        title: t("home.takeNextPhoto") || "Time for Your Next Photo",
        subtitle: t("home.lastPhotoYesterday") || "Last photo was yesterday",
        icon: "camera-outline" as const,
        color: theme.primary,
      };
    } else if (daysSinceLastPhoto <= 3) {
      return {
        title: t("home.takeNextPhoto") || "Time for Your Next Photo",
        subtitle: `${daysSinceLastPhoto} ${t("home.daysSinceLastPhoto") || "days since last photo"}`,
        icon: "camera-outline" as const,
        color: theme.warning,
      };
    } else {
      return {
        title: t("home.missedDays") || `${daysSinceLastPhoto} Days Since Last Photo`,
        subtitle: t("home.getBackOnTrack") || "Get back on track today!",
        icon: "time-outline" as const,
        color: theme.error,
      };
    }
  })();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: withOpacity(message.color, overlayOpacity.heavy),
        },
      ]}
      onPress={() => router.push("/(tabs)/camera")}
      activeOpacity={0.85}
    >
      <Ionicons name={message.icon} size={iconSize.lg} color={message.color} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, preciseType.message, { color: theme.text, fontFamily: fontFamily.display }]}>
          {message.title}
        </Text>
        <Text style={[styles.subtitle, preciseType.subtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
          {message.subtitle}
        </Text>
      </View>
      <Text style={[styles.action, preciseType.badgeLabel, { color: message.color, fontFamily: fontFamily.mono }]}>
        {(t("home.takePhoto") || "capture").toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontStyle: "italic",
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  action: {},
});
