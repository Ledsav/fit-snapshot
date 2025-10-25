import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Href } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { StreakService, StreakData } from "@/services/streakService";
import { Header } from "@/components/home/Header";
import { StreakCard } from "@/components/home/StreakCard";
import { LatestPhotoCard } from "@/components/home/LatestPhotoCard";
import BackgroundImage from "@/components/style/BackgroundImage";
import { ShreddedTipsCarousel } from "@/components/home/ShreddedTipsCarousel";
import { ProgressSummary } from "@/components/home/ProgressSummary";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";
import { WeeklyProgressChart } from "@/components/home/WeeklyProgressChart";
import { NextPhotoReminder } from "@/components/home/NextPhotoReminder";
import { MiniComparisonPreview } from "@/components/home/MiniComparisonPreview";
import { AchievementBadges } from "@/components/home/AchievementBadges";
import { ConsistencyHeatmap } from "@/components/home/ConsistencyHeatmap";
import { usePhotos } from "@/context/PhotoContext";
import { useLocalization } from "@/context/LocalizationContext";
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { Feature } from "@/constants/Features";

export default function HomeScreen() {
  const router = useRouter();
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
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
  const totalExpectedPhotos = totalDays * 3;
  const improvement = Math.min(
    100,
    Math.round((totalPhotos / totalExpectedPhotos) * 100)
  );

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
        <Header title={t("home.title")} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Next Photo Reminder - Most important action */}
          <View style={styles.section}>
            <NextPhotoReminder latestPhoto={latestPhoto} />
          </View>

          {/* Mini Comparison Preview - Visual progress hook */}
          {photos.length >= 2 && (
            <View style={styles.section}>
              <MiniComparisonPreview photos={photos} />
            </View>
          )}

          {/* Streak & Stats - Key metrics at a glance */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("home.streak")}
            </Text>
            <StreakCard streak={streakData.currentStreak} />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("home.stats")}
            </Text>
            <ProgressSummary
              totalDays={totalDays}
              totalPhotos={totalPhotos}
              improvement={improvement}
            />
          </View>

          {/* Achievements - Gamification for engagement - PREMIUM */}
          <View style={styles.section}>
            <FeatureGate feature={Feature.ACHIEVEMENT_BADGES} showPreview={true}>
              <AchievementBadges photos={photos} currentStreak={streakData.currentStreak} />
            </FeatureGate>
          </View>

          {/* Weekly Progress Chart - Recent activity trend - PREMIUM */}
          <View style={styles.section}>
            <FeatureGate feature={Feature.WEEKLY_PROGRESS_CHART} showPreview={true}>
              <WeeklyProgressChart photos={photos} />
            </FeatureGate>
          </View>

          {/* Consistency Heatmap - Long-term view - PREMIUM */}
          <View style={styles.section}>
            <FeatureGate feature={Feature.CONSISTENCY_HEATMAP} showPreview={true}>
              <ConsistencyHeatmap photos={photos} />
            </FeatureGate>
          </View>

          {/* Latest Photo - Quick gallery preview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("home.latestPhoto")}
            </Text>
            <LatestPhotoCard
              latestPhoto={latestPhoto}
              onPress={() => navigateTo("(tabs)/gallery" as Href<string>)}
            />
          </View>

          {/* Tips Section - Educational content at bottom */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("home.tips")}
            </Text>
            <ShreddedTipsCarousel />
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
  quickCameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 15,
    marginBottom: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  quickCameraText: {
    fontSize: 18,
    fontWeight: "bold",
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
