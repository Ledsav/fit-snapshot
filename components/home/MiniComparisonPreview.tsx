import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Photo } from "@/services/photoStorage";
import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import React, { useState } from "react";
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const MINI_SLIDER_WIDTH = width - 80;
const MINI_THUMB_SIZE = 28;
const MINI_THUMB_RADIUS = MINI_THUMB_SIZE / 2;

type MiniComparisonPreviewProps = {
  photos: Photo[];
};

export const MiniComparisonPreview: React.FC<MiniComparisonPreviewProps> = ({ photos }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const router = useRouter();
  const [sliderValue, setSliderValue] = useState(50);
  const pan = React.useRef(new Animated.ValueXY({ x: MINI_SLIDER_WIDTH / 2, y: 0 })).current;

  if (photos.length < 2) {
    return null;
  }

  const oldestPhoto = photos[0];
  const newestPhoto = photos[photos.length - 1];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      
      let newX = gesture.moveX - 40;
      
      newX = Math.max(0, Math.min(newX, MINI_SLIDER_WIDTH));
      pan.x.setValue(newX);
      setSliderValue((newX / MINI_SLIDER_WIDTH) * 100);
    },
  });

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
      onPress={() => router.push("(tabs)/progress" as Href<string>)}
      activeOpacity={0.95}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t("home.transformation") || "Your Transformation"}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={theme.text} />
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: oldestPhoto.uri }}
          style={[styles.image, { opacity: (100 - sliderValue) / 100 }]}
        />
        <Image
          source={{ uri: newestPhoto.uri }}
          style={[styles.image, styles.overlayImage, { opacity: sliderValue / 100 }]}
        />

        <View style={styles.labels}>
          <View style={[styles.label, { backgroundColor: theme.text + '99', opacity: (100 - sliderValue) / 100 }]}>
            <Text style={styles.labelText}>Before</Text>
          </View>
          <View style={[styles.label, { backgroundColor: theme.text + '99', opacity: sliderValue / 100 }]}>
            <Text style={styles.labelText}>After</Text>
          </View>
        </View>
      </View>

      <View style={styles.sliderWrapper}>
        <View style={styles.sliderContainer} {...panResponder.panHandlers}>
          <View style={[styles.sliderTrack, { backgroundColor: theme.text + '20' }]} />
          <View
            style={[
              styles.sliderProgress,
              { backgroundColor: theme.primary, width: `${sliderValue}%` },
            ]}
          />
          <Animated.View
            style={[
              styles.sliderThumb,
              {
                backgroundColor: theme.background,
                borderColor: theme.primary,
                transform: [
                  { translateX: Animated.subtract(pan.x, MINI_THUMB_RADIUS) }
                ],
              },
            ]}
          >
            <View style={[styles.sliderThumbInner, { backgroundColor: theme.primary }]} />
          </Animated.View>
        </View>
      </View>

      <Text style={[styles.hint, { color: theme.text }]}>
        {t("home.tapForMore") || "Tap to see full comparison"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayImage: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  labels: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labelText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  sliderWrapper: {
    marginBottom: 8,
  },
  sliderContainer: {
    width: MINI_SLIDER_WIDTH,
    height: 32,
    justifyContent: "center",
    alignSelf: "center",
    position: "relative",
  },
  sliderTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    position: "absolute",
  },
  sliderProgress: {
    height: 4,
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: "absolute",
    top: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  sliderThumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.6,
    fontStyle: "italic",
  },
});
