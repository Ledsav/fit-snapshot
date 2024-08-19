import React, { useState } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import Slider from '@react-native-community/slider';

export default function ProgressScreen() {
  const [sliderValue, setSliderValue] = useState(0);

  // These would be fetched from your app's state or storage in a real app
  const beforeImage = 'https://via.placeholder.com/300?text=Before';
  const afterImage = 'https://via.placeholder.com/300?text=After';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Progress</Text>
      <View style={styles.imageContainer}>
        <Image source={{ uri: beforeImage }} style={[styles.image, { opacity: (100 - sliderValue) / 100 }]} />
        <Image source={{ uri: afterImage }} style={[styles.image, styles.overlayImage, { opacity: sliderValue / 100 }]} />
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={sliderValue}
        onValueChange={setSliderValue}
      />
      <Text>Slide to compare before and after</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  imageContainer: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlayImage: {
    top: 0,
    left: 0,
  },
  slider: {
    width: '80%',
    height: 40,
  },
});