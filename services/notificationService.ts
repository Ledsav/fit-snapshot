import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

export class NotificationService {
  static async scheduleReminder(
    hours: number,
    minutes: number
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time for your progress photo!",
        body: "Don't forget to take your daily progress picture.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  static async cancelReminder(id: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  static async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async getScheduledReminders(): Promise<
    Notifications.NotificationRequest[]
  > {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      // Not global `alert()` — that's a web-only API with no polyfill in
      // React Native and would throw a ReferenceError here instead of
      // showing anything.
      Alert.alert("Permission Required", "Failed to get permission for notifications.");
      return false;
    }
    return true;
  }

  static async setupNotifications(): Promise<void> {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
}
