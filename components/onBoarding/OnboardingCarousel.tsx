import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
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
      gradient: [theme.accent, theme.secondary],
      backgroundColor: theme.cardBackground,
    },
    {
      title: t("onboardingCarousel.takePhoto.title"),
      subtitle: t("onboardingCarousel.takePhoto.subtitle"),
      image: require("@/assets/images/onbording/photo.jpg"),
      gradient: [theme.primary, theme.accent],
      backgroundColor: theme.cardBackground,
    },
    {
      title: t("onboardingCarousel.shareResults.title"),
      subtitle: t("onboardingCarousel.shareResults.subtitle"),
      image: require("@/assets/images/onbording/share.jpg"),
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
          <View key={index} style={[styles.page, { backgroundColor: theme.background }]}>
            <Image
              source={step.image}
              style={styles.onboardingImage}
              resizeMode="cover"
            />
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
            <Text style={[styles.title, { color: theme.text }]}>
              {onboardingSteps[activeIndex].title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.text  }]}>
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
    position: "relative",
  },
  onboardingImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
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
