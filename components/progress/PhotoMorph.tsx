import React, { useState, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { getTimeDifference } from "@/utils/dateUtils";
import * as MediaLibrary from "expo-media-library";
import { usePhotos } from "@/context/PhotoContext";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import { PhotoType } from "@/enums/Photos";

interface PhotoMorphProps {
  type: PhotoType.front | PhotoType.side | PhotoType.back;
}

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width * 0.8;

const PhotoMorph: React.FC<PhotoMorphProps> = ({ type }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { getPhotosByType } = usePhotos();
  const photos = getPhotosByType(type);
  const { t } = useLocalization();

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      let newX = gesture.moveX - width * 0.1;
      newX = Math.max(0, Math.min(newX, SLIDER_WIDTH));
      pan.x.setValue(newX);
      setSliderValue((newX / SLIDER_WIDTH) * 100);
    },
  });

  const extractPhoto = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
        return;
      }

      const photoToExtract =
        photos.length > 1
          ? sliderValue > 50
            ? photos[photos.length - 1]
            : photos[0]
          : photos[0];
      const asset = await MediaLibrary.createAssetAsync(photoToExtract.uri);
      await MediaLibrary.createAlbumAsync("FitSnapshot", asset, false);

      Alert.alert(t("common.success"), t("progress.photoSavedMessage"));
    } catch (error) {
      console.error("Error extracting photo:", error);
      Alert.alert(t("common.error"), t("progress.photoSaveErrorMessage"));
    }
  }, [photos, sliderValue, t]);

  if (photos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t(`progress.${type}`)}
        </Text>
        <View
          style={[
            styles.noPhotosContainer,
            { backgroundColor: theme.transparent },
          ]}
        >
          <Ionicons name="image-outline" size={48} color={theme.text} />
          <Text style={[styles.noPhotosText, { color: theme.text }]}>
            {t("progress.noPhotosAvailable") + " " + t(`progress.${type}`)}
          </Text>
        </View>
      </View>
    );
  }

  if (photos.length === 1) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t(`progress.${type}`)}
          </Text>
          <View style={[styles.singlePhotoChip, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="image-outline" size={16} color={theme.text} />
            <Text style={[styles.singlePhotoChipText, { color: theme.text }]}>1 photo</Text>
          </View>
        </View>
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: theme.cardBackground, borderColor: theme.primary },
          ]}
        >
          <Image source={{ uri: photos[0].uri }} style={styles.image} />
          <View style={styles.photoLabels}>
            <View style={styles.photoLabel}>
              <Text style={styles.photoLabelText}>
                {new Date(photos[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.extractButton, { backgroundColor: theme.primary }]}
            onPress={extractPhoto}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.singlePhotoHint, { color: theme.text }]}>
          Take more photos to see your progress over time
        </Text>
      </View>
    );
  }

  const oldestPhoto = photos[0];
  const newestPhoto = photos[photos.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: theme.transparent }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t(`progress.${type}`)}
        </Text>
        <View
          style={[
            styles.timeDifferenceChip,
            { backgroundColor: theme.primary },
          ]}
        >
          <Ionicons name="time-outline" size={16} color={theme.background} />
          <Text style={[styles.timeDifferenceChipText, { color: theme.background }]}>
            {getTimeDifference(oldestPhoto.date, newestPhoto.date, t)}
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.imageContainer,
          { backgroundColor: theme.cardBackground, borderColor: theme.primary },
        ]}
      >
        <Image
          source={{ uri: oldestPhoto.uri }}
          style={[styles.image, { opacity: (100 - sliderValue) / 100 }]}
        />
        <Image
          source={{ uri: newestPhoto.uri }}
          style={[
            styles.image,
            styles.overlayImage,
            { opacity: sliderValue / 100 },
          ]}
        />
        <View style={styles.photoLabels}>
          <View style={[styles.photoLabel, { opacity: (100 - sliderValue) / 100 }]}>
            <Text style={styles.photoLabelText}>
              {new Date(oldestPhoto.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
          <View style={[styles.photoLabel, { opacity: sliderValue / 100 }]}>
            <Text style={styles.photoLabelText}>
              {new Date(newestPhoto.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.extractButton, { backgroundColor: theme.primary }]}
          onPress={extractPhoto}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={20} color={theme.background} />
        </TouchableOpacity>
      </View>
      <View style={styles.sliderWrapper}>
        <View style={styles.sliderContainer} {...panResponder.panHandlers}>
          <View
            style={[styles.sliderTrack, { backgroundColor: theme.text + '20' }]}
          />
          <View
            style={[
              styles.sliderProgress,
              {
                backgroundColor: theme.primary,
                width: `${sliderValue}%`
              }
            ]}
          />
          <Animated.View
            style={[
              styles.sliderThumb,
              {
                backgroundColor: theme.background,
                borderColor: theme.primary,
                transform: [{ translateX: pan.x }],
              },
            ]}
          >
            <View style={[styles.sliderThumbInner, { backgroundColor: theme.primary }]} />
          </Animated.View>
        </View>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: theme.text }]}>Before</Text>
          <Text style={[styles.sliderLabel, { color: theme.text }]}>After</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timeDifferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timeDifferenceChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  singlePhotoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  singlePhotoChipText: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
  },
  singlePhotoHint: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 12,
  },
  noPhotosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    padding: 20,
  },
  noPhotosText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
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
  photoLabels: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  photoLabelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  sliderWrapper: {
    marginTop: 8,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 44,
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
    position: "relative",
  },
  sliderTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    position: "absolute",
  },
  sliderProgress: {
    height: 6,
    borderRadius: 3,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "absolute",
    top: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderThumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: (width - SLIDER_WIDTH) / 2,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
  },
  extractButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default PhotoMorph;
