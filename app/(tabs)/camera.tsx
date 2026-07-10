import { Button } from "@/components/ui";
import Colors, { overlayOpacity, withOpacity } from "@/constants/Colors";
import {
  borderRadius,
  opacity as designOpacity,
  elevation,
  iconSize,
  spacing,
  touchTarget,
  typography,
} from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { PhotoType } from "@/enums/Photos";
import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
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

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [zoom, setZoom] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<PhotoType>(PhotoType.front);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [importedPhotoDate, setImportedPhotoDate] = useState<string | null>(null);
  const router = useRouter();
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { addPhoto } = usePhotos();
  const { t } = useLocalization();
  const { canAddPhoto, featureUsage, isPremium } = useUser();

  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [showCamera, setShowCamera] = useState(true); // for unmount/remount


  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(3);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Check photo limit
  const photoLimitStatus = canAddPhoto();
  const isPhotoLimitReached = !photoLimitStatus.allowed;

  // Handle navigation focus/blur to properly manage camera resources
  useFocusEffect(
    useCallback(() => {
      console.log('Camera screen focused - reinitializing camera');
      setIsFocused(true);
      setIsCameraReady(false);
      setShowCamera(true);
      setCameraKey(prev => prev + 1);

      return () => {
        console.log('Camera screen blurred - releasing camera resources');
        setIsFocused(false);
        setIsCameraReady(false);
        setShowCamera(false);
        // Cancel any running timer when leaving the screen
        setIsTimerRunning(false);
        setRemainingTime(0);
      };
    }, [])
  );
  // Unmount and remount CameraView on facing change to release resource
  useEffect(() => {
    setShowCamera(false);
    const timeout = setTimeout(() => {
      setCameraKey(prev => prev + 1);
      setShowCamera(true);
    }, 200); // 200ms to ensure unmount
    return () => clearTimeout(timeout);
  }, [facing]);

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

  
  // Removed unnecessary useEffect on [facing] that set isCameraReady to false.

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
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

  
  const forceRefreshCamera = () => {
    setIsCameraReady(false);
    setCameraKey(prev => prev + 1);
    setTimeout(() => {
      setIsCameraReady(true);
    }, 1500);
  };

  const toggleFlash = () => {
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const zoomIn = () => {
    setZoom((current) => Math.min(current + 0.1, 1));
  };

  const zoomOut = () => {
    setZoom((current) => Math.max(current - 0.1, 0));
  };

  const takePicture = async () => {
    if (!cameraRef.current) {
      console.log("Camera ref not available");
      return;
    }

    if (!isCameraReady) {
      console.log("Camera is not ready yet, please wait...");
      return;
    }

    // Check photo limit before taking picture
    if (isPhotoLimitReached) {
      console.log("Photo limit reached");
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        let manipulatedImage: { uri: string } = photo;

        if (facing === "front") {
          manipulatedImage = await manipulateAsync(
            photo.uri,
            [{ flip: FlipType.Horizontal }],
            { format: SaveFormat.JPEG }
          );
        }

        setCapturedImage(manipulatedImage.uri);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      
      setIsCameraReady(false);
      setTimeout(() => {
        setCameraKey(prev => prev + 1);
        setTimeout(() => setIsCameraReady(true), 500);
      }, 100);
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
    // Check photo limit before importing
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
              { color: overlay === type ? theme.background : theme.text },
            ]}
          >
            {t(`camera.${type}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTimerControls = () => (
    <View style={styles.timerControls}>
      <TouchableOpacity
        style={[
          styles.timerToggle,
          isTimerEnabled && { backgroundColor: theme.primary },
        ]}
        onPress={toggleTimer}
      >
        <Ionicons
          name={isTimerEnabled ? "timer" : "timer-outline"}
          size={24}
          color={isTimerEnabled ? theme.background : theme.text}
        />
      </TouchableOpacity>
      {isTimerEnabled && (
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
      )}
    </View>
  );

  if (capturedImage) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />

        {/* Photo Type Badge */}
        <View style={styles.photoTypeBadgeContainer}>
          <View
            style={[
              styles.photoTypeBadge,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons
              name={
                overlay === PhotoType.front ? "body-outline" :
                overlay === PhotoType.side ? "arrow-forward-outline" :
                "person-outline"
              }
              size={20}
              color="white"
            />
            <Text style={styles.photoTypeBadgeText}>
              {t(`camera.${overlay}`).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.confirmationButtonsContainer}>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={retakePicture}
              activeOpacity={0.8}
            >
              <View style={[styles.actionButtonCircle, { backgroundColor: theme.cardBackground, borderColor: theme.error }]}>
                <Ionicons
                  name="refresh-outline"
                  size={32}
                  color={theme.error}
                />
              </View>
              <View style={styles.actionButtonLabelContainer}>
                <Text style={styles.actionButtonLabel}>
                  {t("camera.retake") || "Retake"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={confirmPicture}
              activeOpacity={0.8}
            >
              <View style={[styles.actionButtonCircle, { backgroundColor: theme.success }]}>
                <Ionicons name="checkmark" size={36} color="white" />
              </View>
              <View style={styles.actionButtonLabelContainer}>
                <Text style={styles.actionButtonLabel}>
                  {t("camera.confirm") || "Confirm"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Optional helper text */}
          <Text style={[styles.helperText, { color: theme.text }]}>
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
      {permission.granted && isFocused && showCamera && (
        <>
          <CameraView
            key={`camera-${facing}-${cameraKey}`}
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
            zoom={zoom}
            onCameraReady={() => {
              console.log('Camera ready');
              setIsCameraReady(true);
            }}
            onMountError={(error) => {
              console.error('Camera mount error:', error);
              setIsCameraReady(false);
              setTimeout(() => {
                setCameraKey(prev => prev + 1);
              }, 1000);
            }}
          >
            {renderSilhouette()}
          </CameraView>
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
      <View style={styles.overlayContainer}>
        {renderOverlaySelector()}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Ionicons
              name={flash === "on" ? "flash" : "flash-off"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
            <Ionicons name="add-circle-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
            <Ionicons name="remove-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        {renderTimerControls()}
        <View style={styles.bottomControlsContainer}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse-outline" size={32} color="white" />
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
  controlsContainer: {
    position: "absolute",
    top: 50,
    right: spacing.xl,
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  bottomControlsContainer: {
    position: "absolute",
    bottom: spacing.huge,
    left: 0,
    right: 0,
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
  preview: {
    flex: 1,
    width: "100%",
    height: "100%",
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
    padding: spacing.md,
    marginRight: spacing.md,
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    borderRadius: borderRadius.xl,
  },
  activeOverlayButton: {
    backgroundColor: withOpacity('#ffffff', overlayOpacity.light),
  },
  overlayButtonText: {
    color: "white",
    ...typography.captionBold,
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
  photoTypeBadgeContainer: {
    position: "absolute",
    top: spacing.huge + spacing.xl, // 60px - positioned below status bar
    left: 0,
    right: 0,
    alignItems: "center",
  },
  photoTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
    ...elevation.lg,
  },
  photoTypeBadgeText: {
    color: "white",
    ...typography.body,
    fontWeight: "700",
    letterSpacing: 1,
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
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    gap: spacing.huge + spacing.xl, // 60px - space between action buttons
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: "column",
    alignItems: "center",
    gap: spacing.md,
  },
  actionButtonCircle: {
    width: touchTarget.xlarge + spacing.lg, // 80px - large action buttons
    height: touchTarget.xlarge + spacing.lg,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    ...elevation.lg,
    borderWidth: 3,
    borderColor: "transparent",
  },
  actionButtonLabelContainer: {
    backgroundColor: withOpacity('#000000', overlayOpacity.heavy),
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  actionButtonLabel: {
    ...typography.body,
    fontWeight: "700",
    textAlign: "center",
    color: "white",
  },
  helperText: {
    ...typography.small,
    opacity: designOpacity.secondary,
    textAlign: "center",
    fontStyle: "italic",
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
  timerControls: {
    position: "absolute",
    top: 100,
    left: spacing.xl,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  timerToggle: {
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    marginBottom: spacing.md,
  },
  timerDurationContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  timerButton: {
    padding: spacing.md,
    marginBottom: spacing.md,
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
