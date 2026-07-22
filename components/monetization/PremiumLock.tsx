import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { spacing, borderRadius, iconSize, fontFamily, preciseType } from "@/constants/DesignSystem";

interface PremiumLockProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  compact?: boolean;
}

// The one quiet premium-lock pattern, reused everywhere a feature is gated.
// A hairline row that always opens the shared paywall on tap — never a
// blur overlay, never a silent no-op.
export const PremiumLock: React.FC<PremiumLockProps> = ({
  title,
  subtitle,
  icon = "lock-closed-outline",
  onPress,
  compact = false,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        compact && styles.rowCompact,
        { borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.glyph, { backgroundColor: withOpacity(theme.secondary, overlayOpacity.subtle) }]}>
        <Ionicons name={icon} size={iconSize.sm} color={theme.secondary} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text, fontFamily: fontFamily.body }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && !compact && (
          <Text
            style={[styles.subtitle, preciseType.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}
            numberOfLines={1}
          >
            {subtitle.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={[styles.chip, { borderColor: withOpacity(theme.primary, overlayOpacity.medium) }]}>
        <Text style={[styles.chipText, preciseType.statLabel, { color: theme.primary, fontFamily: fontFamily.mono }]}>
          {(t("featureGate.pro") || "Pro").toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  rowCompact: {
    padding: spacing.sm,
  },
  glyph: {
    width: iconSize.lg,
    height: iconSize.lg,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 14,
  },
  subtitle: {
    marginTop: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {},
});
