import React, { useState, useLayoutEffect } from "react";
import { View, StyleSheet, ActivityIndicator, ColorValue } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingCarousel } from "@/components/onBoarding/OnboardingCarousel";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: ColorValue;
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}

function TabNavigator() {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  const getActiveIconStyle = () => ({
    backgroundColor: theme.tint + "20",
  });

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          ...styles.tabBar,
          backgroundColor: theme.cardBackground,
        },
        tabBarItemStyle: styles.tabBarItem,
        tabBarShowLabel: false,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && getActiveIconStyle(),
              ]}
            >
              <TabBarIcon name="home" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && getActiveIconStyle(),
              ]}
            >
              <TabBarIcon name="camera" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && getActiveIconStyle(),
              ]}
            >
              <TabBarIcon name="bar-chart" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && getActiveIconStyle(),
              ]}
            >
              <TabBarIcon name="images" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.iconContainer,
                focused && getActiveIconStyle(),
              ]}
            >
              <TabBarIcon name="settings" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
export default function RootLayout() {
  const [state, setState] = useState({
    isOnboardingComplete: null as boolean | null,
    isLoading: true,
  });
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  useLayoutEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboardingCompleted = await AsyncStorage.getItem(
        "onboardingCompleted"
      );
      setState({
        isOnboardingComplete: onboardingCompleted === "true",
        isLoading: false,
      });
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setState({
        isOnboardingComplete: false,
        isLoading: false,
      });
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem("onboardingCompleted", "true");
      setState((prevState) => ({
        ...prevState,
        isOnboardingComplete: true,
      }));
    } catch (error) {
      console.error("Error setting onboarding status:", error);
    }
  };

  if (state.isLoading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.background }]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      {!state.isOnboardingComplete ? (
        <OnboardingCarousel onComplete={handleOnboardingComplete} />
      ) : (
        <TabNavigator />
      )}
    </>
  );
}
const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    borderTopWidth: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
