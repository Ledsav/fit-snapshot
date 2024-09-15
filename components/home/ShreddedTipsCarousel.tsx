import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { useShreddedTips } from "../../hooks/useShreddedTips";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_MARGIN = 10;
const CARD_WIDTH = SCREEN_WIDTH - 40 - 2 * CARD_MARGIN;

export const ShreddedTipsCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { tips, refreshTips } = useShreddedTips(5);
  const pagerRef = useRef<PagerView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

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
        {tips.map((tip, index) => (
          <View key={index} style={styles.page}>
            <View style={[styles.slide, { backgroundColor: theme.primary }]}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={tip.icon as any}
                  size={40}
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
                    : "rgba(255,255,255,0.5)",
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
    marginVertical: 20,
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
    borderRadius: 15,
    padding: 20,
    width: CARD_WIDTH,
    height: "100%",
  },
  iconContainer: {
    marginRight: 20,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  clarificationText: {
    fontSize: 16,
    flexWrap: "wrap",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
