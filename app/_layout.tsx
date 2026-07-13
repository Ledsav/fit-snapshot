import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthContext";
import { LocalizationProvider } from "@/context/LocalizationContext";
import { PhotoProvider } from "@/context/PhotoContext";
import { ThemeProvider as AppThemeProvider } from "@/context/ThemeContext";
import { UserProvider } from "@/context/UserContext";
import { useColorScheme } from "@/hooks/useColorScheme";

export {
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <LocalizationProvider>
          <AppThemeProvider>
            <UserProvider>
              <PhotoProvider>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                </Stack>
              </PhotoProvider>
            </UserProvider>
          </AppThemeProvider>
        </LocalizationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
