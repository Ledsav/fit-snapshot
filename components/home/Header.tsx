import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import Svg, { Defs, Pattern, Rect, Path } from "react-native-svg";

const motivationalQuotes = [
  "Transform your body, transform your life!",
  "Every photo is a step towards your goal.",
  "Capture your progress, fuel your motivation.",
];

export const Header = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="headerPattern"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <Path
              d="M10 10 h10 v5 h10 v-5 h10 v10 h-10 v5 h-10 v-5 h-10 Z" // Dumbbell
              stroke={theme.background}
              strokeWidth="2"
              strokeOpacity="0.2"
              fill="none"
            />
            <Path
              d="M60 50 c0-10 10-10 10 0 c0 10-10 10-10 20 c0-10-10-10-10-20 c0-10 10-10 10 0 Z" // Heart
              stroke={theme.background}
              strokeWidth="2"
              strokeOpacity="0.2"
              fill="none"
            />
          </Pattern>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#headerPattern)"
        />
      </Svg>
      <LinearGradient
        colors={[theme.primary, theme.primary + "CC"]} // CC adds 80% opacity to the second color
        style={styles.headerGradient}
      >
        <Text style={[styles.title, { color: theme.background }]}>
          Fitness Tracker
        </Text>
        <Text style={[styles.subtitle, { color: theme.background }]}>
          {
            motivationalQuotes[
              Math.floor(Math.random() * motivationalQuotes.length)
            ]
          }
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontStyle: "italic",
  },
});
