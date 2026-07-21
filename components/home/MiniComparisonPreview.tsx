import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Photo } from "@/services/photoStorage";
import { getBestComparisonPair } from "@/utils/photoUtils";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ContactSheetFrame } from "./ContactSheetFrame";
import { spacing, fontFamily, preciseType } from "@/constants/DesignSystem";

const { width } = Dimensions.get("window");
const MINI_SLIDER_WIDTH = width - (spacing.huge * 2);
const MINI_THUMB_SIZE = 28;
const MINI_THUMB_RADIUS = MINI_THUMB_SIZE / 2;

type MiniComparisonPreviewProps = {
  photos: Photo[];
};

// The screen's thesis: the before/after photos themselves, framed like
// negatives on a light table. Stats are secondary and live in InstrumentStrip.
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

  const { type, oldest: oldestPhoto, newest: newestPhoto } = comparisonPair;

  const caption = `${new Date(oldestPhoto.date).toLocaleDateString()} → ${new Date(newestPhoto.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`;

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
    <TouchableOpacity onPress={() => router.push("/(tabs)/progress")} activeOpacity={0.95}>
      <ContactSheetFrame caption={caption}>
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
              <Text style={[styles.labelText, preciseType.caption, { fontFamily: fontFamily.mono }]}>
                {t("common.before").toUpperCase()}
              </Text>
            </View>
            <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy), opacity: sliderValue / 100 }]}>
              <Text style={[styles.labelText, preciseType.caption, { fontFamily: fontFamily.mono }]}>
                {t("common.after").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sliderWrapper}>
          <View style={styles.sliderContainer} {...panResponder.panHandlers}>
            <View style={[styles.sliderTrack, { backgroundColor: withOpacity(theme.secondary, overlayOpacity.light) }]} />
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
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.primary,
                  transform: [{ translateX: Animated.subtract(pan.x, MINI_THUMB_RADIUS) }],
                },
              ]}
            >
              <View style={[styles.sliderThumbInner, { backgroundColor: theme.primary }]} />
            </Animated.View>
          </View>
        </View>
      </ContactSheetFrame>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 6,
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
    borderRadius: 4,
  },
  labelText: {
    color: "white",
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
    borderRadius: 2,
    position: "absolute",
  },
  sliderProgress: {
    height: spacing.xs,
    borderRadius: 2,
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
});
