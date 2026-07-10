import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors from "@/constants/Colors";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import { useRouter } from "expo-router";
import {
  spacing,
  borderRadius,
  typography,
  iconSize,
} from "@/constants/DesignSystem";

type NextPhotoReminderProps = {
  latestPhoto: Photo | null;
};

export const NextPhotoReminder: React.FC<NextPhotoReminderProps> = ({ latestPhoto }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const router = useRouter();

  if (!latestPhoto) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: theme.primary }]}
        onPress={() => router.push("/(tabs)/camera")}
        activeOpacity={0.9}
      >
        <Ionicons name="camera-outline" size={iconSize.lg} color={theme.background} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.background }]}>
            {t("home.takeFirstPhoto") || "Take Your First Photo!"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.background }]}>
            {t("home.startJourney") || "Start your transformation journey today"}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={iconSize.md} color={theme.background} />
      </TouchableOpacity>
    );
  }

  const daysSinceLastPhoto = Math.floor(
    (new Date().getTime() - new Date(latestPhoto.date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const getMessage = () => {
    if (daysSinceLastPhoto === 0) {
      return {
        title: t("home.photoTakenToday") || "Photo Taken Today!",
        subtitle: t("home.keepItUp") || "Great job staying consistent",
        icon: "checkmark-circle" as const,
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
  };

  const message = getMessage();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: message.color }]}
      onPress={() => router.push("/(tabs)/camera")}
      activeOpacity={0.9}
    >
      <Ionicons name={message.icon} size={iconSize.lg} color="white" />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: "white" }]}>{message.title}</Text>
        <Text style={[styles.subtitle, { color: "white" }]}>{message.subtitle}</Text>
      </View>
      <Ionicons name="camera" size={iconSize.md} color="white" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontWeight: "bold",
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
});
