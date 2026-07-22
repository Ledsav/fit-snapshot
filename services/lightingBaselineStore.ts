import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PhotoType } from "@/enums/Photos";

const keyFor = (type: PhotoType) => `lighting.baseline.override.${type}`;

export const LightingBaselineStore = {
  async getOverride(type: PhotoType): Promise<number | null> {
    const raw = await AsyncStorage.getItem(keyFor(type));
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  },

  async setOverride(type: PhotoType, value: number): Promise<void> {
    await AsyncStorage.setItem(keyFor(type), String(value));
  },
};
