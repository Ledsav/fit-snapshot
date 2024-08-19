import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Photo {
  id: string;
  uri: string;
  date: string;
  type: 'front' | 'side' | 'back';
}

const PHOTO_STORAGE_KEY = 'FITNESS_TRACKER_PHOTOS';

export const savePhoto = async (photo: Photo): Promise<void> => {
  try {
    const existingPhotos = await getPhotos();
    const updatedPhotos = [...existingPhotos, photo];
    await AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(updatedPhotos));
  } catch (error) {
    console.error('Error saving photo:', error);
  }
};

export const getPhotos = async (): Promise<Photo[]> => {
  try {
    const photosJson = await AsyncStorage.getItem(PHOTO_STORAGE_KEY);
    return photosJson ? JSON.parse(photosJson) : [];
  } catch (error) {
    console.error('Error getting photos:', error);
    return [];
  }
};

export const deletePhoto = async (photoId: string): Promise<void> => {
  try {
    const existingPhotos = await getPhotos();
    const updatedPhotos = existingPhotos.filter(photo => photo.id !== photoId);
    await AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(updatedPhotos));
  } catch (error) {
    console.error('Error deleting photo:', error);
  }
};