import React from "react";
import { StyleSheet, ScrollView, View, Text } from "react-native";
import PhotoMorph from "@/components/progress/PhotoMorph";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Your Progress</Text>
      <PhotoMorph type="front" />
      <PhotoMorph type="side" />
      <PhotoMorph type="back" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
});
