import { ContactSheetFrame } from "@/components/home/ContactSheetFrame";
import { LightingIndicator } from "@/components/camera/LightingIndicator";
import { Button } from "@/components/ui";
import Colors, { overlayOpacity, withOpacity } from "@/constants/Colors";
import {
  borderRadius,
  opacity as designOpacity,
  elevation,
  fontFamily,
  iconSize,
  preciseType,
  spacing,
  touchTarget,
  typography,
} from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { PhotoType } from "@/enums/Photos";
import { LightingBaselineStore } from "@/services/lightingBaselineStore";
import { useLightingIndicator } from "@/hooks/useLightingIndicator";
import { Ionicons } from "@expo/vector-icons";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from "react-native-vision-camera";
import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import TorsoSilhouette from "../../images/TorsoSilhouette";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const aspectRatio = 4 / 3;
const cameraHeight = screenWidth * aspectRatio;

type Facing = "back" | "front";

export default function CameraScreen() {
  const [facing, setFacing] = useState<Facing>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedLuma, setCapturedLuma] = useState(0);
  // True when the pending capturedImage came from the gallery (import), not the
  // camera — imported photos have no live luminance reading to store.
  const [isImported, setIsImported] = useState(false);
  const [overlay, setOverlay] = useState<PhotoType>(PhotoType.front);
  const [override, setOverride] = useState<number | null>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice(facing);
  const [importedPhotoDate, setImportedPhotoDate] = useState<string | null>(null);
  const router = useRouter();
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { photos, addPhoto } = usePhotos();
  const { t } = useLocalization();
  const { canAddPhoto, featureUsage, isPremium } = useUser();

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isFocused, setIsFocused] = useState(true);

  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(3);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Camera outputs (vision-camera V5). The <Camera> view renders its own
  // preview, so we only add the photo + frame (lighting) outputs — adding an
  // explicit preview output too would bind a 2nd Preview use case and Android
  // CameraX rejects the surface combination.
  const photoOutput = usePhotoOutput({ qualityPrioritization: "quality" });
  const { frameOutput, state: lightingState, currentLuma } = useLightingIndicator({
    photos,
    type: overlay,
    override,
  });

  // Check photo limit
  const photoLimitStatus = canAddPhoto();
  const isPhotoLimitReached = !photoLimitStatus.allowed;

  // Load the per-pose recalibration override whenever the pose changes.
  useEffect(() => {
    let cancelled = false;
    LightingBaselineStore.getOverride(overlay).then((value) => {
      if (!cancelled) setOverride(value);
    });
    return () => {
      cancelled = true;
    };
  }, [overlay]);

  // Release the camera on blur, reacquire on focus (vision-camera `isActive`).
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        // Camera goes inactive on blur; force the ready gate closed so the
        // capture button can't fire before the refocused preview restarts.
        setIsCameraReady(false);
        setIsTimerRunning(false);
        setRemainingTime(0);
      };
    }, [])
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && remainingTime === 0) {
      takePicture();
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingTime]);

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.permissionContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.message, { color: theme.text }]}>
          {t("camera.permissionMessage")}
        </Text>
        <Button
          title={t("camera.grantPermission")}
          onPress={requestPermission}
          variant="primary"
          size="large"
        />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const handleRecalibrate = async () => {
    await LightingBaselineStore.setOverride(overlay, currentLuma);
    setOverride(currentLuma);
  };

  const takePicture = async () => {
    if (!isCameraReady) {
      console.log("Camera is not ready yet, please wait...");
      return;
    }
    if (isPhotoLimitReached) {
      console.log("Photo limit reached");
      return;
    }

    try {
      // Snapshot the live luminance at the moment of capture.
      const lumaAtCapture = currentLuma;
      const photoFile = await photoOutput.capturePhotoToFile({ flashMode: flash }, {});
      const rawUri = `file://${photoFile.filePath}`;

      let finalUri = rawUri;
      if (facing === "front") {
        const manipulated = await manipulateAsync(
          rawUri,
          [{ flip: FlipType.Horizontal }],
          { format: SaveFormat.JPEG }
        );
        finalUri = manipulated.uri;
      }

      setCapturedLuma(lumaAtCapture);
      setIsImported(false);
      setCapturedImage(finalUri);
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  const startTimer = () => {
    setRemainingTime(timerDuration);
    setIsTimerRunning(true);
  };

  const cancelTimer = () => {
    setIsTimerRunning(false);
    setRemainingTime(0);
  };

  const toggleTimer = () => {
    setIsTimerEnabled(!isTimerEnabled);
  };

  const confirmPicture = async () => {
    if (capturedImage) {
      let photoDate = new Date().toISOString();

      if (importedPhotoDate) {
        try {
          const dateStr = importedPhotoDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            photoDate = parsedDate.toISOString();
          }
        } catch (error) {
          console.error("Error parsing imported photo date:", error);
        }
      }

      const newPhoto = {
        id: Date.now().toString(),
        uri: capturedImage,
        date: photoDate,
        type: overlay,
        // Imported photos have no live reading; only camera captures carry one.
        luminance: isImported ? undefined : capturedLuma,
      };
      await addPhoto(newPhoto);
      setCapturedImage(null);
      setImportedPhotoDate(null);
      router.push("/(tabs)/gallery");
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setImportedPhotoDate(null);
  };

  const pickImage = async () => {
    if (isPhotoLimitReached) {
      alert(photoLimitStatus.reason || t("camera.photoLimitReached") || "Photo limit reached. Delete photos or upgrade to Premium.");
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert(t("camera.galleryPermissionDenied") || 'Sorry, we need media library permissions to import images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setIsImported(true);
        setCapturedImage(selectedAsset.uri);

        if (selectedAsset.exif?.DateTimeOriginal) {
          setImportedPhotoDate(selectedAsset.exif.DateTimeOriginal);
        } else {
          setImportedPhotoDate(null);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };

  const renderSilhouette = () => (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <TorsoSilhouette type={overlay} />
    </View>
  );

  const renderOverlaySelector = () => (
    <View style={styles.overlaySelector}>
      {["front", "side", "back"].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.overlayButton,
            overlay === type && [
              styles.activeOverlayButton,
              { backgroundColor: theme.primary },
            ],
          ]}
          onPress={() => setOverlay(type as PhotoType)}
        >
          <Text
            style={[
              styles.overlayButtonText,
              preciseType.badgeLabel,
              { color: overlay === type ? theme.background : theme.text },
            ]}
          >
            {t(`camera.${type}`).toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTimerDurationRow = () =>
    isTimerEnabled && (
      <View style={styles.timerDurationContainer}>
        {[3, 5, 10].map((duration) => (
          <TouchableOpacity
            key={duration}
            style={[
              styles.timerButton,
              timerDuration === duration && {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setTimerDuration(duration)}
          >
            <Text style={styles.timerButtonText}>{duration}s</Text>
          </TouchableOpacity>
        ))}
      </View>
    );

  if (capturedImage) {
    const confirmCaption = `${t(`camera.${overlay}`).toUpperCase()} · ${new Date().toLocaleDateString()}`;

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.confirmFrameContainer}>
          <ContactSheetFrame caption={confirmCaption}>
            <Image source={{ uri: capturedImage }} style={styles.preview} />
          </ContactSheetFrame>
        </View>

        <View style={styles.confirmationButtonsContainer}>
          <View style={styles.confirmationButtons}>
            <Button
              title={t("camera.retake") || "Retake"}
              onPress={retakePicture}
              variant="danger"
              icon={<Ionicons name="refresh-outline" size={18} color={theme.error} />}
              style={styles.confirmBtn}
            />
            <Button
              title={t("camera.confirm") || "Confirm"}
              onPress={confirmPicture}
              variant="primary"
              icon={<Ionicons name="checkmark" size={18} color={theme.background} />}
              style={styles.confirmBtn}
            />
          </View>

          <Text style={[styles.helperText, { color: theme.secondary }]}>
            {t("camera.confirmHelper") || "Review your photo before saving"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar style="light" />
      <View style={styles.container}>
        {device != null && (
          <>
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isFocused}
              outputs={[photoOutput, frameOutput]}
              enableNativeZoomGesture={true}
              onPreviewStarted={() => setIsCameraReady(true)}
              onPreviewStopped={() => setIsCameraReady(false)}
            />
            {renderSilhouette()}
            {!isCameraReady && (
              <View
                style={[
                  styles.loadingContainer,
                  { backgroundColor: theme.background },
                ]}
              >
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}
          </>
        )}
        {device == null && (
          <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.message, { color: theme.text }]}>
              {t("camera.permissionMessage")}
            </Text>
          </View>
        )}
        <View style={styles.overlayContainer}>
          {renderOverlaySelector()}
          {isCameraReady && (
            <View style={styles.lightingIndicatorWrapper} pointerEvents="box-none">
              <LightingIndicator state={lightingState} onRecalibrate={handleRecalibrate} />
            </View>
          )}
          <View style={styles.bottomBarWrapper}>
            {renderTimerDurationRow()}
            <View style={styles.bottomControlsContainer}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
                <Ionicons
                  name={flash === "on" ? "flash" : "flash-off"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={toggleTimer}>
                <Ionicons
                  name={isTimerEnabled ? "timer" : "timer-outline"}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>
              {isTimerRunning ? (
                <View style={styles.timerRunningContainer}>
                  <Text style={styles.timerText}>{remainingTime}</Text>
                  <TouchableOpacity
                    style={[
                      styles.cancelTimerButton,
                      { backgroundColor: theme.error },
                    ]}
                    onPress={cancelTimer}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    {
                      backgroundColor: isPhotoLimitReached ? theme.error : theme.primary,
                      opacity: (isCameraReady && !isPhotoLimitReached) ? 1 : 0.5
                    }
                  ]}
                  onPress={isTimerEnabled ? startTimer : takePicture}
                  disabled={!isCameraReady || isPhotoLimitReached}
                >
                  <View
                    style={[
                      styles.captureButtonInner,
                      { backgroundColor: isPhotoLimitReached ? theme.error : "white" },
                    ]}
                  />
                  {isPhotoLimitReached && (
                    <View style={styles.limitBadge}>
                      <Ionicons name="lock-closed" size={24} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse-outline" size={32} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.importButton,
                  isPhotoLimitReached && styles.disabledButton
                ]}
                onPress={pickImage}
                disabled={isPhotoLimitReached}
              >
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={isPhotoLimitReached ? "rgba(255, 255, 255, 0.3)" : "white"}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Photo Limit Warning Banner */}
      {isPhotoLimitReached && (
        <View style={[styles.limitWarningBanner, { backgroundColor: theme.error }]}>
          <Ionicons name="warning" size={24} color="white" />
          <View style={styles.limitWarningTextContainer}>
            <Text style={styles.limitWarningTitle}>
              {t("camera.photoLimitReached")}
            </Text>
            <Text style={styles.limitWarningMessage}>
              {t("camera.photoLimitMessage")}
            </Text>
          </View>
        </View>
      )}

      {/* Photo Counter for Free Users */}
      {!isPremium && !isPhotoLimitReached && photoLimitStatus.limit && (
        <View style={[styles.photoCounterBanner, { backgroundColor: withOpacity('#000000', overlayOpacity.heavy) }]}>
          <Text style={styles.photoCounterText}>
            {featureUsage.photoCount} / {photoLimitStatus.limit} {t("camera.photosUsed")}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...typography.h4,
  },
  message: {
    ...typography.body,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
  },
  cameraContainer: {
    width: screenWidth,
    height: cameraHeight,
    overflow: "hidden",
  },
  camera: {
    width: screenWidth,
    height: cameraHeight,
  },
  lightingIndicatorWrapper: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomBarWrapper: {
    position: "absolute",
    bottom: spacing.huge,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bottomControlsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlButton: {
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },
  flipButton: {
    alignSelf: "center",
    padding: spacing.md,
  },
  captureButton: {
    width: 70, // Intentionally 70 for camera UX - slightly larger than standard touch target
    height: 70,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: touchTarget.large + 4, // 60px - visual ring inside capture button
    height: touchTarget.large + 4,
    borderRadius: borderRadius.round,
    backgroundColor: "white",
  },
  placeholderButton: {
    width: iconSize.lg,
    height: iconSize.lg,
  },
  confirmFrameContainer: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  preview: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  captureButtonContainer: {
    position: "absolute",
    bottom: spacing.huge,
    alignSelf: "center",
  },
  overlaySelector: {
    position: "absolute",
    top: 50,
    left: spacing.xl,
    flexDirection: "row",
  },
  overlayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    borderRadius: borderRadius.round,
  },
  activeOverlayButton: {
    backgroundColor: withOpacity('#ffffff', overlayOpacity.light),
  },
  overlayButtonText: {
    color: "white",
    fontFamily: fontFamily.mono,
  },
  overlayText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  overlayTextContent: {
    color: "white",
    ...typography.h2,
  },
  confirmationButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.huge,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  confirmBtn: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: fontFamily.body,
  },
  importButton: {
    alignSelf: "center",
    padding: spacing.md,
  },
  silhouette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  timerDurationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  timerButton: {
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.xl,
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    width: touchTarget.comfortable + 2, // 50px - timer button width
    alignItems: "center",
  },
  timerButtonText: {
    color: "white",
    ...typography.captionBold,
  },
  timerRunningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    borderRadius: borderRadius.xxxl,
    padding: spacing.md,
  },
  timerText: {
    ...typography.h2,
    color: "white",
    marginRight: spacing.md,
  },
  cancelTimerButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  refreshButton: {
    backgroundColor: "white",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
  },
  refreshButtonText: {
    color: "black",
    ...typography.bodyBold,
    textAlign: "center" as const,
  },
  limitBadge: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: designOpacity.disabled,
  },
  limitWarningBanner: {
    position: "absolute",
    bottom: 140,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    ...elevation.lg,
  },
  limitWarningTextContainer: {
    flex: 1,
  },
  limitWarningTitle: {
    color: "white",
    ...typography.body,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  limitWarningMessage: {
    color: "white",
    ...typography.small,
    lineHeight: 18,
  },
  photoCounterBanner: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  photoCounterText: {
    color: "white",
    ...typography.caption,
    fontWeight: "600",
  },
});
