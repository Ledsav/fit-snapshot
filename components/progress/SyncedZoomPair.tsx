import Colors, { overlayOpacity, withOpacity } from "@/constants/Colors";
import { borderRadius, fontFamily, preciseType } from "@/constants/DesignSystem";
import { Button } from "@/components/ui";
import { useTheme } from "@/context/ThemeContext";
import { useLocalization } from "@/context/LocalizationContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface PhotoInfo {
  uri: string;
  label: string;
}

interface SyncedZoomPairProps {
  photoA: PhotoInfo;
  photoB: PhotoInfo;
}

const { width: screenWidth } = Dimensions.get("window");
const CONTAINER_PADDING = 40; // matches PhotoMorph's container padding (20 each side)
const PAIR_GAP = 10;
const PAIR_WIDTH = screenWidth - CONTAINER_PADDING;
const PHOTO_WIDTH = (PAIR_WIDTH - PAIR_GAP) / 2;
const PHOTO_HEIGHT = PHOTO_WIDTH * (4 / 3);
const MAX_SCALE = 4;
const MIN_SCALE = 1;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export const SyncedZoomPair: React.FC<SyncedZoomPairProps> = ({ photoA, photoB }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const [swapped, setSwapped] = useState(false);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clamp(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .minDistance(10)
    .onUpdate((event) => {
      if (scale.value <= 1) {
        return;
      }
      const maxTranslateX = ((scale.value - 1) * PHOTO_WIDTH) / 2;
      const maxTranslateY = ((scale.value - 1) * PHOTO_HEIGHT) / 2;
      translateX.value = clamp(
        savedTranslateX.value + event.translationX,
        -maxTranslateX,
        maxTranslateX
      );
      translateY.value = clamp(
        savedTranslateY.value + event.translationY,
        -maxTranslateY,
        maxTranslateY
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const resetZoom = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const left = swapped ? photoB : photoA;
  const right = swapped ? photoA : photoB;

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <Button
          title={t("progress.syncedZoomSwap")}
          onPress={() => setSwapped((prev) => !prev)}
          variant="ghost"
          size="small"
          icon={<Ionicons name="swap-horizontal-outline" size={16} color={theme.text} />}
        />
        <Button
          title={t("progress.syncedZoomReset")}
          onPress={resetZoom}
          variant="ghost"
          size="small"
          icon={<Ionicons name="scan-outline" size={16} color={theme.text} />}
        />
      </View>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.pairRow}>
          <View
            style={[
              styles.photoWrapper,
              { borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
            ]}
          >
            <Animated.Image source={{ uri: left.uri }} style={[styles.photo, animatedStyle]} />
          </View>
          <View
            style={[
              styles.photoWrapper,
              { borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
            ]}
          >
            <Animated.Image source={{ uri: right.uri }} style={[styles.photo, animatedStyle]} />
          </View>
        </View>
      </GestureDetector>
      <View style={styles.captionsRow}>
        <Text
          style={[styles.captionText, preciseType.caption, { color: theme.secondary, fontFamily: fontFamily.mono }]}
          numberOfLines={1}
        >
          {left.label}
        </Text>
        <Text
          style={[styles.captionText, preciseType.caption, { color: theme.secondary, fontFamily: fontFamily.mono }]}
          numberOfLines={1}
        >
          {right.label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  pairRow: {
    flexDirection: "row",
    gap: PAIR_GAP,
  },
  photoWrapper: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  captionsRow: {
    flexDirection: "row",
    gap: PAIR_GAP,
    marginTop: 8,
  },
  captionText: {
    flex: 1,
    textAlign: "center",
  },
});

export default SyncedZoomPair;
