import React, { useEffect, useState } from "react";
import { StyleSheet, ScrollView, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PhotoMorph from "@/components/progress/PhotoMorph";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { getPhotos, Photo } from "../../services/photoStorage";

type Theme = {
  background: string;
  text: string;
  primary: string;
  secondary: string;
};

type ProgressSummaryProps = {
  theme: Theme;
  totalDays: number;
  totalPhotos: number;
  improvement: number;
};

const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  theme,
  totalDays,
  totalPhotos,
  improvement,
}) => (
  <View style={styles.summaryContainer}>
    <View style={styles.summaryItem}>
      <Ionicons name="calendar-outline" size={24} color={theme.text} />
      <Text style={[styles.summaryText, { color: theme.text }]}>
        {totalDays} days
      </Text>
    </View>
    <View style={styles.summaryItem}>
      <Ionicons name="camera-outline" size={24} color={theme.text} />
      <Text style={[styles.summaryText, { color: theme.text }]}>
        {totalPhotos} photos
      </Text>
    </View>
    <View style={styles.summaryItem}>
      <Ionicons name="trending-up-outline" size={24} color={theme.text} />
      <Text style={[styles.summaryText, { color: theme.text }]}>
        {improvement.toFixed(0)}% active
      </Text>
    </View>
  </View>
);

const MotivationalQuote: React.FC<{ theme: Theme }> = ({ theme }) => (
  <LinearGradient
    colors={[theme.primary, theme.secondary]}
    style={styles.quoteContainer}
  >
    <Text style={styles.quoteText}>
      "The only bad workout is the one that didn't happen."
    </Text>
  </LinearGradient>
);

const ProgressScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"] as Theme;
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      const fetchedPhotos = await getPhotos();
      setPhotos(fetchedPhotos);
    };
    fetchPhotos();
  }, []);

  const totalDays =
    photos.length > 0
      ? Math.ceil(
          (new Date().getTime() - new Date(photos[0].date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const totalPhotos = photos.length;

  // This is a placeholder calculation. You might want to implement a more sophisticated
  // improvement calculation based on your app's specific metrics.
  const improvement =
    totalPhotos > 0 ? Math.trunc((totalPhotos / totalDays) * 100) : 0;

  const getLatestPhotoByType = (
    type: "front" | "side" | "back"
  ): Photo | undefined => {
    return photos
      .filter((photo) => photo.type === type)
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.text }]}>Your Progress</Text>
      <ProgressSummary
        theme={theme}
        totalDays={totalDays}
        totalPhotos={totalPhotos}
        improvement={improvement}
      />
      <View style={styles.morphContainer}>
        <PhotoMorph type="front" photo={getLatestPhotoByType("front")} />
      </View>
      <View style={styles.morphContainer}>
        <PhotoMorph type="side" photo={getLatestPhotoByType("side")} />
      </View>
      <View style={styles.morphContainer}>
        <PhotoMorph type="back" photo={getLatestPhotoByType("back")} />
      </View>
      <MotivationalQuote theme={theme} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryText: {
    marginTop: 5,
    fontSize: 14,
  },
  morphContainer: {
    width: "100%",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  quoteContainer: {
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  quoteText: {
    color: "white",
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 16,
  },
});

export default ProgressScreen;
