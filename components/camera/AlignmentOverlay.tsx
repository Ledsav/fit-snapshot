import { overlayOpacity } from "@/constants/Colors";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import React from "react";
import { Dimensions, Image, View } from "react-native";
import TorsoSilhouette from "@/images/TorsoSilhouette";

const { width, height } = Dimensions.get("window");

interface AlignmentOverlayProps {
  type: PhotoType;
  ghostPhoto?: Photo;
}

// Alignment guide shown over the live camera viewfinder and the import crop
// stage: either the generic body silhouette, or (ghost mode) the user's own
// first photo of this pose at very low opacity, so later shots can be lined
// up against their actual framing instead of a generic shape.
const AlignmentOverlay: React.FC<AlignmentOverlayProps> = ({ type, ghostPhoto }) => {
  if (!ghostPhoto) {
    return <TorsoSilhouette type={type} />;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={{ uri: ghostPhoto.uri }}
        style={{
          width: width * 0.8,
          height: height * 0.6,
          opacity: overlayOpacity.subtle,
          resizeMode: "contain",
        }}
      />
    </View>
  );
};

export default AlignmentOverlay;
