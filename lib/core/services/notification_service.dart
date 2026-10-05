import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'call_service.dart';

/// Production-grade multi-channel notification manager for Android, iOS, and Web.
/// Guarantees heads-up banners across Foreground, Background, and Terminated app states.
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  static const String channelHealth = 'health_alerts_channel';
  static const String channelFeeding = 'feeding_schedule_channel';
  static const String channelGeneral = 'high_importance_channel';

  /// Initialize the notification service
  Future<void> initialize() async {
    if (_initialized) return;

    // 1. Request permissions for iOS and Android 13+
    await requestPermissions();

    // 2. Configure Foreground Presentation Options (Ensures heads-up banners show while app is open)
    try {
      await _fcm.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (e) {
      debugPrint('[NotificationService] Error setting presentation options: $e');
    }

    final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
        _localNotifications.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    // 3. Create Health & Medical Channel
    const AndroidNotificationChannel healthChannel = AndroidNotificationChannel(
      channelHealth,
      'Pet Health & Medical Alerts',
      description:
          'Urgent notifications for vaccinations, medications, and health anomalies.',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    await androidImplementation?.createNotificationChannel(healthChannel);

    // 4. Create Feeding & Diet Channel
    const AndroidNotificationChannel feedingChannel = AndroidNotificationChannel(
      channelFeeding,
      'Feeding & Nutrition Schedule',
      description: 'Daily meal times, water reminders, and nutrition alerts.',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    await androidImplementation?.createNotificationChannel(feedingChannel);

    // 5. Create General Pet Care & Events Channel
    const AndroidNotificationChannel generalChannel = AndroidNotificationChannel(
      channelGeneral,
      'Critical Pet Care & Events',
      description: 'Calendar appointments, vet visits, and general reminders.',
      importance: Importance.max,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    await androidImplementation?.createNotificationChannel(generalChannel);

    // 6. Setup Local Notifications for Foreground display
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/launcher_icon');
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
        _emitTap(_decodePayload(details.payload));
      },
    );

    // 7. Configure FCM Listeners
    FirebaseMessaging.onMessage.listen(handleRemoteMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);

    // 8. Check for Terminated App Cold-Start Message
    _fcm.getInitialMessage().then((message) {
      if (message != null) {
        _handleMessageTap(message);
      }
    });

    _initialized = true;
    debugPrint(
        '[NotificationService] Initialized multi-channel alerts (Health, Feeding, Events)');
  }

  Future<void> subscribeToTopic(String topic) async {
    try {
      await _fcm.subscribeToTopic(topic);
      debugPrint('[NotificationService] Subscribed to topic: $topic');
    } catch (e) {
      debugPrint('[NotificationService] Error subscribing to topic $topic: $e');
    }
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _fcm.unsubscribeFromTopic(topic);
      debugPrint('[NotificationService] Unsubscribed from topic: $topic');
    } catch (e) {
      debugPrint('[NotificationService] Error unsubscribing from topic $topic: $e');
    }
  }

  /// Request notification permissions
  Future<void> requestPermissions() async {
    try {
      await Permission.notification.request();
      NotificationSettings settings = await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint(
          '[NotificationService] FCM permission status: ${settings.authorizationStatus}');
    } catch (e) {
      debugPrint('[NotificationService] Request permission error: $e');
    }
  }

  /// Get the FCM device token
  Future<String?> getToken() async {
    try {
      return await _fcm.getToken();
    } catch (e) {
      debugPrint('[NotificationService] Error fetching FCM token: $e');
      return null;
    }
  }

  /// Handle messages received while the app is in the foreground or background
  void handleRemoteMessage(RemoteMessage message) {
    final type = message.data['type'];
    if (type == 'incoming_call') return; // CallService's Firestore listener rings in foreground
    if (type == 'call_ended') {
      CallService.hideIncoming(message.data['callId'] ?? '');
      return;
    }
    String title =
        message.notification?.title ?? message.data['title'] ?? 'Pet Maya Alert';
    String body = message.notification?.body ??
        message.data['body'] ??
        message.data['message'] ??
        '';
    String category =
        message.data['category'] ?? message.data['type'] ?? 'general';

    if (body.isEmpty && message.notification == null) return;

    if (category.toLowerCase().contains('health') ||
        category.toLowerCase().contains('medication') ||
        category.toLowerCase().contains('vaccin')) {
      showHealthAlert(
        title: title.isNotEmpty ? title : 'Pet Health Alert 🩺',
        body: body,
        payload: jsonEncode(message.data),
      );
    } else if (category.toLowerCase().contains('feed') ||
        category.toLowerCase().contains('food') ||
        category.toLowerCase().contains('diet')) {
      showFeedingAlert(
        title: title.isNotEmpty ? title : 'Meal Time Reminder 🍲',
        body: body,
        payload: jsonEncode(message.data),
      );
    } else if (category.toLowerCase().contains('social') ||
        category.toLowerCase().contains('comment') ||
        category.toLowerCase().contains('react') ||
        category.toLowerCase().contains('like')) {
      showSocialAlert(
        title: title.isNotEmpty ? title : 'Community Notification 💬',
        body: body,
        payload: jsonEncode(message.data),
      );
    } else {
      showEventAlert(
        title: title.isNotEmpty ? title : 'Pet Care Reminder 📅',
        body: body,
        payload: jsonEncode(message.data),
      );
    }
  }

  /// Handle notification tap when the app is in background/terminated
  void _handleMessageTap(RemoteMessage message) {
    _emitTap(Map<String, dynamic>.from(message.data));
  }

  /// Emits tap payloads (category, url, notificationId...) so the UI layer can
  /// route to the right screen. Taps arriving before a listener attaches
  /// (cold start) are kept in [pendingTap].
  final StreamController<Map<String, dynamic>> _tapController =
      StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get onTap => _tapController.stream;
  Map<String, dynamic>? pendingTap;

  void _emitTap(Map<String, dynamic> data) {
    if (_tapController.hasListener) {
      _tapController.add(data);
    } else {
      pendingTap = data;
    }
  }

  Map<String, dynamic> _decodePayload(String? payload) {
    if (payload == null || payload.isEmpty) return {};
    try {
      final decoded = jsonDecode(payload);
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
    } catch (_) {}
    return {};
  }

  /// Fires with the new token whenever FCM rotates it, so it can be re-synced.
  Stream<String> get onTokenRefresh => _fcm.onTokenRefresh;

  /// Drop this device's token (call on logout so the previous user stops
  /// receiving pushes on a shared device).
  Future<void> deleteToken() async {
    try {
      await _fcm.deleteToken();
    } catch (e) {
      debugPrint('[NotificationService] Error deleting FCM token: $e');
    }
  }

  /// Trigger a Community Social / Reaction / Comment Notification
  Future<void> showSocialAlert({
    required String title,
    required String body,
    String? payload,
    int? id,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      channelGeneral,
      'Community & Social Alerts',
      channelDescription:
          'Notifications for likes, reactions, comments, and community interactions.',
      importance: Importance.max,
      priority: Priority.max,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      category: AndroidNotificationCategory.social,
      visibility: NotificationVisibility.public,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
        interruptionLevel: InterruptionLevel.active,
      ),
    );

    await _localNotifications.show(
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(2147483647),
      title,
      body,
      platformDetails,
      payload: payload,
    );
  }

  /// Trigger a Health Alert Notification (Max priority, full-screen intent ready)
  Future<void> showHealthAlert({
    required String title,
    required String body,
    String? payload,
    int? id,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      channelHealth,
      'Pet Health & Medical Alerts',
      channelDescription:
          'Urgent notifications for vaccinations, medications, and health anomalies.',
      importance: Importance.max,
      priority: Priority.max,
      showWhen: true,
      enableVibration: true,
      playSound: true,
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
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(2147483647),
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
      channelDescription:
          'Daily meal times, water reminders, and nutrition alerts.',
      importance: Importance.max,
      priority: Priority.max,
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
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(2147483647),
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
      channelDescription:
          'Calendar appointments, vet visits, and general reminders.',
      importance: Importance.max,
      priority: Priority.max,
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
      id ?? DateTime.now().millisecondsSinceEpoch.remainder(2147483647),
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
