import React from "react";
import { View, Image, Text, StyleSheet, Dimensions } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { Photo } from "@/services/photoStorage";
import { PhotoType } from "@/enums/Photos";

interface BeforeAfterComparisonProps {
  beforePhoto: Photo | null;
  afterPhoto: Photo | null;
  type: PhotoType;
}

const { width } = Dimensions.get("window");
const photoWidth = (width - 60) / 2; // Subtracting padding and gap

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  beforePhoto,
  afterPhoto,
  type,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { t } = useLocalization();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>
        {t(`progress.${type}`)}
      </Text>
      <View style={styles.photoContainer}>
        <View style={styles.photoWrapper}>
          {beforePhoto ? (
            <Image source={{ uri: beforePhoto.uri }} style={styles.photo} />
          ) : (
            <View
              style={[
                styles.placeholderPhoto,
                { backgroundColor: theme.cardBackground },
              ]}
            />
          )}
          <Text style={[styles.label, { color: theme.text }]}>
            {t("progress.before")}
          </Text>
        </View>
        <View style={styles.photoWrapper}>
          {afterPhoto ? (
            <Image source={{ uri: afterPhoto.uri }} style={styles.photo} />
          ) : (
            <View
              style={[
                styles.placeholderPhoto,
                { backgroundColor: theme.cardBackground },
              ]}
            />
          )}
          <Text style={[styles.label, { color: theme.text }]}>
            {t("progress.after")}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  photoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoWrapper: {
    alignItems: "center",
  },
  photo: {
    width: photoWidth,
    height: photoWidth,
    borderRadius: 10,
  },
  placeholderPhoto: {
    width: photoWidth,
    height: photoWidth,
    borderRadius: 10,
  },
  label: {
    marginTop: 5,
    fontSize: 14,
  },
});
