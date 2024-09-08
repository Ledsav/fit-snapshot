import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { Photo } from "@/services/photoStorage";

interface LatestPhotoCardProps {
  latestPhoto: Photo | null;
  onPress: () => void;
}

export const LatestPhotoCard: React.FC<LatestPhotoCardProps> = ({
  latestPhoto,
  onPress = () => {},
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  return (
    <TouchableOpacity
      style={[
        styles.latestPhotoCard,
        { backgroundColor: theme.cardBackground },
      ]}
      onPress={onPress}
    >
      {latestPhoto ? (
        <ImageBackground
          source={{ uri: latestPhoto.uri }}
          style={styles.latestPhotoImage}
          imageStyle={{ borderRadius: 15 }}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.latestPhotoGradient}
          >
            <Text style={styles.latestPhotoText}>Latest Photo</Text>
            <Text style={styles.latestPhotoDate}>
              {new Date(latestPhoto.date).toLocaleDateString()}
            </Text>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <View style={styles.noPhotoPlaceholder}>
          <Ionicons
            name="image-outline"
            size={48}
            color={theme.tabIconDefault}
          />
          <Text style={[styles.noPhotoText, { color: theme.text }]}>
            No photos yet
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  latestPhotoCard: {
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 20,
    height: 200,
  },
  latestPhotoImage: {
    width: "100%",
    height: "100%",
  },
  latestPhotoGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 15,
  },
  latestPhotoText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  latestPhotoDate: {
    color: "white",
    fontSize: 14,
  },
  noPhotoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPhotoText: {
    marginTop: 10,
    fontSize: 16,
  },
});
