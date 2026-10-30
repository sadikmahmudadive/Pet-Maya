plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
    // Firebase Google Services
    id("com.google.gms.google-services")
    // Firebase Crashlytics
    id("com.google.firebase.crashlytics")
    // Firebase Performance Monitoring
    id("com.google.firebase.firebase-perf")
}

import java.util.Properties
import java.io.FileInputStream
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

val keystoreProperties = Properties()
val keystorePropertiesFile = rootProject.file("key.properties")
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    namespace = "com.vertexhand.petmaya"
    // The app targets Android 17 (API 37). These never go below 37, even if the installed Flutter's default is older;
    // a newer Flutter default is still followed.
    compileSdk = maxOf(flutter.compileSdkVersion, 37)
    ndkVersion = "28.2.13676358"

    compileOptions {
        isCoreLibraryDesugaringEnabled = true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.vertexhand.petmaya"
        minSdk = flutter.minSdkVersion
        targetSdk = maxOf(flutter.targetSdkVersion, 37)
        versionCode = flutter.versionCode
        versionName = flutter.versionName
        multiDexEnabled = true
    }

    signingConfigs {
        create("release") {
            val keyAliasProp = keystoreProperties["keyAlias"] as? String
            val keyPasswordProp = keystoreProperties["keyPassword"] as? String
            val storePasswordProp = keystoreProperties["storePassword"] as? String
            val storeFileProp = keystoreProperties["storeFile"]?.let { file(it.toString()) }

            if (keyAliasProp != null && keyPasswordProp != null && storePasswordProp != null && storeFileProp != null && storeFileProp.exists()) {
                keyAlias = keyAliasProp
                keyPassword = keyPasswordProp
                storeFile = storeFileProp
                storePassword = storePasswordProp
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            val releaseSigning = signingConfigs.getByName("release")
            if (releaseSigning.storeFile?.exists() == true) {
                signingConfig = releaseSigning
            } else {
                signingConfig = signingConfigs.getByName("debug")
            }
        }
    }
}

tasks.withType<KotlinCompile>().configureEach {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

flutter {
    source = "../.."
}

dependencies {
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")
    implementation("androidx.core:core:1.13.1")
    implementation("com.google.firebase:firebase-messaging:24.0.0")
    implementation("com.google.firebase:firebase-database:21.0.0")
    implementation("androidx.browser:browser:1.8.0")
    implementation(platform("com.google.firebase:firebase-bom:33.1.2"))
    implementation("com.google.firebase:firebase-appcheck-playintegrity")
    implementation("com.google.firebase:firebase-appcheck-debug")
}

configurations.all {
    // The SafetyNet attestation API is retired and Play flags play-services-safetynet. firebase_app_check still bundles its
    // SafetyNet provider, but this app only ever activates the Play Integrity (release) and Debug providers (lib/main.dart).
    exclude(group = "com.google.android.gms", module = "play-services-safetynet")
    exclude(group = "com.google.firebase", module = "firebase-appcheck-safetynet")
    resolutionStrategy {
        force("androidx.browser:browser:1.8.0")
        force("androidx.activity:activity:1.9.3")
        force("androidx.activity:activity-ktx:1.9.3")
        force("androidx.core:core:1.13.1")
        force("androidx.core:core-ktx:1.13.1")
        force("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
        force("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
        force("androidx.lifecycle:lifecycle-livedata-ktx:2.8.7")
    }
}
