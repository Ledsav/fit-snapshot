import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, borderRadius, fontFamily, typography } from "@/constants/DesignSystem";
import { useTheme } from "@/context/ThemeContext";
import { useLocalization } from "@/context/LocalizationContext";
import type { LightingState } from "@/services/lightingService";

interface Props {
  state: LightingState;
  onRecalibrate: () => void;
}

const LABEL_KEY: Record<LightingState, string> = {
  matched: "camera.lightingMatched",
  close: "camera.lightingClose",
  off: "camera.lightingOff",
  none: "camera.lightingNone",
};

export const LightingIndicator: React.FC<Props> = ({ state, onRecalibrate }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  const dotColor =
    state === "matched" ? theme.success
    : state === "close" ? theme.warning
    : state === "off" ? theme.error
    : theme.secondary;

  return (
    <View style={[styles.container, { backgroundColor: withOpacity("#000000", overlayOpacity.heavy) }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: "#fff", fontFamily: fontFamily.mono }]} numberOfLines={1}>
        {t(LABEL_KEY[state])}
      </Text>
      {state !== "none" && (
        <TouchableOpacity onPress={onRecalibrate} hitSlop={8}>
          <Text style={[styles.action, { color: theme.primary, fontFamily: fontFamily.mono }]}>
            {t("camera.recalibrateLighting")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...typography.small, letterSpacing: 0.3 },
  action: { ...typography.small, fontWeight: "700", textDecorationLine: "underline" },
});
