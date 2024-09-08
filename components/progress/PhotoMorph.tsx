import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Photo, getPhotosByType } from "@/services/photoStorage";
import { useFocusEffect } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";

interface PhotoMorphProps {
  type: "front" | "side" | "back";
  photo: Photo | undefined; // add this line
}
const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width * 0.8;

const PhotoMorph: React.FC<PhotoMorphProps> = ({ type }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const pan = new Animated.ValueXY();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      let newX = gesture.moveX - width * 0.1; // Adjust for container padding
      newX = Math.max(0, Math.min(newX, SLIDER_WIDTH));
      pan.x.setValue(newX);
      setSliderValue((newX / SLIDER_WIDTH) * 100);
    },
  });

  const loadPhotos = useCallback(async () => {
    try {
      const loadedPhotos = await getPhotosByType(type);
      setPhotos(loadedPhotos);
    } catch (err) {
      console.error(`Error loading photos for ${type} view:`, err);
    }
  }, [type]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos])
  );

  if (photos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {type.charAt(0).toUpperCase() + type.slice(1)} View
        </Text>
        <View
          style={[
            styles.noPhotosContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Ionicons
            name="image-outline"
            size={48}
            color={theme.tabIconDefault}
          />
          <Text style={[styles.noPhotosText, { color: theme.text }]}>
            No photos available for {type} view
          </Text>
        </View>
      </View>
    );
  }

  if (photos.length === 1) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {type.charAt(0).toUpperCase() + type.slice(1)} View
        </Text>
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Image source={{ uri: photos[0].uri }} style={styles.image} />
        </View>
      </View>
    );
  }

  const oldestPhoto = photos[0];
  const newestPhoto = photos[photos.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {type.charAt(0).toUpperCase() + type.slice(1)} View Progress
      </Text>
      <View
        style={[
          styles.imageContainer,
          { backgroundColor: theme.cardBackground },
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
      </View>
      <View style={styles.sliderContainer} {...panResponder.panHandlers}>
        <View
          style={[styles.sliderTrack, { backgroundColor: theme.secondary }]}
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
      <Text style={[styles.instructionText, { color: theme.tabIconDefault }]}>
        Slide to compare oldest and newest photos
      </Text>
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
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 10,
  },
});

export default PhotoMorph;
