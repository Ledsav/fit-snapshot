import React, { useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import {
  spacing,
  borderRadius,
  typography,
  iconSize,
} from "@/constants/DesignSystem";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_MARGIN = spacing.sm;
const CARD_WIDTH = SCREEN_WIDTH - spacing.huge - 2 * CARD_MARGIN;

interface Tip {
  main: string;
  clarification: string;
  icon: string;
}

export const ShreddedTipsCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  const tips = useMemo(() => {
    try {
      return JSON.parse(t("shreddedTipsCarousel.tips")) as Tip[];
    } catch (error) {
      console.error("Failed to parse tips:", error);
      return [];
    }
  }, [t]);

  const handlePageSelected = (e: any) => {
    setActiveIndex(e.nativeEvent.position);
  };

  const scrollToIndex = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {tips.map((tip: Tip, index: number) => (
          <View key={index} style={styles.page}>
            <View style={[styles.slide, { backgroundColor: theme.primary }]}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={tip.icon as any}
                  size={iconSize.xl}
                  color={theme.cardBackground}
                />
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[styles.mainText, { color: theme.cardBackground }]}
                >
                  {tip.main}
                </Text>
                <Text
                  style={[
                    styles.clarificationText,
                    { color: theme.cardBackground },
                  ]}
                >
                  {tip.clarification}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </PagerView>
      <View style={styles.pagination}>
        {tips.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor:
                  index === activeIndex
                    ? theme.primary
                    : withOpacity(theme.text, overlayOpacity.heavy),
              },
            ]}
            onPress={() => scrollToIndex(index)}
          />
        ))}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.25,
    marginVertical: spacing.xl,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: CARD_MARGIN,
  },
  slide: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: CARD_WIDTH,
    height: "100%",
  },
  iconContainer: {
    marginRight: spacing.xl,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    ...typography.h3,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  clarificationText: {
    ...typography.body,
    flexWrap: "wrap",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    marginHorizontal: spacing.xs,
  },
});
