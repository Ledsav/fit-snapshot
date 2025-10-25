import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { PhotoType } from "@/enums/Photos";
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
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { addPhoto } = usePhotos();
  const { t } = useLocalization();

  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0); 

  
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

  
  useEffect(() => {
    
    setIsCameraReady(false);

    
    const timer = setTimeout(() => {
      
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
      router.push("(tabs)/gallery" as Href<string>);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setImportedPhotoDate(null);
  };

  const pickImage = async () => {
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
  photoTypeBadgeContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  photoTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  photoTypeBadgeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  confirmationButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    gap: 60,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  actionButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "transparent",
  },
  actionButtonLabelContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "white",
  },
  helperText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: "center",
    fontStyle: "italic",
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
