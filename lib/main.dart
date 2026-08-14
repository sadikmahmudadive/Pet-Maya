import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:workmanager/workmanager.dart';
import 'core/theme/app_theme.dart';
import 'core/services/notification_service.dart';
import 'core/services/notification_handlers.dart';
import 'data/repositories/app_state_repository.dart';
import 'presentation/auth/splash_screen.dart';
import 'presentation/common_widgets/global_offline_banner.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  await dotenv.load(fileName: ".env");

  // Initialize Firebase before the app runs
  await Firebase.initializeApp();

  // Initialize Notification Service
  final notificationService = NotificationService();
  await notificationService.initialize();
  
  // Set background messaging handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // Initialize Workmanager for battery-optimization-aware tasks
  Workmanager().initialize(callbackDispatcher);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppStateRepository()),
      ],
      child: const TailWaggingApp(),
    ),
  );
}

class TailWaggingApp extends StatelessWidget {
  const TailWaggingApp({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

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
