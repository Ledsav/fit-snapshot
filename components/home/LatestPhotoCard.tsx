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
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import {
  spacing,
  borderRadius,
  typography,
  iconSize,
  elevation,
} from "@/constants/DesignSystem";

interface LatestPhotoCardProps {
  latestPhoto: Photo | null;
  onPress: () => void;
}

export const LatestPhotoCard: React.FC<LatestPhotoCardProps> = ({
  latestPhoto,
  onPress,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  if (!latestPhoto) return null;

  return (
    <TouchableOpacity
      style={[
        styles.latestPhotoCard,
        { backgroundColor: theme.cardBackground },
        elevation.md,
      ]}
      onPress={onPress}
    >
      {latestPhoto ? (
        <ImageBackground
          source={{ uri: latestPhoto.uri }}
          style={styles.latestPhotoImage}
          imageStyle={{ borderRadius: borderRadius.lg }}
        >
          <LinearGradient
            colors={["transparent", withOpacity('#000000', overlayOpacity.veryHeavy)]}
            style={styles.latestPhotoGradient}
          >
            <Text style={styles.latestPhotoText}>
              {t(`camera.${latestPhoto.type}`)}
            </Text>
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
            {t("latestPhotoCard.noPhotos")}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  latestPhotoCard: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.xl,
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
    padding: spacing.lg,
  },
  latestPhotoText: {
    color: "white",
    ...typography.h4,
  },
  latestPhotoDate: {
    color: "white",
    ...typography.caption,
  },
  noPhotoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noPhotoText: {
    marginTop: spacing.md,
    ...typography.body,
  },
});
