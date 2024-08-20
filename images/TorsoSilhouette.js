import React from "react";
import { View, Dimensions } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

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
    <Svg width={width * 0.8} height={height * 0.6} viewBox="0 0 100 140">
      <Circle cx="50" cy="20" r="18" fill="rgba(0,0,0,0.3)" />
      <Path
        d="M35 45 Q30 45 30 50 L30 125 Q30 130 35 130 L65 130 Q70 130 70 125 L70 50 Q70 45 65 45 C60 42 55 40 50 40 C45 40 40 42 35 45"
        fill="rgba(0,0,0,0.3)"
      />
    </Svg>
  </View>
);

export default TorsoSilhouette;
