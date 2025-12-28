# ProGuard rules for Colección Nuevo Ser
# Configured: 2025-12-28

# ============================================
# GENERAL ANDROID RULES
# ============================================

# Keep line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep annotations
-keepattributes *Annotation*

# ============================================
# CAPACITOR / WEBVIEW
# ============================================

# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Keep Capacitor community plugins
-keep class com.getcapacitor.community.** { *; }
-dontwarn com.getcapacitor.community.**

# Keep JavaScript interfaces for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView classes
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
    public void *(android.webkit.WebView, java.lang.String);
}

# ============================================
# FIREBASE
# ============================================

# Firebase Cloud Messaging
-keep class com.google.firebase.** { *; }
-keep interface com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# Firebase Messaging Service
-keep class com.google.firebase.messaging.FirebaseMessagingService { *; }
-keep class * extends com.google.firebase.messaging.FirebaseMessagingService { *; }

# Firebase Analytics
-keep class com.google.android.gms.measurement.** { *; }
-dontwarn com.google.android.gms.measurement.**

# ============================================
# KOTLIN
# ============================================

-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}
-dontwarn kotlin.**
-dontwarn kotlinx.**

# Kotlin coroutines
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# ============================================
# ANDROIDX
# ============================================

-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# ============================================
# TEXT-TO-SPEECH (Capacitor Community)
# ============================================

-keep class com.capacitor.community.tts.** { *; }
-dontwarn com.capacitor.community.tts.**

# ============================================
# BIOMETRIC AUTH
# ============================================

-keep class com.aparajita.capacitor.biometricauth.** { *; }
-dontwarn com.aparajita.capacitor.biometricauth.**

# ============================================
# LOCAL NOTIFICATIONS
# ============================================

-keep class com.capacitorjs.plugins.localnotifications.** { *; }
-dontwarn com.capacitorjs.plugins.localnotifications.**

# ============================================
# APP SPECIFIC CLASSES
# ============================================

# Keep custom services
-keep class com.nuevosser.coleccion.** { *; }
-keep class * extends android.app.Service { *; }
-keep class * extends android.content.BroadcastReceiver { *; }

# Keep tile service
-keep class * extends android.service.quicksettings.TileService { *; }

# Keep widget providers
-keep class * extends android.appwidget.AppWidgetProvider { *; }

# ============================================
# SERIALIZATION
# ============================================

# Keep Gson/JSON serialization
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ============================================
# OPTIMIZATIONS
# ============================================

# Don't obfuscate Android framework classes
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider
-keep public class * extends android.preference.Preference

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
