import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Photo } from "@/services/photoStorage";

interface FullScreenPhotoModalProps {
  isVisible: boolean;
  photoUri: string;
  onClose: () => void;
  /** Present for real gallery photos; absent for GIFs, which reuse this modal. */
  photo?: Photo;
  onEdit?: (photo: Photo) => void;
  onSetReferenceLuminance?: (photo: Photo) => void;
  isComputingLuminance?: boolean;
}

const { width, height } = Dimensions.get("window");

export const FullScreenPhotoModal: React.FC<FullScreenPhotoModalProps> = ({
  isVisible,
  photoUri,
  onClose,
  photo,
  onEdit,
  onSetReferenceLuminance,
  isComputingLuminance = false,
}) => {
  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photoUri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
        {photo && (
          <View style={styles.actionButtons}>
            {onEdit && (
              <TouchableOpacity
                testID="fullscreen-photo-edit-button"
                style={styles.actionButton}
                onPress={() => onEdit(photo)}
                disabled={isComputingLuminance}
              >
                <Ionicons name="crop-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            {onSetReferenceLuminance && (
              <TouchableOpacity
                testID="fullscreen-photo-reference-luminance-button"
                style={styles.actionButton}
                onPress={() => onSetReferenceLuminance(photo)}
                disabled={isComputingLuminance}
              >
                {isComputingLuminance ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="sunny-outline" size={24} color="white" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: width,
    height: height,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  actionButtons: {
    position: "absolute",
    top: 40,
    left: 20,
    flexDirection: "row",
    gap: 16,
    zIndex: 1,
  },
  actionButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
