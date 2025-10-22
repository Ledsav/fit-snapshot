import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalization } from "@/context/LocalizationContext";

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
      title: t("onboardingCarousel.takePhoto.title"),
      subtitle: t("onboardingCarousel.takePhoto.subtitle"),
      icon: "camera",
      gradient: [theme.primary, theme.accent],
      backgroundColor: theme.cardBackground,
    },
    {
      title: t("onboardingCarousel.seeProgress.title"),
      subtitle: t("onboardingCarousel.seeProgress.subtitle"),
      icon: "trending-up",
      gradient: [theme.accent, theme.secondary],
      backgroundColor: theme.cardBackground,
    },
    {
      title: t("onboardingCarousel.shareResults.title"),
      subtitle: t("onboardingCarousel.shareResults.subtitle"),
      icon: "trophy",
      gradient: [theme.primary, theme.info],
      backgroundColor: theme.cardBackground,
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
          <View key={index} style={[styles.page, { backgroundColor: step.backgroundColor }]}>
            <View style={styles.contentWrapper}>
              <LinearGradient
                colors={step.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCircle}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={step.icon as any}
                    size={100}
                    color={theme.background}
                  />
                </View>
              </LinearGradient>

              <View style={styles.decorativeCircle1}>
                <LinearGradient
                  colors={[step.gradient[0] + '30', step.gradient[1] + '20']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.decorativeGradient}
                />
              </View>

              <View style={styles.decorativeCircle2}>
                <LinearGradient
                  colors={[step.gradient[1] + '20', step.gradient[0] + '30']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.decorativeGradient}
                />
              </View>
            </View>
          </View>
        ))}
      </PagerView>
      <View style={styles.footer}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.text }]}>
              {onboardingSteps[activeIndex].title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondaryText || theme.text }]}>
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
                    backgroundColor:
                      index === activeIndex
                        ? theme.primary
                        : theme.tabIconDefault,
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
            <Text
              style={[styles.nextButtonText, { color: theme.background }]}
            >
              {activeIndex === onboardingSteps.length - 1
                ? t("onboardingCarousel.getStarted")
                : t("onboardingCarousel.next")}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={theme.background}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  gradientCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 10,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeCircle1: {
    position: "absolute",
    top: "15%",
    right: "10%",
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: "hidden",
    opacity: 0.6,
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: "25%",
    left: "8%",
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    opacity: 0.5,
  },
  decorativeGradient: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: 50,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.7,
    lineHeight: 22,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
});
