import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FullScreenPhotoModalProps {
  isVisible: boolean;
  photoUri: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get("window");

export const FullScreenPhotoModal: React.FC<FullScreenPhotoModalProps> = ({
  isVisible,
  photoUri,
  onClose,
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
});
