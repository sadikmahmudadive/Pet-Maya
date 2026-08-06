import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

/// Top-level background message handler for FCM
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Ensure Firebase is initialized for background tasks
  await Firebase.initializeApp();
  
  debugPrint("Handling a background message: ${message.messageId}");
  // You can perform lightweight background logic here
}
