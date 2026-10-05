import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_callkit_incoming/entities/entities.dart';
import 'package:flutter_callkit_incoming/flutter_callkit_incoming.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:workmanager/workmanager.dart';
import 'notification_service.dart';
import 'call_service.dart';

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

    // Tele-vet calls: raise the native ringing UI / dismiss it.
    final type = message.data['type'];
    if (type == 'incoming_call') {
      await CallService.showIncoming(
        callId: message.data['callId'] ?? '',
        callerName: message.data['callerName'] ?? 'Pet Maya',
        callerId: message.data['callerId'] ?? '',
        petName: message.data['petName'] ?? '',
        appointmentId: message.data['appointmentId'],
      );
      // Keep this isolate alive while ringing so Decline (app not running)
      // can still reach Firestore.
      final done = Completer<void>();
      final sub = FlutterCallkitIncoming.onEvent.listen((event) async {
        if (event is CallEventActionCallDecline) {
          await CallService.declineCall(event.callKitParams.id);
          if (!done.isCompleted) done.complete();
        } else if (event is CallEventActionCallAccept || event is CallEventActionCallTimeout) {
          if (!done.isCompleted) done.complete();
        }
      });
      await done.future.timeout(const Duration(seconds: 65), onTimeout: () {});
      await sub.cancel();
      return;
    }
    if (type == 'call_ended') {
      await CallService.hideIncoming(message.data['callId'] ?? '');
      return;
    }

    // Messages with a notification payload are displayed by the OS itself;
    // showing a local copy here would duplicate them.
    if (message.notification != null) return;

    final ns = NotificationService();
    await ns.initialize();
    ns.handleRemoteMessage(message);
  } catch (e) {
    debugPrint("Error handling background FCM message: $e");
  }
}
