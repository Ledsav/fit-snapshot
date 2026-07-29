import { Alert, Linking } from "react-native";

// Shared by every OS-permission-denied alert in the app (photo save, gallery
// import, ...): once a permission is permanently denied ("don't ask again"),
// re-requesting it silently no-ops forever, so re-prompting the user with
// the same message is a dead end. Route to the system Settings page instead.
export function showPermissionDeniedAlert(
  title: string,
  canAskAgain: boolean,
  deniedMessage: string,
  permanentlyDeniedMessage: string,
  cancelLabel: string,
  openSettingsLabel: string
) {
  if (canAskAgain) {
    Alert.alert(title, deniedMessage);
  } else {
    Alert.alert(title, permanentlyDeniedMessage, [
      { text: cancelLabel, style: "cancel" },
      { text: openSettingsLabel, onPress: () => Linking.openSettings() },
    ]);
  }
}
