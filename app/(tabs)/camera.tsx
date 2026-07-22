import { ContactSheetFrame } from "@/components/home/ContactSheetFrame";
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
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
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

  // TEMP DIAGNOSTICS - remove once the cold-start camera hang is root-caused.
  const mountTsRef = useRef<number>(Date.now());
  const logCam = useCallback((msg: string) => {
    console.log(`[Camera +${Date.now() - mountTsRef.current}ms] ${msg}`);
  }, []);
  const isCameraReadyRef = useRef(false);
  useEffect(() => {
    isCameraReadyRef.current = isCameraReady;
  }, [isCameraReady]);
  const permissionGrantedRef = useRef(permission?.granted);
  const facingRef = useRef(facing);
  useEffect(() => {
    permissionGrantedRef.current = permission?.granted;
    facingRef.current = facing;
  }, [permission?.granted, facing]);

  // Check photo limit
  const photoLimitStatus = canAddPhoto();
  const isPhotoLimitReached = !photoLimitStatus.allowed;

  // Handle navigation focus/blur to properly manage camera resources.
  // React Navigation can fire a spurious focus -> blur -> focus sequence on
  // cold start (before the initial route settles). Reacting to that blur by
  // tearing down the CameraView mid-initialization races the native camera
  // hardware and can leave it hung, so `onCameraReady` never fires. Debounce
  // the teardown: a blur that's immediately followed by a refocus is treated
  // as a no-op instead of a real release/reacquire cycle.
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (blurTimeoutRef.current) {
        // Refocused before the pending teardown ran - cancel it and keep
        // the current camera instance instead of remounting it.
        clearTimeout(blurTimeoutRef.current);
        blurTimeoutRef.current = null;
        logCam('focus: cancelled pending teardown, keeping existing camera instance');
        setIsFocused(true);
      } else {
        logCam(`focus: reinitializing camera (permission=${permissionGrantedRef.current}, facing=${facingRef.current})`);
        setIsFocused(true);
        setIsCameraReady(false);
        setShowCamera(true);
        setCameraKey(prev => prev + 1);
      }

      return () => {
        logCam('blur: scheduling teardown in 300ms');
        blurTimeoutRef.current = setTimeout(() => {
          blurTimeoutRef.current = null;
          logCam('blur: releasing camera resources');
          setIsFocused(false);
          setIsCameraReady(false);
          setShowCamera(false);
          // Cancel any running timer when leaving the screen
          setIsTimerRunning(false);
          setRemainingTime(0);
        }, 300);
      };
    }, [logCam])
  );

  // TEMP DIAGNOSTICS - watchdog to see if onCameraReady simply never fires.
  useEffect(() => {
    if (!(isFocused && showCamera)) return;
    const keyAtArm = cameraKey;
    logCam(`watchdog armed for key=${keyAtArm} (cameraRef=${!!cameraRef.current})`);
    const watchdog = setTimeout(() => {
      logCam(
        `WATCHDOG: still not ready 4s after mount (key=${keyAtArm}, isCameraReady=${isCameraReadyRef.current}, cameraRef=${!!cameraRef.current}, permission=${permissionGrantedRef.current})`
      );
    }, 4000);
    return () => clearTimeout(watchdog);
  }, [isFocused, showCamera, cameraKey, logCam]);
  // Unmount and remount CameraView on facing change to release resource.
  // Effects fire on the initial mount too (there's no prior `facing` to
  // diff against), so without this guard this ran on every screen mount -
  // forcing an extra teardown/rebuild ~200ms into the focus effect's own
  // mount, racing the native camera while it was still acquiring hardware.
  const isInitialFacingRenderRef = useRef(true);
  useEffect(() => {
    if (isInitialFacingRenderRef.current) {
      isInitialFacingRenderRef.current = false;
      return;
    }
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

  const zoomShared = useSharedValue(zoom);
  const savedZoomShared = useSharedValue(zoom);

  useEffect(() => {
    zoomShared.value = zoom;
  }, [zoom]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedZoomShared.value = zoomShared.value;
    })
    .onUpdate((event) => {
      const newZoom = Math.min(
        1,
        Math.max(0, savedZoomShared.value + (event.scale - 1) * 0.5)
      );
      zoomShared.value = newZoom;
      runOnJS(setZoom)(newZoom);
    });

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
      <GestureDetector gesture={pinchGesture}>
        <View style={styles.container}>
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
                  logCam(`onCameraReady fired for key=${cameraKey}`);
                  setIsCameraReady(true);
                }}
                onMountError={(error) => {
                  logCam(`onMountError fired for key=${cameraKey}: ${JSON.stringify(error)}`);
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
        </View>
      </GestureDetector>

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
