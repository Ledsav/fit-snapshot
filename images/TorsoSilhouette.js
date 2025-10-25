import React from "react";
import { Dimensions, Image, View } from "react-native";

const { width, height } = Dimensions.get("window");

const TorsoSilhouette = ({ type = "front" }) => {
  // Select silhouette based on photo type
  const getSilhouetteSource = () => {
    switch (type) {
      case "side":
        return require("../assets/images/silhouette_side.png");
      case "front":
      case "back":
      default:
        return require("../assets/images/silhouette.png");
    }
  };

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
        source={getSilhouetteSource()}
        style={{
          width: width * 0.8,
          height: height * 0.6,
          opacity: 0.3,
          resizeMode: "contain",
        }}
      />
    </View>
  );
};

export default TorsoSilhouette;
