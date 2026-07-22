import { FeatureGate } from "@/components/monetization/FeatureGate";
import PaywallModal from "@/components/monetization/PaywallModal";
import Colors, { overlayOpacity, withOpacity } from "@/constants/Colors";
import { borderRadius, fontFamily, preciseType, spacing } from "@/constants/DesignSystem";
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
import * as MediaLibrary from "expo-media-library/legacy";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
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

type ComparisonMode = 'slider' | 'sideBySide' | 'grid' | 'gif';

import { createBeforeAfterGif } from '@/services/gifService';
import { useRouter } from 'expo-router';
import SyncedZoomPair from '@/components/progress/SyncedZoomPair';
import { useGifs } from '@/context/GifContext';
import { BeforeAfterSlider } from "@/components/progress/BeforeAfterSlider";
import { ContactSheetFrame } from "@/components/home/ContactSheetFrame";
import { Button } from "@/components/ui";


const PhotoMorph: React.FC<PhotoMorphProps> = ({ type }) => {
  const [sliderValue, setSliderValue] = useState(50);
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { getPhotosByType } = usePhotos();
  const photos = getPhotosByType(type);
  const { t } = useLocalization();
  const { hasFeatureAccess } = useUser();
  const { user, getToken } = useAuth();
  const { addGif } = useGifs();
  const router = useRouter();
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('slider');
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifError, setGifError] = useState<string | null>(null);
  const [gifSaved, setGifSaved] = useState(false);
  const [isSelectingPhotos, setIsSelectingPhotos] = useState(false);
  const [selectedPhoto1, setSelectedPhoto1] = useState<Photo | null>(null);
  const [selectedPhoto2, setSelectedPhoto2] = useState<Photo | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const hasSideBySideAccess = hasFeatureAccess(Feature.SIDE_BY_SIDE_COMPARISON);
  const hasGridViewAccess = hasFeatureAccess(Feature.GRID_VIEW_COMPARISON);
  const hasCustomSelectionAccess = hasFeatureAccess(Feature.CUSTOM_PHOTO_SELECTION);
  const hasGifAccess = hasFeatureAccess(Feature.GIF_GENERATION);

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
    const singlePhotoCaption = `${new Date(photos[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${t(`camera.${type}`).toUpperCase()}`;
    return (
      <View style={[styles.container, { backgroundColor: theme.transparent }]}>
        <View style={[styles.headerRow, styles.headerRowSingle]}>
          <View style={styles.singlePhotoChip}>
            <Ionicons name="image-outline" size={16} color={theme.secondary} />
            <Text style={[preciseType.badgeLabel, styles.singlePhotoChipText, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
              1 PHOTO
            </Text>
          </View>
        </View>
        <ContactSheetFrame caption={singlePhotoCaption}>
          <View style={styles.sliderStage}>
            <Image source={{ uri: photos[0].uri }} style={styles.image} />
            <TouchableOpacity
              style={[styles.extractButton, { backgroundColor: theme.primary }]}
              onPress={extractPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
            </TouchableOpacity>
          </View>
        </ContactSheetFrame>
        <Text style={[preciseType.caption, styles.singlePhotoHint, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
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
            <View style={[styles.selectionStep, { backgroundColor: selectedPhoto1 ? theme.primary : withOpacity(theme.text, overlayOpacity.subtle) }]}>
              <Text style={[preciseType.badgeLabel, styles.selectionStepText, { color: selectedPhoto1 ? 'white' : theme.text, fontFamily: fontFamily.mono }]}>
                {t("progress.firstPhoto").toUpperCase()} {selectedPhoto1 ? '✓' : ''}
              </Text>
            </View>
            <View style={[styles.selectionConnector, { backgroundColor: withOpacity(theme.text, overlayOpacity.light) }]} />
            <View style={[styles.selectionStep, { backgroundColor: selectedPhoto2 ? theme.success : withOpacity(theme.text, overlayOpacity.subtle) }]}>
              <Text style={[preciseType.badgeLabel, styles.selectionStepText, { color: selectedPhoto2 ? 'white' : theme.text, fontFamily: fontFamily.mono }]}>
                {t("progress.secondPhoto").toUpperCase()} {selectedPhoto2 ? '✓' : ''}
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
                  <View style={[styles.selectionPhotoOverlay, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy) }]}>
                    <Text style={[preciseType.caption, styles.selectionPhotoDate, { fontFamily: fontFamily.mono }]}>
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
            <Button
              title={t("progress.compareSelectedPhotos")}
              onPress={() => setIsSelectingPhotos(false)}
              variant="primary"
              fullWidth
              icon={<Ionicons name="checkmark" size={20} color={theme.onAccent} />}
              style={styles.confirmSelectionButton}
            />
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
        <View style={styles.headerActions}>
          {(selectedPhoto1 || selectedPhoto2) && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.cardBackground }]}
              onPress={resetSelection}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.text} />
            </TouchableOpacity>
          )}
          <View style={styles.timeDifferenceChip}>
            <Ionicons name="time-outline" size={14} color={theme.secondary} />
            <Text style={[preciseType.badgeLabel, styles.timeDifferenceChipText, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
              {getTimeDifference(photo1.date, photo2.date, t).toUpperCase()}
            </Text>
          </View>
        </View>
        <Button
          title={t("progress.change") || "Change"}
          onPress={() => (hasCustomSelectionAccess ? setIsSelectingPhotos(true) : setPaywallVisible(true))}
          variant="ghost"
          size="small"
          icon={<Ionicons name="images-outline" size={16} color={theme.text} />}
        />
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
          <View style={[styles.gifMessageCard, { backgroundColor: theme.cardBackground, borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}>
            <View style={[styles.gifMessageIconContainer, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
              <Ionicons name="log-in-outline" size={32} color={theme.primary} />
            </View>
            <Text style={[styles.gifMessageTitle, { color: theme.text }]}>
              {t("progress.gifAuthRequired")}
            </Text>
            <Text style={[styles.gifMessageSubtitle, { color: theme.secondary }]}>
              Sign in to start creating amazing before/after transformation GIFs
            </Text>
            <Button
              title={t("progress.gifGoToSettings")}
              onPress={() => router.push('/(tabs)/settings')}
              variant="primary"
              icon={<Ionicons name="settings-outline" size={20} color={theme.onAccent} />}
              style={styles.gifActionButton}
            />
          </View>
        ) : (
          <>
            <Button
              title={t("progress.gifGenerateButton")}
              onPress={async () => {
                setIsGeneratingGif(true);
                setGifError(null);
                setGifUrl(null);
                setGifSaved(false);
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

                    try {
                      const { status } = await MediaLibrary.requestPermissionsAsync();
                      if (status === 'granted') {
                        await MediaLibrary.saveToLibraryAsync(result.gifUri);
                        setGifSaved(true);
                      }
                    } catch (saveError) {
                      console.error('Error auto-saving GIF:', saveError);
                    }

                    try {
                      await addGif({
                        id: Date.now().toString(),
                        uri: result.gifUri,
                        date: new Date().toISOString(),
                      });
                    } catch (galleryError) {
                      console.error('Error adding GIF to gallery:', galleryError);
                    }
                  }
                } catch (e) {
                  setGifError('Failed to generate GIF. Please try again.');
                } finally {
                  setIsGeneratingGif(false);
                }
              }}
              disabled={isGeneratingGif}
              variant="primary"
              fullWidth
              icon={<Ionicons name="film-outline" size={22} color={theme.onAccent} />}
              style={styles.gifGenerateButton}
            />

            {isGeneratingGif && (
              <View style={[styles.gifLoadingCard, { backgroundColor: theme.cardBackground, borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}>
                <Ionicons name="hourglass-outline" size={24} color={theme.primary} />
                <Text style={[preciseType.subtitle, styles.gifLoadingText, { color: theme.text, fontFamily: fontFamily.mono }]}>
                  {t("progress.gifGenerating")}
                </Text>
              </View>
            )}

            {gifError && (() => {
              const isRateLimit = gifError.toLowerCase().includes('rate limit') || gifError.toLowerCase().includes('limit exceeded');
              const errorColor = isRateLimit ? theme.warning : theme.error;
              return (
                <View style={[styles.gifMessageCard, { backgroundColor: theme.cardBackground, borderColor: withOpacity(errorColor, overlayOpacity.heavy) }]}>
                  <View style={[styles.gifMessageIconContainer, { backgroundColor: withOpacity(errorColor, overlayOpacity.subtle) }]}>
                    <Ionicons
                      name={isRateLimit ? "time-outline" : "alert-circle-outline"}
                      size={32}
                      color={errorColor}
                    />
                  </View>
                  <Text style={[styles.gifMessageTitle, { color: theme.text }]}>
                    {isRateLimit ? t("progress.gifRateLimitTitle") : t("progress.gifErrorTitle")}
                  </Text>
                  <Text style={[styles.gifMessageSubtitle, { color: theme.secondary }]}>
                    {isRateLimit ? t("progress.gifRateLimitMessage") : gifError}
                  </Text>
                </View>
              );
            })()}
          </>
        )}

        {gifUrl && (
          <View style={styles.gifResultContainer}>
            <View style={[styles.gifImageFrame, { backgroundColor: theme.cardBackground, borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}>
              <Image source={{ uri: gifUrl }} style={styles.gifImage} />
            </View>
            {gifSaved && (
              <View style={styles.gifSavedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                <Text style={[preciseType.caption, styles.gifSavedBadgeText, { color: theme.success, fontFamily: fontFamily.mono }]}>
                  Saved to your gallery
                </Text>
              </View>
            )}
            <View style={styles.gifActionsRow}>
              <Button
                title={gifSaved ? 'Save Again' : 'Download'}
                onPress={async () => {
                  try {
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
                      return;
                    }

                    await MediaLibrary.saveToLibraryAsync(gifUrl);
                    setGifSaved(true);
                    Alert.alert(t("common.success"), 'GIF saved to gallery');
                  } catch (error) {
                    Alert.alert(t("common.error"), 'Failed to save GIF');
                  }
                }}
                variant="primary"
                icon={<Ionicons name="download-outline" size={20} color={theme.onAccent} />}
                style={styles.gifDownloadButton}
              />
              <Button
                title="Clear"
                onPress={() => {
                  setGifUrl(null);
                  setGifError(null);
                  setGifSaved(false);
                }}
                variant="ghost"
                icon={<Ionicons name="close-outline" size={20} color={theme.text} />}
                style={styles.gifClearButton}
              />
            </View>
          </View>
        )}
      </View>
    </FeatureGate>
  )}
      {/* Slider Mode */}
      {comparisonMode === 'slider' && (
        <ContactSheetFrame caption={`${new Date(photo1.date).toLocaleDateString()} → ${new Date(photo2.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`}>
          <View style={styles.sliderStage}>
            <BeforeAfterSlider
              beforeUri={photo1.uri}
              afterUri={photo2.uri}
              beforeLabel={t("common.before")}
              afterLabel={t("common.after")}
              onValueChange={setSliderValue}
            />
            <TouchableOpacity
              style={[styles.extractButton, { backgroundColor: theme.primary }]}
              onPress={extractPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
            </TouchableOpacity>
          </View>
        </ContactSheetFrame>
      )}

      {/* Side by Side Mode */}
      {comparisonMode === 'sideBySide' && (
        <FeatureGate
          feature={Feature.SIDE_BY_SIDE_COMPARISON}
          showPreview={false}
          compact={false}
          customMessage="Upgrade to Premium to compare photos side-by-side"
        >
          <SyncedZoomPair
            photoA={{
              uri: photo1.uri,
              label: `${t("common.before")} · ${new Date(photo1.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            }}
            photoB={{
              uri: photo2.uri,
              label: `${t("common.after")} · ${new Date(photo2.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            }}
          />
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
              <View
                key={photo.id}
                style={[
                  styles.gridPhoto,
                  { backgroundColor: theme.cardBackground, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
                ]}
              >
                <Image source={{ uri: photo.uri }} style={styles.gridImage} />
                <View style={[styles.gridLabel, { backgroundColor: withOpacity(theme.cardBackground, overlayOpacity.veryHeavy) }]}>
                  <Text style={[preciseType.statLabel, styles.gridDateText, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
                    {new Date(photo.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </FeatureGate>
      )}

      {/* View toolbar — how to compare. Photo-editor style, below the stage. */}
      <Text style={[styles.viewBarHead, preciseType.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
        {t("progress.view") || "VIEW"}
      </Text>
      <View style={styles.viewBar}>
        {([
          { key: 'slider' as const, label: t('progress.modeSlider'), icon: 'contrast-outline' as const, locked: false },
          { key: 'sideBySide' as const, label: t('progress.modeSideBySide'), icon: 'copy-outline' as const, locked: !hasSideBySideAccess },
          { key: 'grid' as const, label: t('progress.modeGrid'), icon: 'grid-outline' as const, locked: !hasGridViewAccess },
          { key: 'gif' as const, label: t('progress.modeGif'), icon: 'film-outline' as const, locked: !hasGifAccess },
        ]).map((v) => {
          const active = comparisonMode === v.key;
          return (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.viewBarItem,
                active
                  ? { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle), borderColor: theme.primary }
                  : { backgroundColor: theme.transparent, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
              ]}
              onPress={() => (v.locked ? setPaywallVisible(true) : setComparisonMode(v.key))}
              activeOpacity={0.8}
            >
              {v.locked && (
                <View style={styles.viewBarProBadge}>
                  <Text style={[preciseType.statLabel, { color: theme.primary, fontFamily: fontFamily.mono }]}>
                    PRO
                  </Text>
                </View>
              )}
              <Ionicons name={v.icon} size={22} color={active ? theme.primary : theme.secondary} />
              <Text
                style={[
                  preciseType.statLabel,
                  styles.viewBarLabel,
                  { color: active ? theme.primary : theme.text, fontFamily: fontFamily.mono },
                ]}
              >
                {v.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        source="progress_view"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerRowSingle: {
    justifyContent: "flex-end",
  },
  viewBarHead: {
    textTransform: "uppercase",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  viewBar: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  viewBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    position: "relative",
  },
  viewBarLabel: {
    textAlign: "center",
  },
  viewBarProBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
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
  selectionStepText: {},
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
    marginTop: spacing.lg,
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
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
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
    paddingVertical: spacing.xs,
  },
  gridDateText: {
    textAlign: "center",
  },
  timeDifferenceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  timeDifferenceChipText: {},
  singlePhotoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  singlePhotoChipText: {
    textTransform: "uppercase",
  },
  singlePhotoHint: {
    textAlign: "center",
    marginTop: spacing.md,
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
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  sliderStage: {
    position: "relative",
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
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  gifMessageIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  gifMessageTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  gifMessageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  gifActionButton: {
    marginTop: spacing.sm,
  },
  gifGenerateButton: {
    marginBottom: spacing.lg,
  },
  gifLoadingCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.lg,
    width: "100%",
  },
  gifLoadingText: {},
  gifResultContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  gifImageFrame: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  gifSavedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  gifSavedBadgeText: {},
  gifImage: {
    width: 280,
    height: 373,
    borderRadius: borderRadius.sm,
  },
  gifActionsRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
    justifyContent: "center",
  },
  gifDownloadButton: {},
  gifClearButton: {},
});

export default PhotoMorph;
