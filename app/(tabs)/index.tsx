import { AchievementBadges } from "@/components/home/AchievementBadges";
import { ConsistencyHeatmap } from "@/components/home/ConsistencyHeatmap";
import { Header } from "@/components/home/Header";
import { LatestPhotoCard } from "@/components/home/LatestPhotoCard";
import { InstrumentStrip } from "@/components/home/InstrumentStrip";
import { MiniComparisonPreview } from "@/components/home/MiniComparisonPreview";
import { NextPhotoReminder } from "@/components/home/NextPhotoReminder";
import { ShreddedTipsCarousel } from "@/components/home/ShreddedTipsCarousel";
import { StreakBadge } from "@/components/home/StreakBadge";
import { WeeklyProgressChart } from "@/components/home/WeeklyProgressChart";
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";
import BackgroundImage from "@/components/style/BackgroundImage";
import Colors from "@/constants/Colors";
import { Feature } from "@/constants/Features";
import { spacing, fontFamily, preciseType } from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { StreakData, StreakService } from "@/services/streakService";
import { getBestComparisonPair, getPhotosInLastNDays } from "@/utils/photoUtils";
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
  const consistency =
    totalExpectedPhotos > 0
      ? Math.min(100, Math.round((totalPhotos / totalExpectedPhotos) * 100))
      : 0;
  const weeklyPhotoCount = useMemo(() => getPhotosInLastNDays(photos, 7), [photos]);

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
          {/* Contact-sheet hero — the screen's thesis: the photos themselves */}
          {hasComparisonPhotos && (
            <View style={styles.section}>
              <MiniComparisonPreview photos={photos} />
            </View>
          )}

          {/* This week — instrument readout */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
              {t("home.thisWeek") || "This Week"}
            </Text>
            <InstrumentStrip
              totalDays={totalDays}
              consistency={consistency}
              weeklyPhotoCount={weeklyPhotoCount}
            />
          </View>

          {/* Next Photo Reminder - primary action */}
          <View style={styles.section}>
            <NextPhotoReminder latestPhoto={latestPhoto} />
          </View>

          {/* Streak badge - compact milestone signal, not a hero card */}
          <View style={styles.section}>
            <StreakBadge streak={streakData.currentStreak} />
          </View>

          {/* Latest Photo - Quick gallery preview */}
          {latestPhoto && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
                {t("home.latestPhoto")}
              </Text>
              <LatestPhotoCard
                latestPhoto={latestPhoto}
                onPress={() => navigateTo("/(tabs)/gallery")}
              />
            </View>
          )}

          {/* Pro — premium insights, one quiet group */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
              {t("home.pro") || "Pro"}
            </Text>
            <View style={styles.proGroup}>
              <FeatureGate
                feature={Feature.ACHIEVEMENT_BADGES}
                customMessage={t("home.achievements")}
                compact
              >
                <AchievementBadges photos={photos} currentStreak={streakData.currentStreak} />
              </FeatureGate>
              <FeatureGate
                feature={Feature.WEEKLY_PROGRESS_CHART}
                customMessage={t("home.weeklyActivity")}
                compact
              >
                <WeeklyProgressChart photos={photos} />
              </FeatureGate>
              <FeatureGate
                feature={Feature.CONSISTENCY_HEATMAP}
                customMessage={t("home.consistency")}
                compact
              >
                <ConsistencyHeatmap photos={photos} />
              </FeatureGate>
            </View>
          </View>

          {/* Tips Section - Educational content at bottom */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
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
    fontFamily: fontFamily.mono,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  proGroup: {
    gap: spacing.sm,
  },
});
