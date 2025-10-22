import { BlurView } from "expo-blur";
import React from "react";
import { ImageBackground, StyleSheet, View, ViewStyle } from "react-native";

interface BackgroundImageProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
  overlayOpacity?: number;
}

const BackgroundImage: React.FC<BackgroundImageProps> = ({
  children,
  style,
  blurIntensity = 50,
  overlayOpacity = 0.3,
}) => {
  return (
    <ImageBackground
      source={require("../../assets/images/background.jpg")}
      style={[styles.background, style]}
      blurRadius={blurIntensity}
      resizeMode="cover"
    >
      <BlurView
        intensity={60}
        tint="dark"
        style={[styles.blurView, { opacity: overlayOpacity }]}
      />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});

export default BackgroundImage;
