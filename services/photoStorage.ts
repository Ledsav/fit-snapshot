import { PhotoType } from "@/enums/Photos";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';

export interface Photo {
  id: string;
  uri: string;
  date: string;
  type: PhotoType;
  fileName?: string;
  /** 0–1 background luminance captured at shoot time (live-lighting feature). Absent on legacy photos. */
  luminance?: number;
}

const PHOTO_STORAGE_KEY = "FITNESS_TRACKER_PHOTOS";
const PHOTO_DIRECTORY = FileSystem.documentDirectory + 'FitSnapshot/photos/';

// Ensure the photo directory exists
const ensureDirectoryExists = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, { intermediates: true });
  }
};

// Save photo to permanent device storage
const savePhotoToDevice = async (photoUri: string, fileName: string): Promise<string> => {
  try {
    await ensureDirectoryExists();
    const newPath = PHOTO_DIRECTORY + fileName;
    
    // Copy the photo to our app's document directory
    await FileSystem.copyAsync({
      from: photoUri,
      to: newPath,
    });
    
    // Optionally save to device's photo library as well
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(newPath);
      }
    } catch (error) {
      console.log('Could not save to media library:', error);
      // Don't throw - we still have the file in our directory
    }
    
    return newPath;
  } catch (error) {
    console.error('Error saving photo to device:', error);
    throw error;
  }
};

export const savePhoto = async (photo: Photo): Promise<void> => {
  try {
    // Generate a unique filename using the photo's actual date
    const timestamp = new Date(photo.date).toISOString().replace(/[:.]/g, '-');
    const fileName = `${photo.type}_${timestamp}_${photo.id}.jpg`;
    
    // Save photo to device storage
    const deviceUri = await savePhotoToDevice(photo.uri, fileName);
    
    // Update photo object with device URI and filename
    const photoToSave = {
      ...photo,
      uri: deviceUri,
      fileName: fileName,
    };
    
    const existingPhotos = await getPhotos();
    const updatedPhotos = [...existingPhotos, photoToSave];
    await AsyncStorage.setItem(
      PHOTO_STORAGE_KEY,
      JSON.stringify(updatedPhotos)
    );
  } catch (error) {
    console.error("Error saving photo:", error);
    throw error;
  }
};

export const getPhotos = async (): Promise<Photo[]> => {
  try {
    const photosJson = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);
    return photosJson ? JSON.parse(photosJson) : [];
  } catch (error) {
    console.error("Error getting photos:", error);
    throw error;
  }
};

export const getPhotosByType = async (
  type: "front" | "side" | "back"
): Promise<Photo[]> => {
  try {
    const allPhotos = await getPhotos();
    console.log(`Total photos: ${allPhotos.length}`);

    const filteredPhotos = allPhotos.filter((photo) => photo.type === type);
    console.log(`Filtered photos for ${type}: ${filteredPhotos.length}`);

    const sortedPhotos = filteredPhotos.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    console.log(
      `Sorted photos for ${type}:`,
      sortedPhotos.map((p) => ({ id: p.id, date: p.date }))
    );

    return sortedPhotos;
  } catch (error) {
    console.error("Error getting photos by type:", error);
    throw error;
  }
};

export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    const existingPhotos = await getPhotos();
    const photoToDelete = existingPhotos.find(photo => photo.id === photoId);
    
    // Delete the physical file if it exists
    if (photoToDelete?.fileName) {
      const filePath = PHOTO_DIRECTORY + photoToDelete.fileName;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    }
    
    // Remove from metadata
    const updatedPhotos = existingPhotos.filter(
      (photo) => photo.id !== photoId
    );
    await AsyncStorage.setItem(
      PHOTO_STORAGE_KEY,
      JSON.stringify(updatedPhotos)
    );
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
};

export const getFirstPhotoOfEachType = async (): Promise<{
  [key: string]: Photo | null;
}> => {
  try {
    const allPhotos = await getPhotos();
    const result: { [key: string]: Photo | null } = {
      front: null,
      side: null,
      back: null,
    };

    for (const photo of allPhotos) {
      if (!result[photo.type]) {
        result[photo.type] = photo;
      }
    }

    return result;
  } catch (error) {
    console.error("Error getting first photo of each type:", error);
    throw error;
  }
};

// Get storage information
export const getStorageInfo = async (): Promise<{
  totalPhotos: number;
  directorySize: number;
  directoryPath: string;
}> => {
  try {
    await ensureDirectoryExists();
    const photos = await getPhotos();
    
    let totalSize = 0;
    const files = await FileSystem.readDirectoryAsync(PHOTO_DIRECTORY);
    
    for (const file of files) {
      const filePath = PHOTO_DIRECTORY + file;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && !fileInfo.isDirectory) {
        totalSize += fileInfo.size || 0;
      }
    }
    
    return {
      totalPhotos: photos.length,
      directorySize: totalSize,
      directoryPath: PHOTO_DIRECTORY,
    };
  } catch (error) {
    console.error("Error getting storage info:", error);
    throw error;
  }
};

// Clean up orphaned files (files that exist on disk but not in metadata)
export const cleanupOrphanedFiles = async (): Promise<void> => {
  try {
    await ensureDirectoryExists();
    const photos = await getPhotos();
    const photoFileNames = photos.map(photo => photo.fileName).filter(Boolean);
    
    const files = await FileSystem.readDirectoryAsync(PHOTO_DIRECTORY);
    
    for (const file of files) {
      if (!photoFileNames.includes(file)) {
        const filePath = PHOTO_DIRECTORY + file;
        await FileSystem.deleteAsync(filePath);
        console.log(`Deleted orphaned file: ${file}`);
      }
    }
  } catch (error) {
    console.error("Error cleaning up orphaned files:", error);
    throw error;
  }
};
