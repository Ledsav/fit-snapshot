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
import { useRouter, usePathname } from "expo-router";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { FullScreenPhotoModal } from "@/components/gallery/FullScreenPhotoModal";
import BackgroundImage from "@/components/style/BackgroundImage";
import { Header } from "@/components/home/Header";
import { usePhotos } from "@/context/PhotoContext";
import { Photo } from "@/services/photoStorage";

const { width } = Dimensions.get("window");
const itemSize = width / 3 - 10; // Adjusted for 3 columns

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
  const { photos, removePhoto, refreshPhotos } = usePhotos();

  useEffect(() => {
    loadPhotos();
  }, [pathname, photos]);

  const loadPhotos = () => {
    const sortedPhotos = [...photos].sort(
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
    await removePhoto(id);
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
      key={item.id}
      style={[styles.item, { backgroundColor: theme.cardBackground }]}
      onPress={() => openFullScreenPhoto(item.uri)}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: theme.error }]}
        onPress={() => handleDeletePhoto(item.id)}
      >
        <Ionicons name="trash" size={16} color={theme.background} />
      </TouchableOpacity>
      <View style={styles.dateContainer}>
        <Text style={[styles.date, { color: theme.text }]}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
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

  const renderSectionContent = ({ section }: { section: Section }) => {
    if (!section.isExpanded) return null;

    const rows = [];
    for (let i = 0; i < section.data.length; i += 3) {
      const rowItems = section.data.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems.map((item) => renderItem({ item }))}
          {rowItems.length < 3 &&
            Array(3 - rowItems.length)
              .fill(null)
              .map((_, index) => (
                <View key={`empty-${i}-${index}`} style={styles.emptyItem} />
              ))}
        </View>
      );
    }
    return <View>{rows}</View>;
  };

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.transparent }]}
      >
        <Header title="Gallery" />
        <SectionList
          sections={sections}
          renderItem={() => null}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionContent}
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
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  item: {
    width: itemSize,
    height: itemSize,
    borderRadius: 15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyItem: {
    width: itemSize,
    height: itemSize,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
  },
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dateContainer: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    padding: 5,
  },
  date: {
    fontSize: 10,
    fontWeight: "bold",
  },
});
