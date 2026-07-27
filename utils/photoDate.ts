import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library/legacy";

export function parsePhotoDateString(raw?: string | null): Date {
  if (!raw) return new Date();

  const normalized =
    raw.includes("T") && raw.includes("Z")
      ? raw
      : raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");

  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function extractPhotoDate(
  asset: ImagePicker.ImagePickerAsset
): Promise<string | null> {
  const exifDate =
    asset.exif?.DateTimeOriginal ??
    asset.exif?.DateTime ??
    asset.exif?.DateTimeDigitized ??
    null;

  if (exifDate) {
    return parsePhotoDateString(exifDate).toISOString();
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    if (fileInfo.exists && fileInfo.modificationTime) {
      return new Date(fileInfo.modificationTime * 1000).toISOString();
    }
  } catch (error) {
    console.log("extractPhotoDate: could not read file info", error);
  }

  try {
    const assets = await MediaLibrary.getAssetsAsync({
      first: 1000,
      sortBy: MediaLibrary.SortBy.creationTime,
    });
    const matchedAsset = assets.assets.find(
      (a) => asset.uri.includes(a.filename) || a.uri === asset.uri
    );
    if (matchedAsset && matchedAsset.creationTime) {
      return new Date(matchedAsset.creationTime).toISOString();
    }
  } catch (error) {
    console.log("extractPhotoDate: could not query MediaLibrary", error);
  }

  return null;
}
