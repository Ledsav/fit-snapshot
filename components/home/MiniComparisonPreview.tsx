import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Photo } from "@/services/photoStorage";
import { getBestComparisonPair } from "@/utils/photoUtils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  spacing,
  borderRadius,
  typography,
  iconSize,
} from "@/constants/DesignSystem";

const { width } = Dimensions.get("window");
const MINI_SLIDER_WIDTH = width - (spacing.huge * 2);
const MINI_THUMB_SIZE = 28;
const MINI_THUMB_RADIUS = MINI_THUMB_SIZE / 2;

type MiniComparisonPreviewProps = {
  photos: Photo[];
};

export const MiniComparisonPreview: React.FC<MiniComparisonPreviewProps> = ({ photos }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const router = useRouter();
  const [sliderValue, setSliderValue] = useState(50);
  const pan = React.useRef(new Animated.ValueXY({ x: MINI_SLIDER_WIDTH / 2, y: 0 })).current;

  const comparisonPair = getBestComparisonPair(photos);

  if (!comparisonPair) {
    return null;
  }

  const { oldest: oldestPhoto, newest: newestPhoto } = comparisonPair;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      let newX = gesture.moveX - spacing.huge;
      newX = Math.max(0, Math.min(newX, MINI_SLIDER_WIDTH));
      pan.x.setValue(newX);
      setSliderValue((newX / MINI_SLIDER_WIDTH) * 100);
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
      onPress={() => router.push("/(tabs)/progress")}
      activeOpacity={0.95}
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconChip, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
            <Ionicons name="swap-horizontal" size={iconSize.sm} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {t("home.transformation") || "Your Transformation"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={iconSize.sm} color={theme.text} />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: oldestPhoto.uri }}
          style={[styles.image, { opacity: (100 - sliderValue) / 100 }]}
        />
        <Image
          source={{ uri: newestPhoto.uri }}
          style={[styles.image, styles.overlayImage, { opacity: sliderValue / 100 }]}
        />

        <View style={styles.labels}>
          <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy), opacity: (100 - sliderValue) / 100 }]}>
            <Text style={styles.labelText}>{t("common.before")}</Text>
          </View>
          <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy), opacity: sliderValue / 100 }]}>
            <Text style={styles.labelText}>{t("common.after")}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sliderWrapper}>
        <View style={styles.sliderContainer} {...panResponder.panHandlers}>
          <View style={[styles.sliderTrack, { backgroundColor: withOpacity(theme.text, overlayOpacity.light) }]} />
          <View
            style={[
              styles.sliderProgress,
              { backgroundColor: theme.primary, width: `${sliderValue}%` },
            ]}
          />
          <Animated.View
            style={[
              styles.sliderThumb,
              {
                backgroundColor: theme.background,
                borderColor: theme.primary,
                transform: [
                  { translateX: Animated.subtract(pan.x, MINI_THUMB_RADIUS) }
                ],
              },
            ]}
          >
            <View style={[styles.sliderThumbInner, { backgroundColor: theme.primary }]} />
          </Animated.View>
        </View>
      </View>

      <Text style={[styles.hint, { color: theme.text }]}>
        {t("home.tapForMore") || "Tap to see full comparison"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconChip: {
    width: iconSize.lg,
    height: iconSize.lg,
    borderRadius: borderRadius.round,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.body,
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayImage: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  labels: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
  },
  labelText: {
    color: "white",
    ...typography.small,
    fontWeight: "600",
  },
  sliderWrapper: {
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    width: MINI_SLIDER_WIDTH,
    height: spacing.lg * 2,
    justifyContent: "center",
    alignSelf: "center",
    position: "relative",
  },
  sliderTrack: {
    width: "100%",
    height: spacing.xs,
    borderRadius: borderRadius.sm / 4,
    position: "absolute",
  },
  sliderProgress: {
    height: spacing.xs,
    borderRadius: borderRadius.sm / 4,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: MINI_THUMB_SIZE,
    height: MINI_THUMB_SIZE,
    borderRadius: MINI_THUMB_RADIUS,
    position: "absolute",
    top: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  sliderThumbInner: {
    width: spacing.sm + 2,
    height: spacing.sm + 2,
    borderRadius: (spacing.sm + 2) / 2,
  },
  hint: {
    ...typography.small,
    textAlign: "center",
    opacity: 0.6,
    fontStyle: "italic",
  },
});
