import { PhotoCropStage, PhotoCropStageHandle } from "@/components/camera/PhotoCropStage";
import { Button } from "@/components/ui";
import Colors from "@/constants/Colors";
import { borderRadius, spacing } from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { PhotoType } from "@/enums/Photos";
import { GhostOverlayStore } from "@/services/ghostOverlayStore";
import { PendingCropResult } from "@/services/pendingCropStore";
import { parsePhotoDateString } from "@/utils/photoDate";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function PhotoCropScreen() {
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    type: string;
    date?: string;
  }>();
  const router = useRouter();
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const { getPhotosByType } = usePhotos();
  const stageRef = useRef<PhotoCropStageHandle>(null);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [date, setDate] = useState(() => parsePhotoDateString(params.date));
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const type = params.type as PhotoType;
  const imageWidth = Number(params.width);
  const imageHeight = Number(params.height);

  useEffect(() => {
    let cancelled = false;
    GhostOverlayStore.getEnabled().then((value) => {
      if (!cancelled) setGhostModeEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ghostPhoto = ghostModeEnabled ? getPhotosByType(type)[0] : undefined;

  const handleCancel = () => {
    PendingCropResult.clear();
    router.back();
  };

  const handleDateChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setIsDatePickerVisible(false);
    setDate((prev) => {
      const merged = new Date(prev);
      merged.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      return merged;
    });
  };

  const handleConfirm = async () => {
    if (!stageRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const cropRect = stageRef.current.getCropRect();
      const result = await manipulateAsync(
        params.uri,
        [{ crop: cropRect }],
        { format: SaveFormat.JPEG }
      );
      PendingCropResult.resolve(result.uri, date.toISOString());
      router.back();
    } catch (error) {
      console.error("Error cropping image:", error);
      router.back();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "black" }]}>
      <PhotoCropStage
        ref={stageRef}
        imageUri={params.uri}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        type={type}
        ghostPhoto={ghostPhoto}
      />
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setIsDatePickerVisible(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="white" />
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>{t("camera.cropHint")}</Text>
        <View style={styles.buttonsRow}>
          <Button
            title={t("common.cancel")}
            onPress={handleCancel}
            variant="danger"
            icon={<Ionicons name="close" size={18} color={theme.error} />}
            style={styles.button}
          />
          <Button
            title={t("camera.confirm")}
            onPress={handleConfirm}
            variant="primary"
            loading={isProcessing}
            icon={<Ionicons name="checkmark" size={18} color={theme.onAccent} />}
            style={styles.button}
          />
        </View>
      </View>
      {isDatePickerVisible && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={handleDateChange}
          onDismiss={() => setIsDatePickerVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    alignItems: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.round,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  dateText: {
    color: "white",
    fontWeight: "600",
  },
  hint: {
    color: "white",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
  },
});
