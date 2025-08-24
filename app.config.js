module.exports = {
  expo: {
    name: "سمسم",
    slug: "simsim",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#00C897"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.twfy.simsim"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#00C897"
      },
      package: "com.twfy.simsim",
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#00C897"
        }
      ]
    ]
  }
};
