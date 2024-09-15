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

interface PhotoMorphProps {
  type: "front" | "side" | "back";
  photo: Photo | undefined;
  onRefresh: () => Promise<void>;
}

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width * 0.8;

const PhotoMorph: React.FC<PhotoMorphProps> = ({ type, photo, onRefresh }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { getPhotosByType } = usePhotos();

  const photos = getPhotosByType(type);

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
        Alert.alert(
          "Permission required",
          "Please grant permission to save photos."
        );
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

      Alert.alert("Success", "Photo saved to gallery in FitSnapshot album");
    } catch (error) {
      console.error("Error extracting photo:", error);
      Alert.alert("Error", "Failed to save photo. Please try again.");
    }
  }, [photos, sliderValue]);

  if (photos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
        <View
          style={[
            styles.noPhotosContainer,
            { backgroundColor: theme.transparent },
          ]}
        >
          <Ionicons name="image-outline" size={48} color={theme.text} />
          <Text style={[styles.noPhotosText, { color: theme.text }]}>
            No photos available for {type} view
          </Text>
        </View>
      </View>
    );
  }

  if (photos.length === 1) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: theme.transparent, borderColor: theme.primary },
          ]}
        >
          <Image source={{ uri: photos[0].uri }} style={styles.image} />
          <TouchableOpacity style={styles.extractButton} onPress={extractPhoto}>
            <Ionicons name="download-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const oldestPhoto = photos[0];
  const newestPhoto = photos[photos.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: theme.transparent }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
      <View
        style={[
          styles.imageContainer,
          { backgroundColor: theme.transparent, borderColor: theme.primary },
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
        <TouchableOpacity style={styles.extractButton} onPress={extractPhoto}>
          <Ionicons name="download-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      <View style={styles.sliderContainer} {...panResponder.panHandlers}>
        <View
          style={[styles.sliderTrack, { backgroundColor: theme.primary }]}
        />
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              backgroundColor: theme.primary,
              transform: [{ translateX: pan.x }],
            },
          ]}
        />
      </View>
      <Text style={[styles.instructionText, { color: theme.text }]}>
        Slide to compare oldest and newest photos
      </Text>
      <View
        style={[
          styles.timeDifferenceContainer,
          { backgroundColor: theme.primary },
        ]}
      >
        <Text style={[styles.timeDifferenceText, { color: theme.background }]}>
          {getTimeDifference(oldestPhoto.date, newestPhoto.date)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
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
    aspectRatio: 1,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 2,
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
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 40,
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  sliderTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: "absolute",
    top: 8,
  },
  instructionText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  timeDifferenceContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 20,
  },
  timeDifferenceText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  extractButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
});

export default PhotoMorph;
