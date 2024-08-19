import React, { useState, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { manipulateAsync, FlipType, SaveFormat } from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { savePhoto, Photo } from "../../services/photoStorage";
import { useRouter, Href } from "expo-router";

type OverlayType = "front" | "side" | "back";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [zoom, setZoom] = useState(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<OverlayType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

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
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
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
      } else {
        console.error("Unable to take picture");
      }
    }
  };
  const confirmPicture = async () => {
    if (capturedImage) {
      const newPhoto: Photo = {
        id: Date.now().toString(),
        uri: capturedImage,
        date: new Date().toISOString(),
        type: overlay,
      };
      await savePhoto(newPhoto);
      setCapturedImage(null);
      router.push("(tabs)/gallery" as Href<string>);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const renderOverlaySelector = () => (
    <View style={styles.overlaySelector}>
      {["front", "side", "back"].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.overlayButton,
            overlay === type && styles.activeOverlayButton,
          ]}
          onPress={() => setOverlay(type as OverlayType)}
        >
          <Text style={styles.overlayButtonText}>{type}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        <View style={styles.overlayText}>
          <Text style={styles.overlayTextContent}>{overlay}</Text>
        </View>
        <View style={styles.confirmationButtons}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmPicture}
          >
            <Ionicons name="checkmark" size={32} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
            <Ionicons name="refresh-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        zoom={zoom}
      >
        {renderOverlaySelector()}
        <View style={styles.overlayText}>
          <Text style={styles.overlayTextContent}>{overlay}</Text>
        </View>
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
        <View style={styles.bottomControlsContainer}>
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraFacing}
          >
            <Ionicons name="camera-reverse-outline" size={32} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={() => router.push("(tabs)/gallery" as Href<string>)}
          >
            <Ionicons name="images-outline" size={32} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  message: {
    color: "white",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  camera: {
    flex: 1,
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
  },
  flipButton: {
    alignSelf: "center",
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
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
  galleryButton: {
    alignSelf: "center",
  },
});
