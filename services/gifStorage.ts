import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system/legacy';

export interface GeneratedGif {
  id: string;
  uri: string;
  date: string;
  fileName?: string;
}

const GIF_STORAGE_KEY = "FITNESS_TRACKER_GIFS";
const GIF_DIRECTORY = FileSystem.documentDirectory + 'FitSnapshot/gifs/';

const ensureDirectoryExists = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(GIF_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(GIF_DIRECTORY, { intermediates: true });
  }
};

export const saveGif = async (gif: { id: string; uri: string; date: string }): Promise<void> => {
  try {
    await ensureDirectoryExists();

    const fileName = `gif_${gif.id}.gif`;
    const newPath = GIF_DIRECTORY + fileName;

    await FileSystem.copyAsync({
      from: gif.uri,
      to: newPath,
    });

    const gifToSave: GeneratedGif = {
      id: gif.id,
      uri: newPath,
      date: gif.date,
      fileName,
    };

    const existingGifs = await getGifs();
    const updatedGifs = [...existingGifs, gifToSave];
    await AsyncStorage.setItem(GIF_STORAGE_KEY, JSON.stringify(updatedGifs));
  } catch (error) {
    console.error("Error saving GIF:", error);
    throw error;
  }
};

export const getGifs = async (): Promise<GeneratedGif[]> => {
  try {
    const gifsJson = await AsyncStorage.getItem(GIF_STORAGE_KEY);
    return gifsJson ? JSON.parse(gifsJson) : [];
  } catch (error) {
    console.error("Error getting GIFs:", error);
    throw error;
  }
};

export const deleteGif = async (gifId: string): Promise<void> => {
  try {
    const existingGifs = await getGifs();
    const gifToDelete = existingGifs.find((gif) => gif.id === gifId);

    if (gifToDelete?.fileName) {
      const filePath = GIF_DIRECTORY + gifToDelete.fileName;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    }

    const updatedGifs = existingGifs.filter((gif) => gif.id !== gifId);
    await AsyncStorage.setItem(GIF_STORAGE_KEY, JSON.stringify(updatedGifs));
  } catch (error) {
    console.error("Error deleting GIF:", error);
    throw error;
  }
};
