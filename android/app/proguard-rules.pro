# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Expo Modules
-keep class expo.modules.** { *; }
-keep class expo.modules.core.** { *; }
-keep class expo.modules.notifications.** { *; }
-keep class expo.modules.application.** { *; }

# Expo Notifications
-keep class expo.notifications.** { *; }
-keep class expo.notifications.service.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep Hermes
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep Supabase classes
-keep class io.supabase.** { *; }
-keep class com.supabase.** { *; }

# Keep encryption classes
-keep class com.oblador.keychain.** { *; }
-keep class com.reactnativeencryptedstorage.** { *; }

# Keep AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep navigation classes
-keep class com.swmansion.navigation.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Keep image picker
-keep class expo.imagepicker.** { *; }

# Keep location services
-keep class expo.location.** { *; }

# Keep camera
-keep class expo.camera.** { *; }

# Keep file system
-keep class expo.filesystem.** { *; }

# Keep device info
-keep class expo.device.** { *; }

# Keep constants
-keep class expo.constants.** { *; }

# Keep media library
-keep class expo.medialibrary.** { *; }

# Keep permissions
-keep class expo.permissions.** { *; }

# Keep status bar
-keep class expo.statusbar.** { *; }

# Keep linear gradient
-keep class expo.lineargradient.** { *; }

# Keep document picker
-keep class expo.documentpicker.** { *; }

# Keep maps
-keep class com.airbnb.android.react.maps.** { *; }

# Keep dialog
-keep class com.aakashns.reactnativedialogs.** { *; }

# Add any project specific keep options here:

# Keep all classes in the app package
-keep class com.twfy.simsim.** { *; }

# Keep all classes with @Keep annotation
-keep class * {
    @androidx.annotation.Keep *;
}

# Keep all classes with @Keep annotation from support library
-keep class * {
    @android.support.annotation.Keep *;
}

# Keep all classes with @Keep annotation from AndroidX
-keep class * {
    @androidx.annotation.Keep *;
}
