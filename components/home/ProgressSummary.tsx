import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";

type ProgressSummaryProps = {
  totalDays: number;
  totalPhotos: number;
  improvement: number;
};

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  totalDays,
  totalPhotos,
  improvement,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <View
      style={[
        styles.summaryContainer,
        { backgroundColor: theme.cardBackground, borderColor: theme.primary },
      ]}
    >
      <View style={styles.summaryItem}>
        <Ionicons name="calendar-outline" size={24} color={theme.text} />
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {totalDays} days
        </Text>
      </View>
      <View style={styles.summaryItem}>
        <Ionicons name="camera-outline" size={24} color={theme.text} />
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {totalPhotos} photos
        </Text>
      </View>
      <View style={styles.summaryItem}>
        <Ionicons name="trending-up-outline" size={24} color={theme.text} />
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {improvement.toFixed(0)}% active
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 10,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryText: {
    marginTop: 5,
    fontSize: 14,
  },
});
