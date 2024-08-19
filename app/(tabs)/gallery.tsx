import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getPhotos, Photo, deletePhoto } from "../../services/photoStorage";
import { useRouter, usePathname, Href } from "expo-router";

const { width } = Dimensions.get("window");
const itemSize = width / 2 - 15;

type Section = {
  title: string;
  data: Photo[];
};

export default function GalleryScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const router = useRouter();
  const pathname = usePathname();

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
      },
      {
        title: "Side",
        data: sortedPhotos.filter((photo) => photo.type === "side"),
      },
      {
        title: "Back",
        data: sortedPhotos.filter((photo) => photo.type === "back"),
      },
    ];

    setSections(newSections);
  };

  const handleDeletePhoto = async (id: string) => {
    await deletePhoto(id);
    loadPhotos();
  };

  const renderItem = ({ item }: { item: Photo }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.uri }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.date}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePhoto(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: Section;
  }) => <Text style={styles.sectionHeader}>{title}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo Gallery</Text>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => router.push("(tabs)/camera" as Href<string>)}
      >
        <Ionicons name="camera" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 20,
    textAlign: "center",
  },
  list: {
    padding: 5,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    backgroundColor: "#ddd",
    padding: 10,
    marginTop: 10,
  },
  item: {
    margin: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  image: {
    width: itemSize,
    height: itemSize,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
    padding: 10,
  },
  date: {
    color: "white",
    fontSize: 12,
  },
  deleteButton: {
    alignSelf: "flex-end",
  },
  cameraButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 30,
    padding: 15,
  },
});
