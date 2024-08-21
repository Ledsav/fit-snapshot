import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Text,
  ScrollView,
} from "react-native";
import { useRouter, Href } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { getPhotos, Photo } from "@/services/photoStorage";
import { StreakService, StreakData } from "@/services/streakService";
import { Header } from "@/components/home/Header";
import { StreakCard } from "@/components/home/StreakCard";
import { LatestPhotoCard } from "@/components/home/LatestPhotoCard";
import { BackgroundPattern } from "@/components/style/Pattern";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastPhotoDate: null,
  });
  const [latestPhoto, setLatestPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const photos = await getPhotos();
      const streak = await StreakService.getStreakData();
      setStreakData(streak);

      if (photos.length > 0) {
        setLatestPhoto(photos[photos.length - 1]);
        if (streak.lastPhotoDate !== photos[photos.length - 1].date) {
          const updatedStreak = await StreakService.updateStreak(
            photos[photos.length - 1]
          );
          setStreakData(updatedStreak);
        }
      }
    };

    loadData();
  }, []);

  const navigateTo = (route: Href<string>) => {
    router.push(route);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <BackgroundPattern />
      <Header />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <StreakCard streak={streakData.currentStreak} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => navigateTo("(tabs)/camera" as Href<string>)}
            >
              <Ionicons name="camera" size={32} color={theme.background} />
              <Text
                style={[styles.quickActionText, { color: theme.background }]}
              >
                Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() => navigateTo("(tabs)/progress" as Href<string>)}
            >
              <Ionicons name="bar-chart" size={32} color={theme.background} />
              <Text
                style={[styles.quickActionText, { color: theme.background }]}
              >
                View Progress
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Latest Photo
          </Text>
          <LatestPhotoCard
            latestPhoto={latestPhoto}
            onPress={() => navigateTo("(tabs)/progress" as Href<string>)}
          />
        </View>

        <TouchableOpacity
          style={[styles.viewGalleryButton, { backgroundColor: theme.primary }]}
          onPress={() => navigateTo("(tabs)/gallery" as Href<string>)}
        >
          <Text style={[styles.viewGalleryText, { color: theme.background }]}>
            View Full Gallery
          </Text>
          <Ionicons name="arrow-forward" size={24} color={theme.background} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: theme.secondary }]}
          onPress={() => navigateTo("(tabs)/settings" as Href<string>)}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={theme.background}
          />
          <Text style={[styles.settingsText, { color: theme.background }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  quickActionButton: {
    flex: 1,
    height: 100,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "bold",
  },
  viewGalleryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
    marginTop: 12,
  },
  viewGalleryText: {
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 15,
    marginTop: 12,
  },
  settingsText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
