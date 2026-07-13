import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { useLocalization } from "@/context/LocalizationContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
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
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
          onPress={() => setSwapped((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-horizontal" size={16} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>
            {t("progress.syncedZoomSwap")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.cardBackground }]}
          onPress={resetZoom}
          activeOpacity={0.8}
        >
          <Ionicons name="scan-outline" size={16} color={theme.text} />
          <Text style={[styles.actionButtonText, { color: theme.text }]}>
            {t("progress.syncedZoomReset")}
          </Text>
        </TouchableOpacity>
      </View>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.pairRow}>
          <View style={[styles.photoWrapper, { borderColor: theme.primary }]}>
            <Animated.Image source={{ uri: left.uri }} style={[styles.photo, animatedStyle]} />
          </View>
          <View style={[styles.photoWrapper, { borderColor: theme.primary }]}>
            <Animated.Image source={{ uri: right.uri }} style={[styles.photo, animatedStyle]} />
          </View>
        </View>
      </GestureDetector>
      <View style={styles.captionsRow}>
        <Text style={[styles.captionText, { color: theme.text }]} numberOfLines={1}>
          {left.label}
        </Text>
        <Text style={[styles.captionText, { color: theme.text }]} numberOfLines={1}>
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pairRow: {
    flexDirection: "row",
    gap: PAIR_GAP,
  },
  photoWrapper: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 2,
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
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.8,
  },
});

export default SyncedZoomPair;
