import React from "react";
import { Dimensions, Image, View } from "react-native";

const { width, height } = Dimensions.get("window");

const TorsoSilhouette = () => (
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
      source={require("../assets/images/silhouette.png")}
      style={{
        width: width * 0.8,
        height: height * 0.6,
        opacity: 0.3,
        resizeMode: "contain",
      }}
    />
  </View>
);

export default TorsoSilhouette;
