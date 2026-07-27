import { FullScreenPhotoModal } from "@/components/gallery/FullScreenPhotoModal";
import { Header } from "@/components/home/Header";
import PaywallModal from "@/components/monetization/PaywallModal";
import BackgroundImage from "@/components/style/BackgroundImage";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { FREE_TIER_LIMITS } from "@/constants/Features";
import {
  spacing,
  borderRadius,
  elevation,
  fontFamily,
  typography,
  preciseType,
  iconSize,
  opacity as designOpacity,
  touchTarget,
} from "@/constants/DesignSystem";
import { IconButton, Button } from "@/components/ui";
import { useGifs } from "@/context/GifContext";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { PhotoType } from "@/enums/Photos";
import { GeneratedGif } from "@/services/gifStorage";
import { Photo } from "@/services/photoStorage";
import { PendingCropResult } from "@/services/pendingCropStore";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { extractPhotoDate } from "@/utils/photoDate";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// Compact caption date, e.g. "Jul 22, 2025". Year is always shown so photos
// are unambiguous across a multi-year progress history.
const formatCaptionDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [pendingImageWidth, setPendingImageWidth] = useState<number | null>(null);
  const [pendingImageHeight, setPendingImageHeight] = useState<number | null>(null);
  const [pendingImageDate, setPendingImageDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);
  const [isGifsExpanded, setIsGifsExpanded] = useState(true);
  const [isAddChooserVisible, setIsAddChooserVisible] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
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
  const { gifs, addGif, removeGif, refreshGifs } = useGifs();
  const { storageUsagePercentage, featureUsage } = useUser();
  const { t } = useLocalization();

  useEffect(() => {
    const loadGallery = async () => {
      setIsLoading(true);
      try {
        await refreshPhotos();
        await refreshGifs();
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

  const sortedGifs = [...gifs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDeleteGif = (id: string) => {
    Alert.alert(
      t("gallery.deleteGif"),
      t("gallery.deleteGifConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("gallery.delete"),
          style: "destructive",
          onPress: async () => {
            await removeGif(id);
          },
        },
      ]
    );
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

  const selectAllPhotos = () => {
    const allPhotoIds = new Set(photos.map(photo => photo.id));
    setSelectedPhotoIds(allPhotoIds);
  };

  const deselectAllPhotos = () => {
    setSelectedPhotoIds(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedPhotoIds.size === 0) return;

    const count = selectedPhotoIds.size;
    Alert.alert(
      t("gallery.deletePhoto"),
      `${count} ${t("gallery.deleteBulkConfirmMessage")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("gallery.delete"),
          style: "destructive",
          onPress: async () => {
            for (const id of selectedPhotoIds) {
              await removePhoto(id);
            }
            setSelectedPhotoIds(new Set());
            setSelectionMode(false);
          },
        },
      ]
    );
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
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setPendingImageUri(selectedAsset.uri);
        setPendingImageWidth(selectedAsset.width);
        setPendingImageHeight(selectedAsset.height);

        const isoDate = await extractPhotoDate(selectedAsset);
        setPendingImageDate(isoDate);

        setIsTypeSelectionVisible(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };

  const handleTypeSelection = async (type: PhotoType) => {
    if (!pendingImageUri || !pendingImageWidth || !pendingImageHeight) return;

    const uri = pendingImageUri;
    const width = pendingImageWidth;
    const height = pendingImageHeight;
    const initialDate = pendingImageDate;

    PendingCropResult.setResolver((croppedUri, date) => {
      addPhoto({
        id: Date.now().toString(),
        uri: croppedUri,
        date,
        type,
      });
      setPendingImageUri(null);
      setPendingImageWidth(null);
      setPendingImageHeight(null);
      setPendingImageDate(null);
    });

    setIsTypeSelectionVisible(false);

    router.push({
      pathname: "/photo-crop",
      params: {
        uri,
        width: String(width),
        height: String(height),
        type,
        date: initialDate ?? "",
      },
    });
  };

  const cancelTypeSelection = () => {
    setPendingImageUri(null);
    setPendingImageWidth(null);
    setPendingImageHeight(null);
    setPendingImageDate(null);
    setIsTypeSelectionVisible(false);
  };

  const pickGif = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert(t("camera.galleryPermissionDenied") || 'Sorry, we need media library permissions to import images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        const isGif =
          selectedAsset.mimeType === 'image/gif' ||
          selectedAsset.fileName?.toLowerCase().endsWith('.gif') ||
          selectedAsset.uri.toLowerCase().endsWith('.gif');

        if (!isGif) {
          Alert.alert(t("common.error"), t("gallery.invalidGifFile"));
          return;
        }

        const addResult = await addGif({
          id: Date.now().toString(),
          uri: selectedAsset.uri,
          date: new Date().toISOString(),
        });

        if (!addResult.success) {
          Alert.alert(t("common.error"), addResult.error || t("gallery.invalidGifFile"));
        }
      }
    } catch (error) {
      console.error("Error picking GIF:", error);
      alert(t("camera.imagePickerError") || 'Error selecting GIF. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: Photo }) => {
    const isSelected = selectedPhotoIds.has(item.id);
    const caption =
      viewMode === 'timeline'
        ? `${formatCaptionDate(item.date)} · ${item.type.toUpperCase()}`
        : formatCaptionDate(item.date);

    return (
      <View key={item.id} style={styles.item}>
        <TouchableOpacity
          style={[
            styles.imageWrapper,
            { borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
            isSelected && { borderWidth: 2, borderColor: theme.primary },
          ]}
          onPress={() => selectionMode ? togglePhotoSelection(item.id) : openFullScreenPhoto(item.uri)}
          activeOpacity={0.95}
        >
          <Image source={{ uri: item.uri }} style={styles.image} />
          {selectionMode && isSelected && (
            <View style={[styles.selectedOverlay, { backgroundColor: withOpacity(theme.primary, overlayOpacity.medium) }]}>
              <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
            </View>
          )}
        </TouchableOpacity>
        <Text
          style={[styles.itemCaption, { color: theme.secondary, fontFamily: fontFamily.mono }]}
          numberOfLines={1}
        >
          {caption}
        </Text>
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

  const renderGifItem = (gif: GeneratedGif) => (
    <View key={gif.id} style={styles.item}>
      <TouchableOpacity
        style={[styles.imageWrapper, { borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}
        onPress={() => openFullScreenPhoto(gif.uri)}
        activeOpacity={0.95}
      >
        <Image source={{ uri: gif.uri }} style={styles.image} />
      </TouchableOpacity>
      <Text
        style={[styles.itemCaption, { color: theme.secondary, fontFamily: fontFamily.mono }]}
        numberOfLines={1}
      >
        {formatCaptionDate(gif.date)}
      </Text>
      {selectionMode && (
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: withOpacity('#000000', overlayOpacity.veryHeavy) }]}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteGif(gif.id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={14} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderGifSection = () => {
    if (sortedGifs.length === 0) return null;

    const rows = [];
    for (let i = 0; i < sortedGifs.length; i += 3) {
      const rowItems = sortedGifs.slice(i, i + 3);
      rows.push(
        <View key={`gif-row-${i}`} style={styles.row}>
          {rowItems.map((gif) => renderGifItem(gif))}
          {rowItems.length < 3 &&
            Array(3 - rowItems.length)
              .fill(null)
              .map((_, index) => (
                <View key={`gif-empty-${i}-${index}`} style={styles.emptyItem} />
              ))}
        </View>
      );
    }

    return (
      <View style={styles.gifSectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeaderContainer}
          onPress={() => setIsGifsExpanded(!isGifsExpanded)}
          activeOpacity={0.8}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[styles.sectionIndicator, { backgroundColor: theme.primary }]} />
            <Text style={[styles.sectionHeader, { color: theme.text }]}>
              {t("gallery.gifsTitle")}
            </Text>
            <Text style={[styles.photoCount, { color: theme.text }]}>
              {sortedGifs.length}
            </Text>
          </View>
          <Ionicons
            name={isGifsExpanded ? "chevron-up-outline" : "chevron-down-outline"}
            size={22}
            color={theme.text}
            style={{ opacity: 0.5 }}
          />
        </TouchableOpacity>
        {isGifsExpanded && <View>{rows}</View>}
      </View>
    );
  };

  return (
    <BackgroundImage blurIntensity={0} overlayOpacity={1}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.transparent }]}
      >
        <Header title={t("gallery.title")} />

        {/* Storage Warning Banner */}
        {storageUsagePercentage >= 80 && storageUsagePercentage < 100 && (
          <View style={[styles.warningBanner, { backgroundColor: withOpacity(theme.warning, overlayOpacity.light) }]}>
            <Ionicons name="warning-outline" size={20} color={theme.warning} />
            <Text style={[styles.warningText, { color: theme.warning }]}>
              {featureUsage.photoCount} / {FREE_TIER_LIMITS.MAX_PHOTOS} photos used ({storageUsagePercentage}%)
            </Text>
            <TouchableOpacity onPress={() => setIsPaywallVisible(true)}>
              <Text style={[styles.upgradeLink, { color: theme.primary }]}>
                Upgrade
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {storageUsagePercentage >= 100 && (
          <View style={[styles.errorBanner, { backgroundColor: withOpacity(theme.error, overlayOpacity.light) }]}>
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
                viewMode === 'grouped'
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.transparent, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
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
                preciseType.badgeLabel,
                { color: viewMode === 'grouped' ? theme.background : theme.text }
              ]}>
                {t("gallery.grouped") || "Grouped"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'timeline'
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.transparent, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
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
                preciseType.badgeLabel,
                { color: viewMode === 'timeline' ? theme.background : theme.text }
              ]}>
                {t("gallery.timeline") || "Timeline"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.selectionButton,
              selectionMode
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.transparent, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
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
            <View style={styles.bulkActionsLeft}>
              <Text style={[styles.bulkActionsText, { color: theme.text }]} numberOfLines={1}>
                {selectedPhotoIds.size}
              </Text>
              {selectedPhotoIds.size === photos.length && selectedPhotoIds.size > 0 ? (
                <TouchableOpacity
                  style={[styles.selectAllButton, { borderColor: theme.primary }]}
                  onPress={deselectAllPhotos}
                >
                  <Text style={[styles.selectAllText, { color: theme.primary }]} numberOfLines={1}>
                    {t("gallery.deselectAll") || "Deselect All"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.selectAllButton, { borderColor: theme.primary }]}
                  onPress={selectAllPhotos}
                >
                  <Text style={[styles.selectAllText, { color: theme.primary }]} numberOfLines={1}>
                    {t("gallery.selectAll") || "Select All"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.bulkDeleteButton,
                { backgroundColor: theme.error },
                selectedPhotoIds.size === 0 && { opacity: 0.5 }
              ]}
              onPress={handleBulkDelete}
              disabled={selectedPhotoIds.size === 0}
            >
              <Ionicons name="trash-outline" size={18} color="white" />
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
            ListHeaderComponent={renderGifSection}
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

        {/* Add Content Chooser Modal */}
        <Modal
          visible={isAddChooserVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsAddChooserVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {t("gallery.addContent")}
              </Text>
              <View style={styles.typeButtonsContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, styles.chooserButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setIsAddChooserVisible(false);
                    pickImage();
                  }}
                >
                  <Ionicons name="image-outline" size={20} color={theme.background} />
                  <Text style={[styles.typeButtonText, { color: theme.background }]}>
                    {t("gallery.addPhoto")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, styles.chooserButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setIsAddChooserVisible(false);
                    pickGif();
                  }}
                >
                  <Ionicons name="film-outline" size={20} color={theme.background} />
                  <Text style={[styles.typeButtonText, { color: theme.background }]}>
                    {t("gallery.importGif")}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.error }]}
                onPress={() => setIsAddChooserVisible(false)}
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
          onPress={() => setIsAddChooserVisible(true)}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={iconSize.lg} color={theme.background} />
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
    ...typography.small,
    fontWeight: "600",
  },
  upgradeLink: {
    ...typography.small,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  errorText: {
    flex: 1,
    ...typography.small,
    fontWeight: "600",
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  viewModeToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.xs,
  },
  viewModeText: {
    fontFamily: fontFamily.mono,
  },
  selectionButton: {
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  bulkActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  bulkActionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  bulkActionsText: {
    ...typography.body,
    fontWeight: '600',
    minWidth: 20,
  },
  selectAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    flexShrink: 1,
  },
  selectAllText: {
    ...typography.small,
    fontWeight: '600',
  },
  bulkDeleteButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  bulkDeleteText: {
    color: 'white',
    ...typography.caption,
    fontWeight: '600',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  gifSectionContainer: {
    marginBottom: spacing.md,
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sectionIndicator: {
    width: 3,
    height: spacing.xl,
    borderRadius: 2,
  },
  sectionHeader: {
    ...typography.h4,
    letterSpacing: 0.3,
  },
  photoCount: {
    ...typography.caption,
    fontWeight: "500",
    opacity: designOpacity.hint,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  item: {
    width: itemSize,
    position: "relative",
  },
  emptyItem: {
    width: itemSize,
    height: itemSize,
  },
  imageWrapper: {
    width: itemSize,
    height: itemSize,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  itemCaption: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  deleteButton: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: iconSize.md,
    height: iconSize.md,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: withOpacity('#000000', overlayOpacity.veryHeavy),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: withOpacity('#000000', overlayOpacity.veryHeavy),
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalTitle: {
    ...typography.h3,
    marginBottom: spacing.xl,
  },
  previewImage: {
    width: 200,
    height: 267,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  typeButtonsContainer: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  typeButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  chooserButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  typeButtonText: {
    ...typography.body,
    fontWeight: "bold",
  },
  cancelButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    width: "100%",
    alignItems: "center",
  },
  cancelButtonText: {
    ...typography.body,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: spacing.xxl,
    right: spacing.xl,
    width: touchTarget.xlarge,
    height: touchTarget.xlarge,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    ...elevation.lg,
  },
});
