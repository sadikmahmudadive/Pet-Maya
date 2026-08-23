## Flutter wrapper & plugins
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.engine.deferredcomponents.**

## Play Core (Suppresses missing optional deferred component classes)
-dontwarn com.google.android.play.core.**

## Google Maps & Play Services
-keep class com.google.android.gms.maps.** { *; }
-keep interface com.google.android.gms.maps.** { *; }
-dontwarn com.google.android.gms.**

## Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

## AndroidX & WorkManager
-keep class androidx.work.** { *; }
-dontwarn androidx.work.**
