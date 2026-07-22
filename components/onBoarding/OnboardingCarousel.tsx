import Colors from "@/constants/Colors";
import { fontFamily, preciseType } from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PagerView from "react-native-pager-view";

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  onComplete,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { t } = useLocalization();

  const onboardingSteps = [
    {
      title: t("onboardingCarousel.seeProgress.title"),
      subtitle: t("onboardingCarousel.seeProgress.subtitle"),
      image: require("@/assets/images/onbording/progress.jpg"),
    },
    {
      title: t("onboardingCarousel.takePhoto.title"),
      subtitle: t("onboardingCarousel.takePhoto.subtitle"),
      image: require("@/assets/images/onbording/photo.jpg"),
    },
    {
      title: t("onboardingCarousel.shareResults.title"),
      subtitle: t("onboardingCarousel.shareResults.subtitle"),
      image: require("@/assets/images/onbording/share.jpg"),
    },
  ];

  const handlePageSelected = (e: any) => {
    setActiveIndex(e.nativeEvent.position);
  };

  const nextStep = () => {
    if (activeIndex < onboardingSteps.length - 1) {
      pagerRef.current?.setPage(activeIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {onboardingSteps.map((step, index) => (
          <View key={index} style={[styles.page, { backgroundColor: theme.background }]}>
            <Image source={step.image} style={styles.onboardingImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.4)', theme.background]}
              locations={[0, 0.6, 1]}
              style={styles.imageGradient}
            />
          </View>
        ))}
      </PagerView>
      <View style={styles.footer}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.step, { color: theme.primary, fontFamily: fontFamily.mono }]}>
              {String(activeIndex + 1).padStart(2, "0")} / {String(onboardingSteps.length).padStart(2, "0")}
            </Text>
            <Text
              style={[styles.title, preciseType.heroTitle, { color: theme.text, fontFamily: fontFamily.display }]}
            >
              {onboardingSteps[activeIndex].title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {onboardingSteps[activeIndex].subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.navigationContainer}>
          <View style={styles.pagination}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: index === activeIndex ? theme.primary : theme.tabIconDefault,
                    width: index === activeIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.primary }]}
            onPress={nextStep}
          >
            <Text style={[styles.nextButtonText, { color: theme.background, fontFamily: fontFamily.mono }]}>
              {(activeIndex === onboardingSteps.length - 1
                ? t("onboardingCarousel.getStarted")
                : t("onboardingCarousel.next")
              ).toUpperCase()}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={theme.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pagerView: { flex: 1 },
  page: { flex: 1, position: "relative" },
  onboardingImage: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0 },
  imageGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: 50,
  },
  contentContainer: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  textContainer: { flex: 1 },
  step: { fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  title: { fontStyle: "italic", marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  navigationContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pagination: { flexDirection: "row", alignItems: "center" },
  paginationDot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: { fontSize: 11, letterSpacing: 1 },
});
