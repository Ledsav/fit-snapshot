import { AchievementBadges } from "@/components/home/AchievementBadges";
import { ConsistencyHeatmap } from "@/components/home/ConsistencyHeatmap";
import { Header } from "@/components/home/Header";
import { LatestPhotoCard } from "@/components/home/LatestPhotoCard";
import { MiniComparisonPreview } from "@/components/home/MiniComparisonPreview";
import { NextPhotoReminder } from "@/components/home/NextPhotoReminder";
import { ProgressSummary } from "@/components/home/ProgressSummary";
import { ShreddedTipsCarousel } from "@/components/home/ShreddedTipsCarousel";
import { StreakCard } from "@/components/home/StreakCard";
import { WeeklyProgressChart } from "@/components/home/WeeklyProgressChart";
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";
import BackgroundImage from "@/components/style/BackgroundImage";
import Colors from "@/constants/Colors";
import { Feature } from "@/constants/Features";
import {
  spacing,
  borderRadius,
  elevation,
  typography,
  iconSize,
} from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { StreakData, StreakService } from "@/services/streakService";
import { getBestComparisonPair } from "@/utils/photoUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Href, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

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
  const hasComparisonPhotos = useMemo(() => getBestComparisonPair(photos) !== null, [photos]);

  const totalDays =
    photos.length > 0
      ? Math.ceil(
          (new Date().getTime() - new Date(photos[0].date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
  const totalPhotos = photos.length;
  const totalExpectedPhotos = totalDays * 3;
  const consistency = Math.min(
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

  const navigateTo = (route: Href) => {
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
          {hasComparisonPhotos && (
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
              consistency={consistency}
            />
          </View>

          {/* Achievements - Gamification for engagement - PREMIUM */}
          <FeatureGate
            feature={Feature.ACHIEVEMENT_BADGES}
            showPreview={false}
            containerStyle={styles.section}
            compact={false}
          >
            <AchievementBadges photos={photos} currentStreak={streakData.currentStreak} />
          </FeatureGate>

          {/* Weekly Progress Chart - Recent activity trend - PREMIUM */}
          <FeatureGate
            feature={Feature.WEEKLY_PROGRESS_CHART}
            showPreview={false}
            containerStyle={styles.section}
            compact={false}
          >
            <WeeklyProgressChart photos={photos} />
          </FeatureGate>

          {/* Consistency Heatmap - Long-term view - PREMIUM */}
          <FeatureGate
            feature={Feature.CONSISTENCY_HEATMAP}
            showPreview={false}
            containerStyle={styles.section}
            compact={false}
          >
            <ConsistencyHeatmap photos={photos} />
          </FeatureGate>

          {/* Latest Photo - Quick gallery preview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t("home.latestPhoto")}
            </Text>
            <LatestPhotoCard
              latestPhoto={latestPhoto}
              onPress={() => navigateTo("/(tabs)/gallery")}
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
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  quickCameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xxl,
    gap: spacing.md,
    ...elevation.md,
  },
  quickCameraText: {
    ...typography.h4,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
    flex: 1,
    height: 100,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: spacing.xs,
  },
  quickActionText: {
    marginTop: spacing.sm,
    ...typography.caption,
    fontWeight: "bold",
  },
  viewGalleryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  viewGalleryText: {
    ...typography.h4,
    marginRight: spacing.md,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  settingsText: {
    ...typography.h4,
    marginLeft: spacing.md,
  },
});
