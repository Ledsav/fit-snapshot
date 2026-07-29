module.exports = {
  expo: {
    name: "FitSnapshot",
    slug: "FitSnapshot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo-fs.png",
    scheme: [
      "fitsnapshot"
    ],
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "Allow $(PRODUCT_NAME) to access your camera."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon-fs.png",
        backgroundColor: "#000000"
      },
      package: "com.ledsav.fitsnapshot",
      versionCode: 2,
      // EAS Build injects this from the GOOGLE_SERVICES_JSON file-type env
      // var; the local fallback path is for local/native builds where you've
      // downloaded the file yourself to the project root (gitignored).
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_MEDIA_LOCATION",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_MEDIA_LOCATION",
        "android.permission.CAMERA"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-notifications",
      "expo-localization",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo-fs.png",
          resizeMode: "contain",
          backgroundColor: "#000000"
        }
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
          isAccessMediaLocationEnabled: true,
          granularPermissions: [
            "photo"
          ]
        }
      ],
      "expo-build-properties",
      "expo-sharing",
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "0b5c8589-3aaf-4eae-b40b-5ca83c4c1e78"
      }
    }
  }
};
