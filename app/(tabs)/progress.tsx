import React from "react";
import { StyleSheet, ScrollView, View, RefreshControl } from "react-native";
import PhotoMorph from "@/components/progress/PhotoMorph";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import BackgroundImage from "@/components/style/BackgroundImage";
import { Header } from "@/components/home/Header";
import { usePhotos } from "@/context/PhotoContext";
import { useLocalization } from "@/context/LocalizationContext";
import { PhotoType } from "@/enums/Photos";

const ProgressScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { getLatestPhotoByType, refreshPhotos } = usePhotos();
  const { t } = useLocalization();
  const types = Object.values(PhotoType);

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <Header title={t("progress.title")} />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.transparent },
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshPhotos} />
        }
      >
        {types.map((type) => (
          <View
            key={type}
            style={[
              styles.morphContainer,
              { backgroundColor: theme.transparent },
            ]}
          >
            <PhotoMorph type={type} />
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
