import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import {
  spacing,
  borderRadius,
  typography,
  iconSize,
  elevation,
} from "@/constants/DesignSystem";

type ProgressSummaryProps = {
  totalDays: number;
  totalPhotos: number;
  consistency: number;
};

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  totalDays,
  totalPhotos,
  consistency,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  return (
    <View
      style={[
        styles.summaryContainer,
        { backgroundColor: theme.cardBackground, borderColor: theme.primary },
        elevation.md,
      ]}
    >
      <View style={styles.summaryItem}>
        <View style={[styles.iconChip, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
          <Ionicons name="calendar-outline" size={iconSize.md} color={theme.primary} />
        </View>
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {totalDays} {t("progressSummary.days")}
        </Text>
      </View>
      <View style={styles.summaryItem}>
        <View style={[styles.iconChip, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
          <Ionicons name="camera-outline" size={iconSize.md} color={theme.primary} />
        </View>
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {totalPhotos} {t("progressSummary.photos")}
        </Text>
      </View>
      <View style={styles.summaryItem}>
        <View style={[styles.iconChip, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
          <Ionicons name="trending-up-outline" size={iconSize.md} color={theme.primary} />
        </View>
        <Text style={[styles.summaryText, { color: theme.text }]}>
          {consistency.toFixed(0)}% {t("progressSummary.consistency")}
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
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderRadius: borderRadius.md,
  },
  summaryItem: {
    alignItems: "center",
  },
  iconChip: {
    width: iconSize.md + spacing.lg,
    height: iconSize.md + spacing.lg,
    borderRadius: borderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryText: {
    marginTop: spacing.xs,
    ...typography.caption,
  },
});
