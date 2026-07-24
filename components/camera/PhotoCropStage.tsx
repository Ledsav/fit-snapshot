import AlignmentOverlay from "@/components/camera/AlignmentOverlay";
import Colors, { overlayOpacity, withOpacity } from "@/constants/Colors";
import { borderRadius, spacing } from "@/constants/DesignSystem";
import { useTheme } from "@/context/ThemeContext";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import { computeBaseScale, computeCropRect, computeMaxTranslate, CropRect } from "@/utils/cropMath";
import React, { forwardRef, useImperativeHandle } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const FRAME_WIDTH = screenWidth - spacing.xl * 2;
const FRAME_HEIGHT = FRAME_WIDTH * (4 / 3);
const FRAME_LEFT = spacing.xl;
const FRAME_TOP = (screenHeight - FRAME_HEIGHT) / 2;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampWorklet(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export interface PhotoCropStageHandle {
  getCropRect: () => CropRect;
}

interface PhotoCropStageProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  type: PhotoType;
  ghostPhoto?: Photo;
}

// Replaces the native OS gallery cropper: the picked photo can be panned and
// pinch-zoomed under a fixed 3:4 frame, with the same silhouette/ghost guide
// the live camera shows drawn on top, so an imported photo can be aligned
// the same way a live shot can.
export const PhotoCropStage = forwardRef<PhotoCropStageHandle, PhotoCropStageProps>(
  ({ imageUri, imageWidth, imageHeight, type, ghostPhoto }, ref) => {
    const { effectiveColorScheme } = useTheme();
    const theme = Colors[effectiveColorScheme];

    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const baseScale = computeBaseScale(imageWidth, imageHeight, FRAME_WIDTH, FRAME_HEIGHT);
    const baseWidth = imageWidth * baseScale;
    const baseHeight = imageHeight * baseScale;

    useImperativeHandle(ref, () => ({
      getCropRect: () =>
        computeCropRect({
          imageWidth,
          imageHeight,
          frameWidth: FRAME_WIDTH,
          frameHeight: FRAME_HEIGHT,
          userScale: scale.value,
          translateX: translateX.value,
          translateY: translateY.value,
        }),
    }));

    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        scale.value = clampWorklet(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
        const { maxX, maxY } = computeMaxTranslate(imageWidth, imageHeight, FRAME_WIDTH, FRAME_HEIGHT, scale.value);
        translateX.value = clampWorklet(translateX.value, -maxX, maxX);
        translateY.value = clampWorklet(translateY.value, -maxY, maxY);
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const panGesture = Gesture.Pan()
      .minDistance(5)
      .onUpdate((event) => {
        const { maxX, maxY } = computeMaxTranslate(imageWidth, imageHeight, FRAME_WIDTH, FRAME_HEIGHT, scale.value);
        translateX.value = clampWorklet(savedTranslateX.value + event.translationX, -maxX, maxX);
        translateY.value = clampWorklet(savedTranslateY.value + event.translationY, -maxY, maxY);
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
      width: baseWidth,
      height: baseHeight,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    const maskColor = withOpacity("#000000", overlayOpacity.heavy);

    return (
      <GestureDetector gesture={composedGesture}>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.imageCenterer} pointerEvents="none">
            <Animated.Image source={{ uri: imageUri }} style={animatedStyle} resizeMode="cover" />
          </View>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <AlignmentOverlay type={type} ghostPhoto={ghostPhoto} />
          </View>
          <View pointerEvents="none" style={[styles.mask, { top: 0, left: 0, right: 0, height: FRAME_TOP, backgroundColor: maskColor }]} />
          <View pointerEvents="none" style={[styles.mask, { bottom: 0, left: 0, right: 0, height: screenHeight - FRAME_TOP - FRAME_HEIGHT, backgroundColor: maskColor }]} />
          <View pointerEvents="none" style={[styles.mask, { top: FRAME_TOP, left: 0, width: FRAME_LEFT, height: FRAME_HEIGHT, backgroundColor: maskColor }]} />
          <View pointerEvents="none" style={[styles.mask, { top: FRAME_TOP, right: 0, width: screenWidth - FRAME_LEFT - FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: maskColor }]} />
          <View
            pointerEvents="none"
            style={[styles.frameBorder, { top: FRAME_TOP, left: FRAME_LEFT, width: FRAME_WIDTH, height: FRAME_HEIGHT, borderColor: theme.primary }]}
          />
        </View>
      </GestureDetector>
    );
  }
);

const styles = StyleSheet.create({
  imageCenterer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  mask: {
    position: "absolute",
  },
  frameBorder: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: borderRadius.sm,
  },
});

export default PhotoCropStage;
