import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import BackgroundImage from "../style/BackgroundImage";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const onboardingSteps = [
  {
    title: "Take a Photo",
    subtitle: "Take pictures each day",
    image: require("@/assets/images/camera.png"),
    icon: "camera",
  },
  {
    title: "See your progress",
    subtitle: "Track your fitness journey",
    image: require("@/assets/images/progress.png"),
    icon: "bar-chart",
  },
  {
    title: "Share your results",
    subtitle: "Inspire others with your success",
    image: require("@/assets/images/share.png"),
    icon: "share-social",
  },
];

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
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <View style={styles.container}>
        <PagerView
          ref={pagerRef}
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          {onboardingSteps.map((step, index) => (
            <View key={index} style={styles.page}>
              <Image source={step.image} style={styles.backgroundImage} />
              <LinearGradient
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.5)",
                  "rgba(0,0,0,0.8)",
                  "rgba(0,0,0,0.9)",
                ]}
                locations={[0, 0.5, 0.8, 1]}
                style={styles.overlay}
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
              <Text style={[styles.subtitle, { color: theme.text }]}>
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
                  ? "Get Started"
                  : "Next"}
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
    </BackgroundImage>
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
  backgroundImage: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: "cover",
    opacity: 0.7, // Slightly reduced opacity for better blending
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28, // Slightly increased font size
    fontWeight: "bold",
    marginBottom: 8, // Increased margin
  },
  subtitle: {
    fontSize: 18, // Slightly increased font size
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10, // Slightly increased padding
    paddingHorizontal: 20, // Slightly increased padding
    borderRadius: 25, // Increased border radius
  },
  nextButtonText: {
    fontSize: 18, // Slightly increased font size
    fontWeight: "bold",
    marginRight: 5,
  },
});
