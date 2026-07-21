import React from "react";
import { StyleSheet, TouchableOpacity, Image } from "react-native";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import { ContactSheetFrame } from "./ContactSheetFrame";

interface LatestPhotoCardProps {
  latestPhoto: Photo | null;
  onPress: () => void;
}

export const LatestPhotoCard: React.FC<LatestPhotoCardProps> = ({ latestPhoto, onPress }) => {
  const { t } = useLocalization();

  if (!latestPhoto) return null;

  const caption = `${t(`camera.${latestPhoto.type}`).toUpperCase()} · ${new Date(latestPhoto.date).toLocaleDateString()}`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <ContactSheetFrame caption={caption}>
        <Image source={{ uri: latestPhoto.uri }} style={styles.image} />
      </ContactSheetFrame>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 220,
  },
});
