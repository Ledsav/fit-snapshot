import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Photo {
  id: string;
  uri: string;
  date: string;
  type: "front" | "side" | "back";
}

const PHOTO_STORAGE_KEY = "FITNESS_TRACKER_PHOTOS";

export const savePhoto = async (photo: Photo): Promise<void> => {
  try {
    const existingPhotos = await getPhotos();
    const updatedPhotos = [...existingPhotos, photo];
    await AsyncStorage.setItem(
      PHOTO_STORAGE_KEY,
      JSON.stringify(updatedPhotos)
    );
  } catch (error) {
    console.error("Error saving photo:", error);
  }
};

export const getPhotos = async (): Promise<Photo[]> => {
  try {
    const photosJson = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);
    return photosJson ? JSON.parse(photosJson) : [];
  } catch (error) {
    console.error("Error getting photos:", error);
    return [];
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
    return [];
  }
};
export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    const existingPhotos = await getPhotos();
    const updatedPhotos = existingPhotos.filter(
      (photo) => photo.id !== photoId
    );
    await AsyncStorage.setItem(
      PHOTO_STORAGE_KEY,
      JSON.stringify(updatedPhotos)
    );
  } catch (error) {
    console.error("Error deleting photo:", error);
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
    return { front: null, side: null, back: null };
  }
};
