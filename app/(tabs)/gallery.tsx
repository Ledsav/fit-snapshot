import { FullScreenPhotoModal } from "@/components/gallery/FullScreenPhotoModal";
import { Header } from "@/components/home/Header";
import PaywallModal from "@/components/monetization/PaywallModal";
import BackgroundImage from "@/components/style/BackgroundImage";
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const itemSize = width / 3 - 10;
type Section = {
  title: string;
  data: Photo[];
  isExpanded: boolean;
};

type ViewMode = 'grouped' | 'timeline';

export default function GalleryScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTypeSelectionVisible, setIsTypeSelectionVisible] = useState(false);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageDate, setPendingImageDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const pathname = usePathname();
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const {
    photos,
    addPhoto,
    removePhoto,
    refreshPhotos,
    canAddPhoto,
    isLoading: contextLoading,
    error,
  } = usePhotos();
  const { storageUsagePercentage, featureUsage } = useUser();
  const { t } = useLocalization();

  useEffect(() => {
    const loadGallery = async () => {
      setIsLoading(true);
      try {
        await refreshPhotos();
        loadPhotos();
      } catch (error) {
        console.error("Error refreshing photos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [pathname]);

  
  useEffect(() => {
    loadPhotos();
  }, [photos, viewMode]);

  const loadPhotos = () => {
    try {
      const sortedPhotos = [...photos].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      if (viewMode === 'timeline') {
        
        const groupedByDate = sortedPhotos.reduce((acc, photo) => {
          const dateKey = new Date(photo.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(photo);
          return acc;
        }, {} as Record<string, Photo[]>);

        const newSections: Section[] = Object.entries(groupedByDate).map(([date, data]) => ({
          title: date,
          data,
          isExpanded: true,
        }));

        setSections(newSections);
      } else {
        
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
      }
      console.log("Gallery loaded successfully:", sections);
    } catch (error) {
      console.error("Error loading gallery:", error);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    await removePhoto(id);
    
  };

  const togglePhotoSelection = (id: string) => {
    const newSelection = new Set(selectedPhotoIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedPhotoIds(newSelection);
  };

  const handleBulkDelete = async () => {
    if (selectedPhotoIds.size === 0) return;

    for (const id of selectedPhotoIds) {
      await removePhoto(id);
    }
    setSelectedPhotoIds(new Set());
    setSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedPhotoIds(new Set());
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

  const pickImage = async () => {
    
    const storageCheck = canAddPhoto();
    if (!storageCheck.allowed) {
      setIsPaywallVisible(true);
      return;
    }

    try {
      const { status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert(t("camera.galleryPermissionDenied") || 'Sorry, we need media library permissions to import images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setPendingImageUri(selectedAsset.uri);

        
        console.log('Selected asset EXIF data:', selectedAsset.exif);
        console.log('Selected asset full data:', selectedAsset);

        
        let dateFromExif = null;
        if (selectedAsset.exif) {
          dateFromExif = selectedAsset.exif.DateTimeOriginal ||
                         selectedAsset.exif.DateTime ||
                         selectedAsset.exif.DateTimeDigitized;
        }

        if (dateFromExif) {
          console.log('Found EXIF date:', dateFromExif);
          setPendingImageDate(dateFromExif);
        } else {
          
          let fileDate = null;

          try {
            
            const fileInfo = await FileSystem.getInfoAsync(selectedAsset.uri);
            console.log('File info:', fileInfo);

            if (fileInfo.exists && fileInfo.modificationTime) {
              fileDate = new Date(fileInfo.modificationTime * 1000).toISOString();
              console.log('Using file modification time:', fileDate);
            }
          } catch (error) {
            console.log('Could not get file info:', error);
          }

          
          if (fileDate) {
            setPendingImageDate(fileDate);
          } else {
            try {
              
              const assets = await MediaLibrary.getAssetsAsync({
                first: 1000,
                sortBy: MediaLibrary.SortBy.creationTime,
              });

              
              const matchedAsset = assets.assets.find(asset =>
                selectedAsset.uri.includes(asset.filename) ||
                asset.uri === selectedAsset.uri
              );

              if (matchedAsset && matchedAsset.creationTime) {
                const creationDate = new Date(matchedAsset.creationTime).toISOString();
                console.log('Found asset in MediaLibrary with creation time:', creationDate);
                setPendingImageDate(creationDate);
              } else {
                console.log('No date metadata found, will use current date');
                setPendingImageDate(null);
              }
            } catch (error) {
              console.log('Could not access MediaLibrary:', error);
              setPendingImageDate(null);
            }
          }
        }

        
        setIsTypeSelectionVisible(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };

  const handleTypeSelection = async (type: PhotoType) => {
    if (!pendingImageUri) return;

    
    let photoDate = new Date().toISOString();

    if (pendingImageDate) {
      try {
        console.log('Processing pending image date:', pendingImageDate);

        
        if (pendingImageDate.includes('T') && pendingImageDate.includes('Z')) {
          photoDate = pendingImageDate;
          console.log('Using ISO date directly:', photoDate);
        } else {
          
          const dateStr = pendingImageDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            photoDate = parsedDate.toISOString();
            console.log('Parsed EXIF date to:', photoDate);
          } else {
            console.error('Failed to parse date:', dateStr);
          }
        }
      } catch (error) {
        console.error("Error parsing imported photo date:", error);
      }
    } else {
      console.log('No pending image date, using current date');
    }

    const newPhoto = {
      id: Date.now().toString(),
      uri: pendingImageUri,
      date: photoDate,
      type: type,
    };

    await addPhoto(newPhoto);

    
    setPendingImageUri(null);
    setPendingImageDate(null);
    setIsTypeSelectionVisible(false);
  };

  const cancelTypeSelection = () => {
    setPendingImageUri(null);
    setPendingImageDate(null);
    setIsTypeSelectionVisible(false);
  };

  const renderItem = ({ item }: { item: Photo }) => {
    const isSelected = selectedPhotoIds.has(item.id);

    return (
      <View key={item.id} style={styles.item}>
        <TouchableOpacity
          style={[
            styles.imageWrapper,
            isSelected && { borderWidth: 3, borderColor: theme.primary }
          ]}
          onPress={() => selectionMode ? togglePhotoSelection(item.id) : openFullScreenPhoto(item.uri)}
          activeOpacity={0.95}
        >
          <Image source={{ uri: item.uri }} style={styles.image} />
          <View style={styles.imageDateOverlay}>
            <Text style={styles.dateText}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit'
              })}
            </Text>
          </View>
          {viewMode === 'timeline' && (
            <View style={[styles.typeIndicator, { backgroundColor: theme.primary }]}>
              <Text style={styles.typeIndicatorText}>
                {item.type.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {selectionMode && isSelected && (
            <View style={[styles.selectedOverlay, { backgroundColor: theme.primary + '40' }]}>
              <Ionicons name="checkmark-circle" size={32} color={theme.primary} />
            </View>
          )}
        </TouchableOpacity>
        {!selectionMode && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.error }]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePhoto(item.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <TouchableOpacity
      style={styles.sectionHeaderContainer}
      onPress={() => toggleSection(section.title)}
      activeOpacity={0.8}
    >
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIndicator, { backgroundColor: theme.primary }]} />
        <Text style={[styles.sectionHeader, { color: theme.text }]}>
          {viewMode === 'grouped'
            ? t(`camera.${section.title.toLowerCase()}`)
            : section.title}
        </Text>
        <Text style={[styles.photoCount, { color: theme.text }]}>
          {section.data.length}
        </Text>
      </View>
      <Ionicons
        name={section.isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
        size={22}
        color={theme.text}
        style={{ opacity: 0.5 }}
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
        <Header title={t("gallery.title")} />

        {/* Storage Warning Banner */}
        {storageUsagePercentage >= 80 && storageUsagePercentage < 100 && (
          <View style={[styles.warningBanner, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="warning-outline" size={20} color={theme.warning} />
            <Text style={[styles.warningText, { color: theme.warning }]}>
              {featureUsage.photoCount} / 50 photos used ({storageUsagePercentage}%)
            </Text>
            <TouchableOpacity onPress={() => setIsPaywallVisible(true)}>
              <Text style={[styles.upgradeLink, { color: theme.primary }]}>
                Upgrade
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {storageUsagePercentage >= 100 && (
          <View style={[styles.errorBanner, { backgroundColor: theme.error + '20' }]}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.error} />
            <Text style={[styles.errorText, { color: theme.error }]}>
              Storage full! Delete photos or upgrade to Premium
            </Text>
          </View>
        )}

        {/* View Mode Toggle and Selection Controls */}
        <View style={styles.controlsBar}>
          <View style={styles.viewModeToggle}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'grouped' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setViewMode('grouped')}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={viewMode === 'grouped' ? theme.background : theme.text}
              />
              <Text style={[
                styles.viewModeText,
                { color: viewMode === 'grouped' ? theme.background : theme.text }
              ]}>
                {t("gallery.grouped") || "Grouped"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'timeline' && { backgroundColor: theme.primary }
              ]}
              onPress={() => setViewMode('timeline')}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={viewMode === 'timeline' ? theme.background : theme.text}
              />
              <Text style={[
                styles.viewModeText,
                { color: viewMode === 'timeline' ? theme.background : theme.text }
              ]}>
                {t("gallery.timeline") || "Timeline"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.selectionButton,
              selectionMode && { backgroundColor: theme.primary }
            ]}
            onPress={toggleSelectionMode}
          >
            <Ionicons
              name={selectionMode ? "checkmark-circle" : "checkmark-circle-outline"}
              size={20}
              color={selectionMode ? theme.background : theme.text}
            />
          </TouchableOpacity>
        </View>

        {/* Bulk Delete Bar */}
        {selectionMode && (
          <View style={[styles.bulkActionsBar, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.bulkActionsText, { color: theme.text }]}>
              {selectedPhotoIds.size} {t("gallery.selected") || "selected"}
            </Text>
            <TouchableOpacity
              style={[
                styles.bulkDeleteButton,
                { backgroundColor: theme.error },
                selectedPhotoIds.size === 0 && { opacity: 0.5 }
              ]}
              onPress={handleBulkDelete}
              disabled={selectedPhotoIds.size === 0}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text style={styles.bulkDeleteText}>
                {t("gallery.delete") || "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {isLoading || contextLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              {t("gallery.loading")}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.error }]}>
              {error}
            </Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={() => null}
            renderSectionHeader={renderSectionHeader}
            renderSectionFooter={renderSectionContent}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            stickySectionHeadersEnabled={false}
          />
        )}
        <FullScreenPhotoModal
          isVisible={!!selectedPhoto}
          photoUri={selectedPhoto || ""}
          onClose={closeFullScreenPhoto}
        />

        {/* Type Selection Modal */}
        <Modal
          visible={isTypeSelectionVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelTypeSelection}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t("gallery.selectPhotoType") || "Select Photo Type"}
              </Text>
              {pendingImageUri && (
                <Image source={{ uri: pendingImageUri }} style={styles.previewImage} />
              )}
              <View style={styles.typeButtonsContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleTypeSelection(PhotoType.front)}
                >
                  <Text style={[styles.typeButtonText, { color: theme.background }]}>
                    {t("camera.front")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleTypeSelection(PhotoType.side)}
                >
                  <Text style={[styles.typeButtonText, { color: theme.background }]}>
                    {t("camera.side")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, { backgroundColor: theme.primary }]}
                  onPress={() => handleTypeSelection(PhotoType.back)}
                >
                  <Text style={[styles.typeButtonText, { color: theme.background }]}>
                    {t("camera.back")}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.error }]}
                onPress={cancelTypeSelection}
              >
                <Text style={[styles.cancelButtonText, { color: theme.background }]}>
                  {t("common.cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primary }]}
          onPress={pickImage}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={28} color={theme.background} />
        </TouchableOpacity>

        <PaywallModal
          visible={isPaywallVisible}
          onClose={() => setIsPaywallVisible(false)}
          source="gallery"
        />
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  upgradeLink: {
    fontSize: 13,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 8,
    padding: 2,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  bulkActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
  },
  bulkActionsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bulkDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  bulkDeleteText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  typeIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIndicator: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  photoCount: {
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 5,
  },
  item: {
    width: itemSize,
    height: itemSize,
    position: "relative",
  },
  emptyItem: {
    width: itemSize,
    height: itemSize,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageDateOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dateText: {
    color: "white",
    fontSize: 10,
    fontWeight: "500",
    opacity: 0.9,
  },
  deleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  previewImage: {
    width: 200,
    height: 267,
    borderRadius: 10,
    marginBottom: 20,
  },
  typeButtonsContainer: {
    width: "100%",
    marginBottom: 15,
  },
  typeButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
