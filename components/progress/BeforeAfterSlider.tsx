import React, { useRef, useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  PanResponder,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, borderRadius, fontFamily, preciseType } from "@/constants/DesignSystem";

interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string;
  beforeLabel: string;
  afterLabel: string;
  onValueChange?: (value: number) => void; // after-ness 0..100
  style?: ViewStyle;
}

const KNOB = 30;

// Shared before/after wipe-reveal slider. A draggable divider splits the
// "before" photo (left) from the "after" photo (right) — clearer than an
// opacity crossfade. It measures its own width and owns its drag gesture.
// Wrap it in a ContactSheetFrame at the call site for the mat + caption.
export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUri,
  afterUri,
  beforeLabel,
  afterLabel,
  onValueChange,
  style,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const [width, setWidth] = useState(0);
  const [after, setAfter] = useState(50); // after-ness: higher = more "after" shown
  const widthRef = useRef(0);

  const setFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    let dividerPct = (x / w) * 100; // divider position from the left
    dividerPct = Math.max(0, Math.min(100, dividerPct));
    const afterness = 100 - dividerPct; // left of divider = before, right = after
    setAfter(afterness);
    onValueChange?.(afterness);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => setFromX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => setFromX(evt.nativeEvent.locationX),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  };

  const dividerLeft: `${number}%` = `${100 - after}%`; // before occupies the left portion

  return (
    <View style={[styles.container, style]} onLayout={onLayout} {...panResponder.panHandlers}>
      {/* base layer: after photo (revealed on the right) */}
      <Image source={{ uri: afterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {/* overlay: before photo, clipped to the left portion */}
      <View style={[styles.beforeClip, { width: dividerLeft }]}>
        <Image
          source={{ uri: beforeUri }}
          style={{ width: width || undefined, height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <View style={styles.labels} pointerEvents="none">
        <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy) }]}>
          <Text style={[preciseType.caption, styles.labelText, { fontFamily: fontFamily.mono }]}>
            {beforeLabel.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy) }]}>
          <Text style={[preciseType.caption, styles.labelText, { fontFamily: fontFamily.mono }]}>
            {afterLabel.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.divider, { left: dividerLeft, backgroundColor: theme.primary }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.knob,
          { left: dividerLeft, backgroundColor: theme.background, borderColor: theme.primary },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  beforeClip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
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
  divider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
  knob: {
    position: "absolute",
    top: "50%",
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    borderWidth: 2,
    marginLeft: -KNOB / 2,
    marginTop: -KNOB / 2,
  },
});
