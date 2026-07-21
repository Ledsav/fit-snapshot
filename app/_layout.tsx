import "react-native-gesture-handler";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
} from "@expo-google-fonts/fraunces";
import {
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
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
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "@/context/AuthContext";
import { GifProvider } from "@/context/GifContext";
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
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <LocalizationProvider>
            <AppThemeProvider>
              <UserProvider>
                <PhotoProvider>
                  <GifProvider>
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                    </Stack>
                  </GifProvider>
                </PhotoProvider>
              </UserProvider>
            </AppThemeProvider>
          </LocalizationProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
