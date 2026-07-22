import { useLocalization } from "@/context/LocalizationContext";
import { Photo } from "@/services/photoStorage";
import { getBestComparisonPair } from "@/utils/photoUtils";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { ContactSheetFrame } from "./ContactSheetFrame";
import { BeforeAfterSlider } from "@/components/progress/BeforeAfterSlider";

type MiniComparisonPreviewProps = {
  photos: Photo[];
};

// The screen's thesis: the before/after photos themselves, framed like
// negatives on a light table. Uses the shared BeforeAfterSlider so Home and
// Progress render the exact same comparison interaction.
export const MiniComparisonPreview: React.FC<MiniComparisonPreviewProps> = ({ photos }) => {
  const { t } = useLocalization();
  const router = useRouter();

  const comparisonPair = getBestComparisonPair(photos);
  if (!comparisonPair) {
    return null;
  }

  const { type, oldest: oldestPhoto, newest: newestPhoto } = comparisonPair;
  const caption = `${new Date(oldestPhoto.date).toLocaleDateString()} → ${new Date(newestPhoto.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`;

  return (
    <TouchableOpacity onPress={() => router.push("/(tabs)/progress")} activeOpacity={0.95}>
      <ContactSheetFrame caption={caption}>
        <BeforeAfterSlider
          beforeUri={oldestPhoto.uri}
          afterUri={newestPhoto.uri}
          beforeLabel={t("common.before")}
          afterLabel={t("common.after")}
        />
      </ContactSheetFrame>
    </TouchableOpacity>
  );
};
