# R8 rules. Flutter, Firebase, Google Maps/Play services and WorkManager all ship their own consumer rules, so nothing
# here keeps whole packages: blanket `-keep class pkg.** { *; }` rules stop R8 from shrinking and optimising that code.

## Firebase finds its components by class name from the manifest and creates each registrar through its no-argument
## constructor. The library rules keep the classes but not that constructor, so keep it (this replaces keeping all of
## com.google.firebase.**).
-keep class * implements com.google.firebase.components.ComponentRegistrar { <init>(); }

## Play Core: the Flutter engine references the deferred-components classes, which this app does not use.
-dontwarn com.google.android.play.core.**

## firebase_app_check's SafetyNet provider is excluded from the build (see build.gradle.kts); only the plugin's own
## reference to it remains and is never reached (the app activates Play Integrity / Debug only).
-dontwarn com.google.firebase.appcheck.safetynet.**
-dontwarn com.google.android.gms.safetynet.**
