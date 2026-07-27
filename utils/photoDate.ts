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
    asset.exif?.DateTimeOriginal ||
    asset.exif?.DateTime ||
    asset.exif?.DateTimeDigitized ||
    null;

  if (exifDate) {
    return parsePhotoDateString(exifDate).toISOString();
  }

  // `asset.uri` is a cache copy expo-image-picker just created, so its file
  // mtime reflects "now," not the photo's real date — assetId ties directly
  // to the original media-library entry and is far more reliable.
  if (asset.assetId) {
    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.assetId);
      if (assetInfo.creationTime) {
        return new Date(assetInfo.creationTime).toISOString();
      }
    } catch (error) {
      console.log("extractPhotoDate: could not read MediaLibrary asset info", error);
    }
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    if (fileInfo.exists && fileInfo.modificationTime) {
      return new Date(fileInfo.modificationTime * 1000).toISOString();
    }
  } catch (error) {
    console.log("extractPhotoDate: could not read file info", error);
  }

  return null;
}
