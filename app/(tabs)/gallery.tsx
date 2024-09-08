import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  SectionList,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPhotos, Photo, deletePhoto } from "../../services/photoStorage";
import { useRouter, usePathname } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FullScreenPhotoModal } from "@/components/gallery/FullScreenPhotoModal";

const { width } = Dimensions.get("window");
const itemSize = width / 2 - 15;

type Section = {
  title: string;
  data: Photo[];
  isExpanded: boolean;
};

export default function GalleryScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];

  useEffect(() => {
    loadPhotos();
  }, [pathname]);

  const loadPhotos = async () => {
    const loadedPhotos = await getPhotos();
    const sortedPhotos = loadedPhotos.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const newSections: Section[] = [
      {
        title: "Front",
        data: sortedPhotos.filter((photo) => photo.type === "front"),
        isExpanded: true,
      },
      {
        title: "Side",
        data: sortedPhotos.filter((photo) => photo.type === "side"),
        isExpanded: true,
      },
      {
        title: "Back",
        data: sortedPhotos.filter((photo) => photo.type === "back"),
        isExpanded: true,
      },
    ];

    setSections(newSections);
  };

  const handleDeletePhoto = async (id: string) => {
    await deletePhoto(id);
    loadPhotos();
  };

  const toggleSection = (title: string) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.title === title
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
    );
  };

  const openFullScreenPhoto = (photoUri: string) => {
    setSelectedPhoto(photoUri);
  };

  const closeFullScreenPhoto = () => {
    setSelectedPhoto(null);
  };

  const renderItem = ({ item }: { item: Photo }) => (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: theme.cardBackground }]}
      onPress={() => openFullScreenPhoto(item.uri)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={[styles.date, { color: theme.text }]}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.error }]}
          onPress={() => handleDeletePhoto(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={theme.background} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <TouchableOpacity
      style={[
        styles.sectionHeaderContainer,
        { backgroundColor: theme.primary },
      ]}
      onPress={() => toggleSection(section.title)}
    >
      <Text style={[styles.sectionHeader, { color: theme.background }]}>
        {section.title}
      </Text>
      <Ionicons
        name={section.isExpanded ? "chevron-up" : "chevron-down"}
        size={24}
        color={theme.background}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Photo Gallery</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push("(tabs)/camera" as any)}
        >
          <Ionicons name="add" size={24} color={theme.background} />
        </TouchableOpacity>
      </View>
      <SectionList
        sections={sections}
        renderItem={({ item, section }) =>
          section.isExpanded ? renderItem({ item }) : null
        }
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
      <FullScreenPhotoModal
        isVisible={!!selectedPhoto}
        photoUri={selectedPhoto || ""}
        onClose={closeFullScreenPhoto}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 10,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 15,
    overflow: "hidden",
    padding: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
  },
  item: {
    margin: 5,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: itemSize,
    height: itemSize,
    borderRadius: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 15,
  },
  date: {
    fontSize: 12,
    fontWeight: "bold",
  },
  deleteButton: {
    alignSelf: "flex-end",
    borderRadius: 15,
    padding: 5,
  },
});
