import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:workmanager/workmanager.dart';
import 'notification_service.dart';

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    bool success = false;
    try {
      await Firebase.initializeApp();
      debugPrint("Pet Maya Background Task Executing: $task");
      success = true;
    } catch (e) {
      debugPrint("Background Task Error: $e");
      success = false;
    }
    return success;
  });
}

/// Top-level background message handler for FCM.
/// Guarantees background & terminated messages generate heads-up system notifications.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
    debugPrint("Handling background FCM message: ${message.messageId}");

    final ns = NotificationService();
    await ns.initialize();
    ns.handleRemoteMessage(message);
  } catch (e) {
    debugPrint("Error handling background FCM message: $e");
  }
}
