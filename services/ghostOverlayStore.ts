import AsyncStorage from "@react-native-async-storage/async-storage";

const GHOST_OVERLAY_ENABLED_KEY = "ghostOverlay.enabled";

export const GhostOverlayStore = {
  async getEnabled(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(GHOST_OVERLAY_ENABLED_KEY);
    return raw === "true";
  },

  async setEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(GHOST_OVERLAY_ENABLED_KEY, value ? "true" : "false");
  },
};
