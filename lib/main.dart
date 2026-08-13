import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:workmanager/workmanager.dart';
import 'core/theme/app_theme.dart';
import 'core/services/notification_service.dart';
import 'core/services/notification_handlers.dart';
import 'data/repositories/app_state_repository.dart';
import 'presentation/auth/splash_screen.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'presentation/common_widgets/premium_toast.dart';
import 'dart:async';

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
  Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: false,
  );

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
    return MaterialApp(
      navigatorKey: navigatorKey,
      title: 'Pet Maya',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      // Ensure platform-specific scroll physics (Bouncing on iOS)
      scrollBehavior: const MaterialScrollBehavior().copyWith(
        physics: const BouncingScrollPhysics(),
      ),
      home: const ConnectivityListener(child: SplashScreen()),
    );
  }
}

class ConnectivityListener extends StatefulWidget {
  final Widget child;
  const ConnectivityListener({super.key, required this.child});

  @override
  State<ConnectivityListener> createState() => _ConnectivityListenerState();
}

class _ConnectivityListenerState extends State<ConnectivityListener> {
  late StreamSubscription<List<ConnectivityResult>> _subscription;
  bool? _wasOffline;

  @override
  void initState() {
    super.initState();
    _initConnectivity();
    _subscription = Connectivity().onConnectivityChanged.listen(_updateConnectionStatus);
  }

  Future<void> _initConnectivity() async {
    final results = await Connectivity().checkConnectivity();
    _updateConnectionStatus(results);
  }

  void _updateConnectionStatus(List<ConnectivityResult> results) {
    debugPrint('[Connectivity] Current status: $results');
    final isOffline = results.isEmpty || results.contains(ConnectivityResult.none);
    
    if (_wasOffline == null) {
      _wasOffline = isOffline;
      if (isOffline) {
        // Show initial offline message if app starts without internet
        WidgetsBinding.instance.addPostFrameCallback((_) {
          debugPrint('[Connectivity] Initial state: OFFLINE');
          _showConnectivityToast('Starting in offline mode. Some data may be outdated. 🌐', ToastType.error);
        });
      } else {
        debugPrint('[Connectivity] Initial state: ONLINE');
      }
      return;
    }

    if (isOffline && !_wasOffline!) {
      debugPrint('[Connectivity] Transitioned to OFFLINE');
      _showConnectivityToast('You are offline. Features may be limited. 🌐', ToastType.error);
    } else if (!isOffline && _wasOffline!) {
      debugPrint('[Connectivity] Transitioned to ONLINE');
      _showConnectivityToast('You are back online! Syncing data... ✨', ToastType.success);
    }
    
    _wasOffline = isOffline;
  }

  void _showConnectivityToast(String message, ToastType type) {
    if (!mounted) return;
    
    // Direct UI call instead of going through the repository to avoid context issues
    PremiumToast.show(context, message, type: type);
  }

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
