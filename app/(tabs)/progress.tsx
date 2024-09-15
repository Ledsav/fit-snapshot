import React from "react";
import { StyleSheet, ScrollView, View, RefreshControl } from "react-native";
import PhotoMorph from "@/components/progress/PhotoMorph";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import BackgroundImage from "@/components/style/BackgroundImage";
import { Header } from "@/components/home/Header";
import { usePhotos } from "@/context/PhotoContext";

const ProgressScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { getLatestPhotoByType, refreshPhotos } = usePhotos();

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <Header title="Your Progress" />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.transparent },
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshPhotos} />
        }
      >
        {["front", "side", "back"].map((type) => (
          <View
            key={type}
            style={[
              styles.morphContainer,
              { backgroundColor: theme.transparent },
            ]}
          >
            <PhotoMorph
              type={type as "front" | "side" | "back"}
              photo={getLatestPhotoByType(type as "front" | "side" | "back")}
              onRefresh={refreshPhotos}
            />
          </View>
        ))}
      </ScrollView>
    </BackgroundImage>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  statsContainer: {
    width: "100%",
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statsText: {
    fontSize: 16,
    marginBottom: 5,
  },
  morphContainer: {
    width: "100%",
    marginBottom: 20,
  },
});

export default ProgressScreen;
