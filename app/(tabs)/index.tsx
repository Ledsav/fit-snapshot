import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter, Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StreakService, StreakData } from "@/services/streakService";
import { Header } from "@/components/home/Header";
import { StreakCard } from "@/components/home/StreakCard";
import { LatestPhotoCard } from "@/components/home/LatestPhotoCard";
import BackgroundImage from "@/components/style/BackgroundImage";
import { ShreddedTipsCarousel } from "@/components/home/ShreddedTipsCarousel";
import { ProgressSummary } from "@/components/home/ProgressSummary";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";
import { usePhotos } from "@/context/PhotoContext";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastPhotoDate: null,
  });
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { photos, refreshPhotos } = usePhotos();
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

  const totalDays =
    photos.length > 0
      ? Math.ceil(
          (new Date().getTime() - new Date(photos[0].date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
  const totalPhotos = photos.length;
  const improvement =
    totalDays > 0
      ? Math.min(100, Math.trunc((totalPhotos / totalDays) * 100))
      : 0;

  const loadStreakData = useCallback(async () => {
    const streak = await StreakService.getStreakData();
    setStreakData(streak);

    if (latestPhoto && streak.lastPhotoDate !== latestPhoto.date) {
      const updatedStreak = await StreakService.updateStreak(latestPhoto);
      setStreakData(updatedStreak);
    }
  }, [latestPhoto]);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const onboardingCompleted = await AsyncStorage.getItem(
        "onboardingCompleted"
      );
      if (onboardingCompleted === "true") {
        setShowOnboarding(false);
        loadStreakData();
      }
    };

    checkOnboardingStatus();
  }, [loadStreakData]);

  useEffect(() => {
    loadStreakData();
  }, [loadStreakData]);

  const handleOnboardingComplete = async () => {
    await AsyncStorage.setItem("onboardingCompleted", "true");
    setShowOnboarding(false);
    loadStreakData();
  };

  const navigateTo = (route: Href<string>) => {
    router.push(route);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshPhotos();
    await loadStreakData();
    setRefreshing(false);
  }, [refreshPhotos, loadStreakData]);

  if (showOnboarding) {
    return <OnboardingCarousel onComplete={handleOnboardingComplete} />;
  }

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <SafeAreaView style={[styles.container]}>
        <Header title="Fitness Tracker" />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Streak
            </Text>
            <StreakCard streak={streakData.currentStreak} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Stats
            </Text>
            <ProgressSummary
              totalDays={totalDays}
              totalPhotos={totalPhotos}
              improvement={improvement}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Tips
            </Text>
            <ShreddedTipsCarousel />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Latest Photo
            </Text>
            <LatestPhotoCard
              latestPhoto={latestPhoto}
              onPress={() => navigateTo("(tabs)/gallery" as Href<string>)}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
    flex: 1,
    height: 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  viewGalleryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
    marginTop: 12,
  },
  viewGalleryText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
    marginTop: 12,
  },
  settingsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
