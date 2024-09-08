import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect, Circle } from "react-native-svg";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";

export const BackgroundPattern: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="pattern"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <Circle cx="20" cy="20" r="2" fill={theme.text} opacity="0.1" />
            <Circle cx="0" cy="0" r="1" fill={theme.text} opacity="0.1" />
            <Circle cx="40" cy="0" r="1" fill={theme.text} opacity="0.1" />
            <Circle cx="0" cy="40" r="1" fill={theme.text} opacity="0.1" />
            <Circle cx="40" cy="40" r="1" fill={theme.text} opacity="0.1" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#pattern)" />
      </Svg>
    </View>
  );
};
