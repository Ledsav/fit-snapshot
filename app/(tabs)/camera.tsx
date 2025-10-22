import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { PhotoType } from "@/enums/Photos";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from 'expo-image-picker';
import { Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { addPhoto } = usePhotos();
  const { t } = useLocalization();

  // New state for camera ready status
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0); // Force re-render key

  // Timer states
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(3);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
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

  // Camera initialization effect - only run when facing changes
  useEffect(() => {
    // Reset camera ready state when switching cameras
    setIsCameraReady(false);

    // Small delay to ensure proper cleanup before re-mount
    const timer = setTimeout(() => {
      // Camera will set isCameraReady to true via onCameraReady callback
    }, 100);

    return () => clearTimeout(timer);
  }, [facing]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.message, { color: theme.text }]}>
          {t("camera.permissionMessage")}
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.primary }]}
          onPress={requestPermission}
        >
          <Text
            style={[styles.permissionButtonText, { color: theme.background }]}
          >
            {t("camera.grantPermission")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  // Add force refresh function for black screen issues
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

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo) {
        let manipulatedImage = photo;

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
      // Reset camera state and try to recover
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
      // Parse EXIF date format (YYYY:MM:DD HH:MM:SS) to ISO string
      let photoDate = new Date().toISOString();

      if (importedPhotoDate) {
        try {
          // EXIF date format: "2024:01:15 14:30:45"
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
      router.push("(tabs)/gallery" as Href<string>);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setImportedPhotoDate(null);
  };

  const pickImage = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert(t("camera.galleryPermissionDenied") || 'Sorry, we need media library permissions to import images!');
        return;
      }

      // Launch image picker with exif data
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
        exif: true, // Include EXIF data to get original date
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setCapturedImage(selectedAsset.uri);

        // Store the original creation date if available
        if (selectedAsset.exif?.DateTimeOriginal) {
          // Store in state to use later when confirming
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
      <TorsoSilhouette />
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
        <View
          style={[
            styles.overlayText,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <Text style={[styles.overlayTextContent, { color: theme.text }]}>
            {t(`camera.${overlay}`)}
          </Text>
        </View>
        <View style={styles.confirmationButtons}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.success }]}
            onPress={confirmPicture}
          >
            <Ionicons name="checkmark" size={32} color={theme.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.retakeButton, { backgroundColor: theme.error }]}
            onPress={retakePicture}
          >
            <Ionicons
              name="refresh-outline"
              size={32}
              color={theme.background}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar style="light" />
      {permission.granted && (
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
              // Retry initialization
              setCameraKey(prev => prev + 1);
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
                  backgroundColor: theme.primary,
                  opacity: isCameraReady ? 1 : 0.5
                }
              ]}
              onPress={isTimerEnabled ? startTimer : takePicture}
              disabled={!isCameraReady}
            >
              <View
                style={[
                  styles.captureButtonInner,
                  { backgroundColor: "white" },
                ]}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.importButton}
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
  },
  message: {
    color: Colors.light.primary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
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
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 10,
  },
  bottomControlsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  controlButton: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 20,
  },
  flipButton: {
    alignSelf: "center",
    padding: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  placeholderButton: {
    width: 32,
    height: 32,
  },
  preview: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  captureButtonContainer: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
  },
  permissionButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  permissionButtonText: {
    color: "black",
    fontWeight: "bold",
  },
  overlaySelector: {
    position: "absolute",
    top: 50,
    left: 20,
    flexDirection: "row",
  },
  overlayButton: {
    padding: 10,
    marginRight: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  activeOverlayButton: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  overlayButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  overlayText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 10,
    borderRadius: 10,
  },
  overlayTextContent: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  confirmationButtons: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  confirmButton: {
    backgroundColor: "green",
    padding: 15,
    borderRadius: 30,
  },
  retakeButton: {
    backgroundColor: "red",
    padding: 15,
    borderRadius: 30,
  },
  importButton: {
    alignSelf: "center",
    padding: 10,
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
    left: 20,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  timerToggle: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    marginBottom: 10,
  },
  timerDurationContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  timerButton: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 50,
    alignItems: "center",
  },
  timerButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  timerRunningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    padding: 10,
  },
  timerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginRight: 10,
  },
  cancelTimerButton: {
    padding: 5,
    borderRadius: 15,
  },
  refreshButton: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  refreshButtonText: {
    color: "black",
    fontWeight: "bold",
    textAlign: "center" as const,
  },
});
