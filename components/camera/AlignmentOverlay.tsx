import { overlayOpacity } from "@/constants/Colors";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import React from "react";
import { Image, View } from "react-native";
import TorsoSilhouette from "@/images/TorsoSilhouette";

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
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      <Image
        source={{ uri: ghostPhoto.uri }}
        style={{
          width: "100%",
          height: "100%",
          opacity: overlayOpacity.subtle,
          resizeMode: "cover",
        }}
      />
    </View>
  );
};

export default AlignmentOverlay;
