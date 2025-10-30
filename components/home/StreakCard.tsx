import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import {
  spacing,
  borderRadius,
  elevation,
  typography,
  iconSize,
} from "@/constants/DesignSystem";

interface StreakCardProps {
  streak: number;
}

const getStreakMessage = (
  streak: number,
  t: (key: string) => string
): { main: string; sub: string } => {
  if (streak === 0)
    return {
      main: t("streakCard.startStreak"),
      sub: t("streakCard.beginToday"),
    };
  if (streak === 1)
    return { main: t("streakCard.greatStart"), sub: t("streakCard.keepItUp") };
  if (streak < 3)
    return { main: t("streakCard.onFire"), sub: t("streakCard.keepMomentum") };
  if (streak < 7)
    return {
      main: t("streakCard.fantasticProgress"),
      sub: t("streakCard.unstoppable"),
    };
  if (streak < 14)
    return {
      main: t("streakCard.incredibleStreak"),
      sub: t("streakCard.machine"),
    };
  if (streak < 30)
    return {
      main: t("streakCard.legendaryDedication"),
      sub: t("streakCard.rewritingHistory"),
    };
  return {
    main: t("streakCard.streakMaster"),
    sub: t("streakCard.achievedGreatness"),
  };
};

export const StreakCard: React.FC<StreakCardProps> = ({ streak }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const { main, sub } = getStreakMessage(streak, t);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={[
        styles.streakCard,
        { backgroundColor: theme.cardBackground },
        elevation.md,
      ]}
    >
      <View style={styles.contentContainer}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <Ionicons name="flame" size={iconSize.xxxl} color={theme.primary} />
          <View
            style={[
              styles.streakNumberContainer,
              { backgroundColor: theme.primary },
            ]}
          >
            <Text
              style={[styles.streakNumber, { color: theme.cardBackground }]}
            >
              {streak}
            </Text>
          </View>
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={[styles.mainText, { color: theme.text }]}>{main}</Text>
          <Text style={[styles.subText, { color: theme.text }]}>{sub}</Text>
        </View>
      </View>
      <View style={[styles.progressBar, { backgroundColor: withOpacity(theme.text, overlayOpacity.subtle) }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${Math.min((streak / 30) * 100, 100)}%`,
              backgroundColor: theme.primary,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  streakCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconContainer: {
    position: "relative",
    marginRight: spacing.xl,
  },
  streakNumberContainer: {
    position: "absolute",
    top: -spacing.xs,
    right: -spacing.xs,
    width: iconSize.lg,
    height: iconSize.lg,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xs,
  },
  streakNumber: {
    ...typography.tiny,
    fontWeight: "bold",
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  subText: {
    ...typography.body,
  },
  progressBar: {
    height: 6,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: borderRadius.sm,
  },
});
