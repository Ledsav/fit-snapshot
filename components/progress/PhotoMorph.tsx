import { FeatureGate } from "@/components/monetization/FeatureGate";
import Colors from "@/constants/Colors";
import { Feature } from "@/constants/Features";
import { useAuth } from "@/context/AuthContext";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import { getTimeDifference } from "@/utils/dateUtils";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PhotoMorphProps {
  type: PhotoType.front | PhotoType.side | PhotoType.back;
}

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width * 0.8;
const THUMB_SIZE = 40;
const THUMB_RADIUS = THUMB_SIZE / 2;

type ComparisonMode = 'slider' | 'sideBySide' | 'grid' | 'gif';

import { createBeforeAfterGif } from '@/services/gifService';
import { useRouter } from 'expo-router';


const PhotoMorph: React.FC<PhotoMorphProps> = ({ type }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { getPhotosByType } = usePhotos();
  const photos = getPhotosByType(type);
  const { t } = useLocalization();
  const { hasFeatureAccess } = useUser();
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifError, setGifError] = useState<string | null>(null);
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [selectedPhoto1, setSelectedPhoto1] = useState<Photo | null>(null);
  const [selectedPhoto2, setSelectedPhoto2] = useState<Photo | null>(null);

  const hasSideBySideAccess = hasFeatureAccess(Feature.SIDE_BY_SIDE_COMPARISON);
  const hasGridViewAccess = hasFeatureAccess(Feature.GRID_VIEW_COMPARISON);
  const hasCustomSelectionAccess = hasFeatureAccess(Feature.CUSTOM_PHOTO_SELECTION);
  const hasGifAccess = hasFeatureAccess(Feature.GIF_GENERATION);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      
      let newX = gesture.moveX - width * 0.1;
      
      newX = Math.max(0, Math.min(newX, SLIDER_WIDTH));
      pan.x.setValue(newX);
      setSliderValue((newX / SLIDER_WIDTH) * 100);
    },
  });

  const extractPhoto = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
        return;
      }

      const photoToExtract =
        photos.length > 1
          ? sliderValue > 50
            ? photos[photos.length - 1]
            : photos[0]
          : photos[0];
      const asset = await MediaLibrary.createAssetAsync(photoToExtract.uri);
      await MediaLibrary.createAlbumAsync("FitSnapshot", asset, false);

      Alert.alert(t("common.success"), t("progress.photoSavedMessage"));
    } catch (error) {
      console.error("Error extracting photo:", error);
      Alert.alert(t("common.error"), t("progress.photoSaveErrorMessage"));
    }
  }, [photos, sliderValue, t]);

  if (photos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t(`progress.${type}`)}
        </Text>
        <View
          style={[
            styles.noPhotosContainer,
            { backgroundColor: theme.transparent },
          ]}
        >
          <Ionicons name="image-outline" size={48} color={theme.text} />
          <Text style={[styles.noPhotosText, { color: theme.text }]}>
            {t("progress.noPhotosAvailable") + " " + t(`progress.${type}`)}
          </Text>
        </View>
  </View>
    );
  }

  
  const photo1 = selectedPhoto1 || photos[0];
  const photo2 = selectedPhoto2 || photos[photos.length - 1];

  const handlePhotoSelection = (photo: Photo) => {
    if (!selectedPhoto1) {
      setSelectedPhoto1(photo);
    } else if (!selectedPhoto2) {
      setSelectedPhoto2(photo);
      setIsSelectingPhotos(false);
    } else {
      setSelectedPhoto1(photo);
      setSelectedPhoto2(null);
    }
  };

  const resetSelection = () => {
    setSelectedPhoto1(null);
    setSelectedPhoto2(null);
  };

  if (photos.length === 1) {
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>
            {t(`progress.${type}`)}
          </Text>
          <View style={[styles.singlePhotoChip, { backgroundColor: theme.cardBackground }]}>
            <Ionicons name="image-outline" size={16} color={theme.text} />
            <Text style={[styles.singlePhotoChipText, { color: theme.text }]}>1 photo</Text>
          </View>
        </View>
        <View
          style={[
            styles.imageContainer,
            { backgroundColor: theme.cardBackground, borderColor: theme.primary },
          ]}
        >
          <Image source={{ uri: photos[0].uri }} style={styles.image} />
          <View style={styles.photoLabels}>
            <View style={[styles.photoLabel, { backgroundColor: theme.text + 'B3' }]}>
              <Text style={styles.photoLabelText}>
                {new Date(photos[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.extractButton, { backgroundColor: theme.primary }]}
            onPress={extractPhoto}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.singlePhotoHint, { color: theme.text }]}>
          {t("progress.takeMorePhotosHint")}
        </Text>
      </View>
    );
  }


  if (isSelectingPhotos) {
    return (
      <FeatureGate
        feature={Feature.CUSTOM_PHOTO_SELECTION}
        showPreview={false}
        compact={false}
        customMessage="Upgrade to Premium to select any photos for comparison"
        containerStyle={{ ...styles.container, backgroundColor: theme.transparent }}
      >
        <View style={[styles.container, { backgroundColor: theme.transparent }]}>
          <View style={styles.selectionHeader}>
            <View style={styles.selectionHeaderContent}>
              <Text style={[styles.selectionTitle, { color: theme.text }]}>
                {t("progress.selectPhotos") || "Select Photos"}
              </Text>
              <Text style={[styles.selectionSubtitle, { color: theme.text }]}>
                {!selectedPhoto1
                  ? t("progress.selectFirstPhoto")
                  : !selectedPhoto2
                  ? t("progress.selectSecondPhoto")
                  : t("progress.tapToChangeSelection")}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => {
                setIsSelectingPhotos(false);
                resetSelection();
              }}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.selectionProgress}>
            <View style={[styles.selectionStep, { backgroundColor: selectedPhoto1 ? theme.primary : theme.text + '20' }]}>
              <Text style={[styles.selectionStepText, { color: selectedPhoto1 ? 'white' : theme.text }]}>
                {t("progress.firstPhoto")} {selectedPhoto1 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.selectionConnector, { backgroundColor: theme.text + '30' }]} />
            <View style={[styles.selectionStep, { backgroundColor: selectedPhoto2 ? theme.success : theme.text + '20' }]}>
              <Text style={[styles.selectionStepText, { color: selectedPhoto2 ? 'white' : theme.text }]}>
                {t("progress.secondPhoto")} {selectedPhoto2 ? '✓' : ''}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.photoSelectionScroll}
            contentContainerStyle={styles.photoSelectionGrid}
            showsVerticalScrollIndicator={false}
          >
            {photos.map((photo, index) => {
              const isFirst = selectedPhoto1?.id === photo.id;
              const isSecond = selectedPhoto2?.id === photo.id;
              const isSelected = isFirst || isSecond;

              return (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.selectionPhotoContainer,
                    {
                      borderColor: isFirst ? theme.primary : isSecond ? theme.success : 'transparent',
                      borderWidth: isSelected ? 3 : 2,
                    }
                  ]}
                  onPress={() => handlePhotoSelection(photo)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: photo.uri }} style={styles.selectionPhoto} />
                  <View style={[styles.selectionPhotoOverlay, { backgroundColor: theme.text + '99' }]}>
                    <Text style={styles.selectionPhotoDate}>
                      {new Date(photo.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  {isFirst && (
                    <View style={[styles.selectionBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectionBadgeText}>1</Text>
                    </View>
                  )}
                  {isSecond && (
                    <View style={[styles.selectionBadge, { backgroundColor: theme.success }]}>
                      <Text style={styles.selectionBadgeText}>2</Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectionCheckmark}>
                      <Ionicons name="checkmark-circle" size={32} color={isFirst ? theme.primary : theme.success} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {selectedPhoto1 && selectedPhoto2 && (
            <TouchableOpacity
              style={[styles.confirmSelectionButton, { backgroundColor: theme.primary }]}
              onPress={() => setIsSelectingPhotos(false)}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.confirmSelectionText}>{t("progress.compareSelectedPhotos")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </FeatureGate>
    );
  }

  const oldestPhoto = photos[0];
  const newestPhoto = photos[photos.length - 1];

  return (
    <View style={[styles.container, { backgroundColor: theme.transparent }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>
          {t(`progress.${type}`)}
        </Text>
        <View style={styles.headerActions}>
          {(selectedPhoto1 || selectedPhoto2) && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.cardBackground }]}
              onPress={resetSelection}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.text} />
            </TouchableOpacity>
          )}
          <View
            style={[
              styles.timeDifferenceChip,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons name="time-outline" size={16} color={theme.background} />
            <Text style={[styles.timeDifferenceChipText, { color: theme.background }]}>
              {getTimeDifference(photo1.date, photo2.date, t)}
            </Text>
          </View>
        </View>
      </View>

      {/* Comparison Mode Switcher */}
  <View style={styles.modeSwitcher}>
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'slider' ? theme.primary : theme.text + '20' }
      ]}
      onPress={() => setComparisonMode('slider')}
    >
      <Ionicons
        name="swap-horizontal-outline"
        size={18}
        color={comparisonMode === 'slider' ? theme.background : theme.text}
      />
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'sideBySide' ? theme.primary : theme.text + '20', opacity: hasSideBySideAccess ? 1 : 0.5 }
      ]}
      onPress={() => hasSideBySideAccess && setComparisonMode('sideBySide')}
      disabled={!hasSideBySideAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons
          name="copy-outline"
          size={18}
          color={comparisonMode === 'sideBySide' ? theme.background : theme.text}
        />
        {!hasSideBySideAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
    {/* GIF mode as third tab */}
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'gif' ? theme.primary : theme.text + '20', opacity: hasGifAccess ? 1 : 0.5 }
      ]}
      onPress={() => hasGifAccess && setComparisonMode('gif')}
      disabled={!hasGifAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons name="film-outline" size={18} color={comparisonMode === 'gif' ? theme.background : theme.text} />
        {!hasGifAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      style={[
        styles.modeButton,
        { backgroundColor: comparisonMode === 'grid' ? theme.primary : theme.text + '20', opacity: hasGridViewAccess ? 1 : 0.5 }
      ]}
      onPress={() => hasGridViewAccess && setComparisonMode('grid')}
      disabled={!hasGridViewAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons
          name="grid-outline"
          size={18}
          color={comparisonMode === 'grid' ? theme.background : theme.text}
        />
        {!hasGridViewAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.modeButton, { backgroundColor: theme.cardBackground, opacity: hasCustomSelectionAccess ? 1 : 0.5 }]}
      onPress={() => hasCustomSelectionAccess && setIsSelectingPhotos(true)}
      disabled={!hasCustomSelectionAccess}
    >
      <View style={styles.modeButtonContent}>
        <Ionicons name="images-outline" size={18} color={theme.text} />
        {!hasCustomSelectionAccess && (
          <Ionicons name="lock-closed" size={10} color={theme.text} style={styles.lockIcon} />
        )}
      </View>
    </TouchableOpacity>
  </View>

  {/* GIF Mode */}
  {comparisonMode === 'gif' && (
    <FeatureGate
      feature={Feature.GIF_GENERATION}
      showPreview={false}
      compact={false}
      customMessage="Upgrade to Premium to generate before/after GIFs"
    >
      <View style={styles.gifContainer}>
        {!user ? (
          <View style={[styles.gifMessageCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
            <View style={[styles.gifMessageIconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="log-in-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.gifMessageTitle, { color: theme.text }]}>
              {t("progress.gifAuthRequired")}
            </Text>
            <Text style={[styles.gifMessageSubtitle, { color: theme.text }]}>
              Sign in to start creating amazing before/after transformation GIFs
            </Text>
            <TouchableOpacity
              style={[styles.gifActionButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Ionicons name="settings-outline" size={20} color={theme.background} />
              <Text style={[styles.gifActionButtonText, { color: theme.background }]}>
                {t("progress.gifGoToSettings")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.gifGenerateButton, { backgroundColor: theme.primary }]}
              onPress={async () => {
                setIsGeneratingGif(true);
                setGifError(null);
                setGifUrl(null);
                try {
                  const token = await getToken();
                  if (!token) {
                    setGifError('Authentication failed. Please sign in again.');
                    return;
                  }

                  const result = await createBeforeAfterGif([photo1.uri, photo2.uri], token);
                  if (result.error) {
                    setGifError(result.error);
                  } else {
                    setGifUrl(result.gifUri);
                  }
                } catch (e) {
                  setGifError('Failed to generate GIF. Please try again.');
                } finally {
                  setIsGeneratingGif(false);
                }
              }}
              disabled={isGeneratingGif}
              activeOpacity={0.8}
            >
              <Ionicons name="film-outline" size={22} color={theme.background} />
              <Text style={[styles.gifGenerateButtonText, { color: theme.background }]}>
                {t("progress.gifGenerateButton")}
              </Text>
            </TouchableOpacity>

            {isGeneratingGif && (
              <View style={[styles.gifLoadingCard, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="hourglass-outline" size={24} color={theme.primary} />
                <Text style={[styles.gifLoadingText, { color: theme.text }]}>
                  {t("progress.gifGenerating")}
                </Text>
              </View>
            )}

            {gifError && (
              <View style={[styles.gifMessageCard, {
                backgroundColor: theme.cardBackground,
                borderColor: gifError.toLowerCase().includes('rate limit') || gifError.toLowerCase().includes('limit exceeded')
                  ? '#FFA500'
                  : theme.error || '#FF3B30'
              }]}>
                <View style={[styles.gifMessageIconContainer, {
                  backgroundColor: (gifError.toLowerCase().includes('rate limit') || gifError.toLowerCase().includes('limit exceeded')
                    ? '#FFA500'
                    : theme.error || '#FF3B30') + '20'
                }]}>
                  <Ionicons
                    name={gifError.toLowerCase().includes('rate limit') || gifError.toLowerCase().includes('limit exceeded')
                      ? "time-outline"
                      : "alert-circle-outline"
                    }
                    size={32}
                    color={gifError.toLowerCase().includes('rate limit') || gifError.toLowerCase().includes('limit exceeded')
                      ? '#FFA500'
                      : theme.error || '#FF3B30'
                    }
                  />
                </View>
                <Text style={[styles.gifMessageTitle, { color: theme.text }]}>
                  {gifError.toLowerCase().includes('rate limit') || gifError.toLowerCase().includes('limit exceeded')
                    ? t("progress.gifRateLimitTitle")
                    : t("progress.gifErrorTitle")
                  }
                </Text>
                <Text style={[styles.gifMessageSubtitle, { color: theme.text }]}>
                  {gifError.toLowerCase().includes('rate limit') || gifError.toLowerCase().includes('limit exceeded')
                    ? t("progress.gifRateLimitMessage")
                    : gifError
                  }
                </Text>
              </View>
            )}
          </>
        )}

        {gifUrl && (
          <View style={styles.gifResultContainer}>
            <Image source={{ uri: gifUrl }} style={styles.gifImage} />
            <View style={styles.gifActionsRow}>
              <TouchableOpacity
                style={[styles.gifDownloadButton, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  try {
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
                      return;
                    }

                    await MediaLibrary.saveToLibraryAsync(gifUrl);
                    Alert.alert(t("common.success"), 'GIF saved to gallery');
                  } catch (error) {
                    Alert.alert(t("common.error"), 'Failed to save GIF');
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="download-outline" size={20} color={theme.background} />
                <Text style={[styles.gifDownloadButtonText, { color: theme.background }]}>
                  Download
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.gifClearButton, { backgroundColor: theme.text + '20' }]}
                onPress={() => {
                  setGifUrl(null);
                  setGifError(null);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-outline" size={20} color={theme.text} />
                <Text style={[styles.gifClearButtonText, { color: theme.text }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </FeatureGate>
  )}
      {/* Slider Mode */}
      {comparisonMode === 'slider' && (
        <>
          <View
            style={[
              styles.imageContainer,
              { backgroundColor: theme.cardBackground, borderColor: theme.primary },
            ]}
          >
            <Image
              source={{ uri: photo1.uri }}
              style={[styles.image, { opacity: (100 - sliderValue) / 100 }]}
            />
            <Image
              source={{ uri: photo2.uri }}
              style={[
                styles.image,
                styles.overlayImage,
                { opacity: sliderValue / 100 },
              ]}
            />
            <View style={styles.photoLabels}>
              <View style={[styles.photoLabel, { backgroundColor: theme.text + 'B3', opacity: (100 - sliderValue) / 100 }]}>
                <Text style={styles.photoLabelText}>
                  {new Date(photo1.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={[styles.photoLabel, { backgroundColor: theme.text + 'B3', opacity: sliderValue / 100 }]}>
                <Text style={styles.photoLabelText}>
                  {new Date(photo2.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.extractButton, { backgroundColor: theme.primary }]}
              onPress={extractPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
            </TouchableOpacity>
          </View>
          <View style={styles.sliderWrapper}>
            <View style={styles.sliderContainer} {...panResponder.panHandlers}>
              <View
                style={[styles.sliderTrack, { backgroundColor: theme.text + '20' }]}
              />
              <View
                style={[
                  styles.sliderProgress,
                  {
                    backgroundColor: theme.primary,
                    width: `${sliderValue}%`
                  }
                ]}
              />
              <Animated.View
                style={[
                  styles.sliderThumb,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.primary,
                    transform: [
                      { translateX: Animated.subtract(pan.x, THUMB_RADIUS) }
                    ],
                  },
                ]}
              >
                <View style={[styles.sliderThumbInner, { backgroundColor: theme.primary }]} />
              </Animated.View>
            </View>
            <View style={styles.sliderLabels}>
              <Text style={[styles.sliderLabel, { color: theme.text }]}>{t("common.before")}</Text>
              <Text style={[styles.sliderLabel, { color: theme.text }]}>{t("common.after")}</Text>
            </View>
          </View>
        </>
      )}

      {/* Side by Side Mode */}
      {comparisonMode === 'sideBySide' && (
        <FeatureGate
          feature={Feature.SIDE_BY_SIDE_COMPARISON}
          showPreview={false}
          compact={false}
          customMessage="Upgrade to Premium to compare photos side-by-side"
        >
          <View style={styles.sideBySideContainer}>
            <View style={[styles.sideBySidePhoto, { borderColor: theme.primary }]}>
              <Image source={{ uri: photo1.uri }} style={styles.image} />
              <View style={[styles.sideBySideLabel, { backgroundColor: theme.text + 'B3' }]}>
                <Text style={styles.sideBySideLabelText}>{t("common.before")}</Text>
                <Text style={styles.sideBySideDateText}>
                  {new Date(photo1.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
            <View style={[styles.sideBySidePhoto, { borderColor: theme.primary }]}>
              <Image source={{ uri: photo2.uri }} style={styles.image} />
              <View style={[styles.sideBySideLabel, { backgroundColor: theme.text + 'B3' }]}>
                <Text style={styles.sideBySideLabelText}>{t("common.after")}</Text>
                <Text style={styles.sideBySideDateText}>
                  {new Date(photo2.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>
        </FeatureGate>
      )}

      {/* Grid Mode - Show progression */}
      {comparisonMode === 'grid' && (
        <FeatureGate
          feature={Feature.GRID_VIEW_COMPARISON}
          showPreview={false}
          compact={false}
          customMessage="Upgrade to Premium to view all photos in grid layout"
        >
          <View style={styles.gridContainer}>
            {photos.slice(0, 6).map((photo, index) => (
              <View key={photo.id} style={[styles.gridPhoto, { borderColor: theme.primary }]}>
                <Image source={{ uri: photo.uri }} style={styles.gridImage} />
                <View style={[styles.gridLabel, { backgroundColor: theme.text + 'B3' }]}>
                  <Text style={styles.gridDateText}>
                    {new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </FeatureGate>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  modeSwitcher: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    padding: 10,
    borderRadius: 8,
  },
  modeButtonContent: {
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  selectionHeaderContent: {
    flex: 1,
  },
  selectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  selectionProgress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  selectionStep: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectionStepText: {
    fontSize: 13,
    fontWeight: "600",
  },
  selectionConnector: {
    width: 20,
    height: 2,
    marginHorizontal: 4,
  },
  photoSelectionScroll: {
    flex: 1,
  },
  photoSelectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  selectionPhotoContainer: {
    width: "48%",
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  selectionPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  selectionPhotoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  selectionPhotoDate: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  selectionBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  selectionBadgeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectionCheckmark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
    backgroundColor: "white",
    borderRadius: 16,
  },
  confirmSelectionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  confirmSelectionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  sideBySideContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  sideBySidePhoto: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 2,
  },
  sideBySideLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  sideBySideLabelText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  sideBySideDateText: {
    color: "white",
    fontSize: 11,
    opacity: 0.8,
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  gridPhoto: {
    width: (width - 60) / 3,
    aspectRatio: 3 / 4,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 4,
  },
  gridDateText: {
    color: "white",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  timeDifferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timeDifferenceChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  singlePhotoChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  singlePhotoChipText: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.7,
  },
  singlePhotoHint: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 12,
  },
  noPhotosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    padding: 20,
  },
  noPhotosText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayImage: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  photoLabels: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  photoLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  photoLabelText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  sliderWrapper: {
    marginTop: 8,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 44,
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 8,
    position: "relative",
  },
  sliderTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    position: "absolute",
  },
  sliderProgress: {
    height: 6,
    borderRadius: 3,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: "absolute",
    top: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderThumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: (width - SLIDER_WIDTH) / 2,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
  },
  extractButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // GIF-specific styles
  gifContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 16,
  },
  gifMessageCard: {
    width: "100%",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  gifMessageIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  gifMessageTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  gifMessageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    opacity: 0.8,
    marginBottom: 16,
  },
  gifActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  gifActionButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  gifGenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gifGenerateButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  gifLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
    width: "100%",
  },
  gifLoadingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  gifResultContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  gifImage: {
    width: 280,
    height: 373,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gifActionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  gifDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gifDownloadButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  gifClearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
  },
  gifClearButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default PhotoMorph;
