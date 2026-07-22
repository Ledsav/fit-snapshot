import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

interface BackgroundImageProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
  overlayOpacity?: number;
}

// Flat instrument-panel ground. Replaces the photographic background, which
// no longer matches the Graphite & Brass palette even blurred/tinted.
// blurIntensity/overlayOpacity are kept in the prop signature so existing
// call sites don't need changes, but are no longer used.
const BackgroundImage: React.FC<BackgroundImageProps> = ({ children, style }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  return (
    <View style={[styles.background, { backgroundColor: theme.background }, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
  },
});

export default BackgroundImage;
