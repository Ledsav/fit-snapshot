import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { PhotoType } from "@/enums/Photos";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Photo } from "@/services/photoStorage";
import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import {
  spacing,
  borderRadius,
  typography,
} from "@/constants/DesignSystem";

interface BeforeAfterComparisonProps {
  beforePhoto: Photo | null;
  afterPhoto: Photo | null;
  type: PhotoType;
}

const { width } = Dimensions.get("window");
const photoWidth = (width - 60) / 2; 

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
            {t("common.before")}
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
            {t("common.after")}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h4,
    marginBottom: spacing.md,
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
    borderRadius: borderRadius.md,
  },
  placeholderPhoto: {
    width: photoWidth,
    height: photoWidth,
    borderRadius: borderRadius.md,
  },
  label: {
    marginTop: spacing.xs,
    ...typography.caption,
  },
});
