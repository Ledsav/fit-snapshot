import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";

export type SaveResult =
  | { status: "saved" }
  | { status: "permission_denied" }
  | { status: "error"; error: unknown };

export async function saveFileToGallery(uri: string, albumName?: string): Promise<SaveResult> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      return { status: "permission_denied" };
    }
    if (albumName) {
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.saveToLibraryAsync(uri);
    }
    return { status: "saved" };
  } catch (error) {
    return { status: "error", error };
  }
}

export type ShareResult =
  | { status: "shared" }
  | { status: "unavailable" }
  | { status: "error"; error: unknown };

export async function shareFile(uri: string, mimeType: string, dialogTitle: string): Promise<ShareResult> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { status: "unavailable" };
    }
    await Sharing.shareAsync(uri, { mimeType, dialogTitle });
    return { status: "shared" };
  } catch (error) {
    return { status: "error", error };
  }
}
