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

  static const String channelHealth = 'health_alerts_channel';
  static const String channelFeeding = 'feeding_schedule_channel';
  static const String channelGeneral = 'high_importance_channel';

  /// Initialize the notification service
  Future<void> initialize() async {
    if (_initialized) return;

    // 1. Request permissions for iOS and Android 13+
    await requestPermissions();

    final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
        _localNotifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();

    // 2. Create Health & Medical Channel
    const AndroidNotificationChannel healthChannel = AndroidNotificationChannel(
      channelHealth,
      'Pet Health & Medical Alerts',
      description: 'Urgent notifications for vaccinations, medications, and health anomalies.',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    await androidImplementation?.createNotificationChannel(healthChannel);

    // 3. Create Feeding & Diet Channel
    const AndroidNotificationChannel feedingChannel = AndroidNotificationChannel(
      channelFeeding,
      'Feeding & Nutrition Schedule',
      description: 'Daily meal times, water reminders, and nutrition alerts.',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    await androidImplementation?.createNotificationChannel(feedingChannel);

    // 4. Create General Pet Care & Events Channel
    const AndroidNotificationChannel generalChannel = AndroidNotificationChannel(
      channelGeneral,
      'Critical Pet Care & Events',
      description: 'Calendar appointments, vet visits, and general reminders.',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    await androidImplementation?.createNotificationChannel(generalChannel);

    // 5. Setup Local Notifications for Foreground display
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
        debugPrint('[NotificationService] Notification clicked: ${details.payload}');
      },
    );

    // 6. Configure FCM Listeners
    FirebaseMessaging.onMessage.listen(handleRemoteMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);

    _initialized = true;
    debugPrint('[NotificationService] Initialized multi-channel alerts (Health, Feeding, Events)');
  }

  Future<void> subscribeToTopic(String topic) async {
    await _fcm.subscribeToTopic(topic);
    debugPrint('[NotificationService] Subscribed to topic: $topic');
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    await _fcm.unsubscribeFromTopic(topic);
    debugPrint('[NotificationService] Unsubscribed from topic: $topic');
  }

  /// Request notification permissions
  Future<void> requestPermissions() async {
    final status = await Permission.notification.request();
    if (status.isGranted) {
      debugPrint('Notification permission granted');
    } else {
      debugPrint('Notification permission denied');
    }

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
  void handleRemoteMessage(RemoteMessage message) {
    String title = message.notification?.title ?? message.data['title'] ?? 'Pet Maya Alert';
    String body = message.notification?.body ?? message.data['body'] ?? message.data['message'] ?? '';
    String category = message.data['category'] ?? message.data['type'] ?? 'general';

    if (body.isEmpty && message.notification == null) return;

    if (category.toLowerCase().contains('health') || category.toLowerCase().contains('medication') || category.toLowerCase().contains('vaccin')) {
      showHealthAlert(
        title: title.isNotEmpty ? title : 'Pet Health Alert 🩺',
        body: body,
        payload: message.data.toString(),
      );
    } else if (category.toLowerCase().contains('feed') || category.toLowerCase().contains('food') || category.toLowerCase().contains('diet')) {
      showFeedingAlert(
        title: title.isNotEmpty ? title : 'Meal Time Reminder 🍲',
        body: body,
        payload: message.data.toString(),
      );
    } else {
      showEventAlert(
        title: title.isNotEmpty ? title : 'Pet Care Reminder 📅',
        body: body,
        payload: message.data.toString(),
      );
    }
  }

  /// Handle notification tap when the app is in background/terminated
  void _handleMessageTap(RemoteMessage message) {
    debugPrint('FCM Notification Tapped: ${message.data}');
  }

  /// Trigger a Health Alert Notification (High priority)
  Future<void> showHealthAlert({
    required String title,
    required String body,
    String? payload,
    int? id,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      channelHealth,
      'Pet Health & Medical Alerts',
      channelDescription: 'Urgent notifications for vaccinations, medications, and health anomalies.',
      importance: Importance.max,
      priority: Priority.max,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      fullScreenIntent: true,
      category: AndroidNotificationCategory.alarm,
      visibility: NotificationVisibility.public,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(
        presentAlert: true, 
        presentBadge: true, 
        presentSound: true,
        interruptionLevel: InterruptionLevel.critical,
      ),
    );

    await _localNotifications.show(
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      platformDetails,
      payload: payload,
    );
  }

  /// Trigger a Feeding / Diet Schedule Notification
  Future<void> showFeedingAlert({
    required String title,
    required String body,
    String? payload,
    int? id,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      channelFeeding,
      'Feeding & Nutrition Schedule',
      channelDescription: 'Daily meal times, water reminders, and nutrition alerts.',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      category: AndroidNotificationCategory.reminder,
      visibility: NotificationVisibility.public,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(
        presentAlert: true, 
        presentBadge: true, 
        presentSound: true,
        interruptionLevel: InterruptionLevel.timeSensitive,
      ),
    );

    await _localNotifications.show(
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      platformDetails,
      payload: payload,
    );
  }

  /// Trigger a General Event / Appointment Notification
  Future<void> showEventAlert({
    required String title,
    required String body,
    String? payload,
    int? id,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      channelGeneral,
      'Critical Pet Care & Events',
      channelDescription: 'Calendar appointments, vet visits, and general reminders.',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      visibility: NotificationVisibility.public,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(
        presentAlert: true, 
        presentBadge: true, 
        presentSound: true,
      ),
    );

    await _localNotifications.show(
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      platformDetails,
      payload: payload,
    );
  }

  /// Cancel all or specific notifications
  Future<void> cancel(int id) async {
    await _localNotifications.cancel(id);
  }

  Future<void> cancelAll() async {
    await _localNotifications.cancelAll();
  }
}
