import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

interface StreakCardProps {
  streak: number;
}

const getStreakMessage = (
  streak: number
): { message: string; emoji: string } => {
  if (streak === 0) return { message: "Start your streak today!", emoji: "🏁" };
  if (streak === 1) return { message: "Great start!", emoji: "🌟" };
  if (streak < 3) return { message: "You're on a roll!", emoji: "🔥" };
  if (streak < 7) return { message: "Fantastic progress!", emoji: "💪" };
  if (streak < 14) return { message: "You're unstoppable!", emoji: "🚀" };
  if (streak < 30) return { message: "Incredible dedication!", emoji: "🏆" };
  return { message: "You're a legend!", emoji: "👑" };
};

export const StreakCard: React.FC<StreakCardProps> = ({ streak }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { message, emoji } = getStreakMessage(streak);

  return (
    <View
      style={[styles.streakCard, { backgroundColor: theme.cardBackground }]}
    >
      <Text style={[styles.emoji]}>{emoji}</Text>
      <Text style={[styles.streakText, { color: theme.text }]}>
        {streak} Day{streak !== 1 ? "s" : ""} Streak!
      </Text>
      <Text style={[styles.streakMessage, { color: theme.text }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  streakCard: {
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  streakText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  streakMessage: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  streakSubtext: {
    fontSize: 14,
  },
});
