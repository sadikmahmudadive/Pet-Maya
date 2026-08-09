import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  /// Initialize the notification service
  Future<void> initialize() async {
    if (_initialized) return;

    // 1. Request permissions for iOS and Android 13+
    await requestPermissions();

    // 2. Create High Importance Channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel', // id
      'Critical Pet Care Alerts', // title
      description: 'Used for urgent pet health and medication reminders.', // description
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );

    final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
        _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

    await androidImplementation?.createNotificationChannel(channel);

    // 3. Setup Local Notifications for Foreground display
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/launcher_icon');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification tap logic here
        debugPrint('Notification clicked: ${details.payload}');
      },
    );

    // 3. Configure FCM Listeners
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);
    
    // Background message handler must be a top-level function
    // FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    _initialized = true;
    debugPrint('[NotificationService] Initialized');
  }

  /// Request notification permissions
  Future<void> requestPermissions() async {
    // Permission handler for Android 13+ and iOS
    final status = await Permission.notification.request();
    if (status.isGranted) {
      debugPrint('Notification permission granted');
    } else {
      debugPrint('Notification permission denied');
    }

    // FCM specific permission request (mainly for iOS)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint('User granted FCM permission: ${settings.authorizationStatus}');
  }

  /// Get the FCM device token
  Future<String?> getToken() async {
    try {
      return await _fcm.getToken();
    } catch (e) {
      debugPrint('Error fetching FCM token: $e');
      return null;
    }
  }

  /// Handle messages received while the app is in the foreground
  void _handleForegroundMessage(RemoteMessage message) {
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null) {
      _showLocalNotification(
        id: notification.hashCode,
        title: notification.title ?? '',
        body: notification.body ?? '',
        payload: message.data.toString(),
      );
    }
  }

  /// Handle notification tap when the app is in background/terminated
  void _handleMessageTap(RemoteMessage message) {
    debugPrint('FCM Notification Tapped: ${message.data}');
    // You can navigate to specific screens based on message.data here
  }

  /// Display a local notification popup
  Future<void> _showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'high_importance_channel',
      'Critical Pet Care Alerts',
      channelDescription: 'Used for urgent pet health and medication reminders.',
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      fullScreenIntent: true, // Modern high-priority alert
      category: AndroidNotificationCategory.alarm, // bypass power optimization
      visibility: NotificationVisibility.public,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(
        presentAlert: true, 
        presentBadge: true, 
        presentSound: true,
        interruptionLevel: InterruptionLevel.critical, // iOS High Priority
      ),
    );

    await _localNotifications.show(id, title, body, platformDetails, payload: payload);
  }
}
