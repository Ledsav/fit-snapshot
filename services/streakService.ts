import AsyncStorage from "@react-native-async-storage/async-storage";
import { Photo } from "./photoStorage";

const STREAK_KEY = "fitness_tracker_streak";
const LAST_PHOTO_DATE_KEY = "fitness_tracker_last_photo_date";
const BEST_STREAK_KEY = "fitness_tracker_best_streak";

export interface StreakData {
  currentStreak: number;
  lastPhotoDate: string | null;
  bestStreak: number;
}

export const StreakService = {
  calculateStreak: (photos: Photo[]): number => {
    console.log(photos.length);
    if (photos.length === 0) return 0;

    const sortedPhotos = [...photos].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = today;

    for (const photo of sortedPhotos) {
      const photoDate = new Date(photo.date);
      photoDate.setHours(0, 0, 0, 0);

      if (photoDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (photoDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  },

  saveStreakData: async (streakData: StreakData): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        STREAK_KEY,
        streakData.currentStreak.toString()
      );
      await AsyncStorage.setItem(
        LAST_PHOTO_DATE_KEY,
        streakData.lastPhotoDate || ""
      );
      await AsyncStorage.setItem(
        BEST_STREAK_KEY,
        String(streakData.bestStreak)
      );
    } catch (error) {
      console.error("Error saving streak data:", error);
    }
  },

  getStreakData: async (): Promise<StreakData> => {
    try {
      const streakString = await AsyncStorage.getItem(STREAK_KEY);
      const lastPhotoDate = await AsyncStorage.getItem(LAST_PHOTO_DATE_KEY);
      const bestString = await AsyncStorage.getItem(BEST_STREAK_KEY);
      return {
        currentStreak: streakString ? parseInt(streakString, 10) : 0,
        lastPhotoDate: lastPhotoDate || null,
        bestStreak: bestString ? parseInt(bestString, 10) : 0,
      };
    } catch (error) {
      console.error("Error getting streak data:", error);
      return { currentStreak: 0, lastPhotoDate: null, bestStreak: 0 };
    }
  },

  updateStreak: async (newPhoto: Photo): Promise<StreakData> => {
    const { lastPhotoDate, bestStreak: previousBest } = await StreakService.getStreakData();
    const newPhotoDate = new Date(newPhoto.date);
    newPhotoDate.setHours(0, 0, 0, 0);

    let updatedStreak: StreakData;

    if (!lastPhotoDate) {
      // First photo ever
      updatedStreak = {
        currentStreak: 1,
        lastPhotoDate: newPhotoDate.toISOString(),
        bestStreak: Math.max(previousBest, 1),
      };
    } else {
      const lastDate = new Date(lastPhotoDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (
        newPhotoDate.getTime() === today.getTime() &&
        lastDate.getTime() === today.getTime() - 86400000
      ) {
        // Photo taken today, and there was a photo yesterday
        const { currentStreak } = await StreakService.getStreakData();
        updatedStreak = {
          currentStreak: currentStreak + 1,
          lastPhotoDate: newPhotoDate.toISOString(),
          bestStreak: Math.max(previousBest, currentStreak + 1),
        };
      } else if (newPhotoDate.getTime() > lastDate.getTime()) {
        // New photo is more recent, but streak was broken
        updatedStreak = {
          currentStreak: 1,
          lastPhotoDate: newPhotoDate.toISOString(),
          bestStreak: Math.max(previousBest, 1),
        };
      } else {
        // New photo is older than the last recorded photo, no change in streak
        const { currentStreak } = await StreakService.getStreakData();
        updatedStreak = { currentStreak, lastPhotoDate, bestStreak: Math.max(previousBest, currentStreak) };
      }
    }

    await StreakService.saveStreakData(updatedStreak);
    return updatedStreak;
  },
};
