import React, { useState } from "react";
import { StyleSheet, ScrollView, View, RefreshControl, TouchableOpacity, Text } from "react-native";
import PhotoMorph from "@/components/progress/PhotoMorph";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { fontFamily, preciseType } from "@/constants/DesignSystem";
import { useTheme } from "@/context/ThemeContext";
import BackgroundImage from "@/components/style/BackgroundImage";
import { Header } from "@/components/home/Header";
import { usePhotos } from "@/context/PhotoContext";
import { useLocalization } from "@/context/LocalizationContext";
import { PhotoType } from "@/enums/Photos";

const ProgressScreen: React.FC = () => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { refreshPhotos } = usePhotos();
  const { t } = useLocalization();
  const types = Object.values(PhotoType);
  const [activeType, setActiveType] = useState<PhotoType>(PhotoType.front);

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <Header title={t("progress.title")} />
      <View style={styles.tabBar}>
        {types.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.tabButton,
              activeType === type
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.transparent, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
            ]}
            onPress={() => setActiveType(type)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                preciseType.badgeLabel,
                { color: activeType === type ? theme.background : theme.text },
              ]}
            >
              {t(`camera.${type}`).toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.transparent },
        ]}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refreshPhotos} />
        }
      >
        <View
          style={[
            styles.morphContainer,
            { backgroundColor: theme.transparent },
          ]}
        >
          <PhotoMorph type={activeType} />
        </View>
      </ScrollView>
    </BackgroundImage>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  tabButtonText: {
    fontFamily: fontFamily.mono,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
  },
  morphContainer: {
    width: "100%",
    marginBottom: 20,
  },
});

export default ProgressScreen;
