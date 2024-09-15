import React from "react";
import { StyleSheet, Text, View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
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
        { backgroundColor: theme.cardBackground, borderColor: theme.primary },
      ]}
    >
      <View style={styles.contentContainer}>
        <Animated.View
          style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}
        >
          <Ionicons name="flame" size={60} color={theme.primary} />
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
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progress,
            {
              width: `${Math.min((streak / 30) * 100, 100)}%`, // TODO change 30 to objective
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
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  iconContainer: {
    position: "relative",
    marginRight: 20,
  },
  streakNumberContainer: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    padding: 5,
  },
  streakNumber: {
    fontSize: 10,
    fontWeight: "bold",
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subText: {
    fontSize: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    borderRadius: 3,
  },
});
