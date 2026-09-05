import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:flutter/foundation.dart';
import 'package:google_maps_flutter_android/google_maps_flutter_android.dart';
import 'package:google_maps_flutter_platform_interface/google_maps_flutter_platform_interface.dart';
import 'package:workmanager/workmanager.dart';
import 'core/theme/app_theme.dart';
import 'core/services/notification_service.dart';
import 'core/services/notification_handlers.dart';
import 'data/repositories/app_state_repository.dart';
import 'data/models/pet_model.dart';
import 'data/services/home_widget_service.dart';
import 'presentation/auth/splash_screen.dart';
import 'presentation/common_widgets/global_offline_banner.dart';
import 'presentation/owner/home/pet_tracker_screen.dart';
import 'presentation/owner/pets/ai_health_scanner_screen.dart';
import 'presentation/owner/pets/my_pets_screen.dart';
import 'presentation/owner/calendar/calendar_screen.dart';

/// Custom HttpOverrides to prevent Samsung One UI / Android 13
/// aggressive OS power-saving from tearing down pooled sockets ungracefully.
class ResilientHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    final client = super.createHttpClient(context);
    client.idleTimeout = const Duration(seconds: 15);
    client.connectionTimeout = const Duration(seconds: 15);
    return client;
  }
}

/// Helper to detect transient network dropouts and OS-level socket aborts
bool _isTransientNetworkError(dynamic error) {
  if (error == null) return false;
  final errStr = error.toString().toLowerCase();
  return error is HttpException ||
      error is SocketException ||
      errStr.contains('software caused connection abort') ||
      errStr.contains('connection abort') ||
      errStr.contains('connection closed') ||
      errStr.contains('connection reset') ||
      errStr.contains('broken pipe') ||
      errStr.contains('clientexception') ||
      errStr.contains('failed host lookup');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Protect against Samsung & Android 13 socket teardowns
  HttpOverrides.global = ResilientHttpOverrides();

  // Load environment variables
  await dotenv.load(fileName: ".env");

  // Initialize Firebase before the app runs
  await Firebase.initializeApp();

  // Initialize App Check with Debug support for Emulators
  await FirebaseAppCheck.instance.activate(
    androidProvider: kDebugMode
        ? AndroidProvider.debug
        : AndroidProvider.playIntegrity,
    appleProvider: kDebugMode ? AppleProvider.debug : AppleProvider.deviceCheck,
  );

  // Initialize Google Maps Android Renderer with Latest Vector Map Engine
  final GoogleMapsFlutterPlatform mapsImplementation =
      GoogleMapsFlutterPlatform.instance;
  if (mapsImplementation is GoogleMapsFlutterAndroid) {
    mapsImplementation.useAndroidViewSurface = true;
    try {
      await mapsImplementation.initializeWithRenderer(
        AndroidMapRenderer.latest,
      );
    } catch (e) {
      debugPrint('[Google Maps] Renderer already initialized or error: $e');
    }
  }

  // Pass all uncaught "fatal" errors from the framework to Crashlytics
  FlutterError.onError = (errorDetails) {
    if (_isTransientNetworkError(errorDetails.exception)) {
      debugPrint('[Crashlytics] Non-fatal transient network drop: ${errorDetails.exception}');
      FirebaseCrashlytics.instance.recordError(
        errorDetails.exception,
        errorDetails.stack,
        fatal: false,
        reason: 'Transient network I/O abort (e.g., OS power-save/network switch)',
      );
      return;
    }
    FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
  };

  // Pass all uncaught asynchronous errors that aren't handled by the framework to Crashlytics
  PlatformDispatcher.instance.onError = (error, stack) {
    if (_isTransientNetworkError(error)) {
      debugPrint('[Crashlytics] Non-fatal transient network drop: $error');
      FirebaseCrashlytics.instance.recordError(
        error,
        stack,
        fatal: false,
        reason: 'Transient network I/O abort (e.g., OS power-save/network switch)',
      );
      return true;
    }
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    return true;
  };

  // Initialize Notification Service
  final notificationService = NotificationService();
  await notificationService.initialize();

  // Set background messaging handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // Initialize Workmanager for battery-optimization-aware tasks
  Workmanager().initialize(callbackDispatcher);

  // Initialize Home Widget Service and register deep-link dispatcher
  await HomeWidgetService.init(onDeepLink: (uri) => handleWidgetDeepLink(uri));

  runApp(
    MultiProvider(
      providers: [ChangeNotifierProvider(create: (_) => AppStateRepository())],
      child: const TailWaggingApp(),
    ),
  );
}

void handleWidgetDeepLink(Uri uri) {
  debugPrint('[HomeWidget] Handling Deep Link: $uri');
  final host = uri.host.isNotEmpty ? uri.host : uri.path.replaceAll('/', '');

  WidgetsBinding.instance.addPostFrameCallback((_) {
    final navState = TailWaggingApp.navigatorKey.currentState;
    final context = TailWaggingApp.navigatorKey.currentContext;
    if (navState == null || context == null) {
      // Retry if called while app is cold starting
      Future.delayed(
        const Duration(milliseconds: 600),
        () => handleWidgetDeepLink(uri),
      );
      return;
    }

    final appState = Provider.of<AppStateRepository>(context, listen: false);
    final pet = appState.pets.isNotEmpty
        ? appState.pets.first
        : PetModel(
            petID: 'sample_max',
            ownerID: appState.currentUser?.uid ?? 'guest',
            name: 'Max',
            type: 'Dog',
            breed: 'Golden Retriever',
            age: '3',
            dob: '2023-01-01',
            weight: '28.5',
            gender: 'Male',
            photoUrl:
                'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600',
          );

    switch (host) {
      case 'radar':
      case 'sos':
        navState.push(
          MaterialPageRoute(builder: (_) => PetTrackerScreen(pet: pet)),
        );
        break;
      case 'ai_scan':
        navState.push(
          MaterialPageRoute(builder: (_) => const AiHealthScannerScreen()),
        );
        break;
      case 'passport':
        navState.push(MaterialPageRoute(builder: (_) => const MyPetsScreen()));
        break;
      case 'reminders':
        navState.push(
          MaterialPageRoute(builder: (_) => const CalendarScreen()),
        );
        break;
      case 'home':
      default:
        navState.popUntil((route) => route.isFirst);
        break;
    }
  });
}

class TailWaggingApp extends StatelessWidget {
  const TailWaggingApp({super.key});

  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return Consumer<AppStateRepository>(
      builder: (context, state, _) {
        return MaterialApp(
          navigatorKey: navigatorKey,
          title: 'Pet Maya',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: state.themeMode,
          // Ensure platform-specific scroll physics (Bouncing on iOS)
          scrollBehavior: const MaterialScrollBehavior().copyWith(
            physics: const BouncingScrollPhysics(),
          ),
          builder: (context, child) {
            return GlobalOfflineBanner(child: child ?? const SizedBox.shrink());
          },
          home: const SplashScreen(),
        );
      },
    );
  }
}
