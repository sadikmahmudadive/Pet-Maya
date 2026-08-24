import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:workmanager/workmanager.dart';
import 'notification_service.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      // Ensure Firebase is ready for background tasks if needed
      await Firebase.initializeApp();
      debugPrint("Pet Maya Background Task Executing: $task");
      return Future.value(true);
    } catch (e) {
      debugPrint("Background Task Error: $e");
      return Future.value(false);
    }
  });
}

/// Top-level background message handler for FCM
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  
  debugPrint("Handling a background message: ${message.messageId}");
  
  // Show local notification for data-only messages in background
  final ns = NotificationService();
  ns.handleRemoteMessage(message); // Re-use logic to trigger local notification
}
