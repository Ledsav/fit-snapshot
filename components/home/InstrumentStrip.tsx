import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { spacing, fontFamily } from "@/constants/DesignSystem";

type InstrumentStripProps = {
  totalDays: number;
  consistency: number;
  weeklyPhotoCount: number;
};

// The precision readout: replaces ProgressSummary's stat cards with a single
// mono data strip, like a measurement instrument's display.
export const InstrumentStrip: React.FC<InstrumentStripProps> = ({
  totalDays,
  consistency,
  weeklyPhotoCount,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  const columns = [
    { key: "days", value: `${totalDays}`, label: t("progressSummary.days").toUpperCase(), color: theme.text },
    { key: "consistency", value: `${consistency.toFixed(0)}%`, label: t("progressSummary.consistency").toUpperCase(), color: theme.primary },
    { key: "thisWeek", value: `${weeklyPhotoCount}`, label: t("progressSummary.thisWeek").toUpperCase(), color: theme.text },
  ];

  return (
    <View style={styles.container}>
      {columns.map((column, index) => (
        <View
          key={column.key}
          style={[
            styles.column,
            index < columns.length - 1 && {
              borderRightWidth: 1,
              borderRightColor: withOpacity(theme.secondary, overlayOpacity.light),
            },
          ]}
        >
          <Text style={[styles.value, { color: column.color, fontFamily: fontFamily.mono }]}>
            {column.value}
          </Text>
          <Text style={[styles.label, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
            {column.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  column: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  value: {
    fontSize: 20,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
});
