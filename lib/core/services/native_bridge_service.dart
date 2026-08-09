import 'package:flutter/services.dart';

class NativeBridgeService {
  static const MethodChannel _channel = MethodChannel('com.masa.petmaya/native_bridge');

  static Future<void> scheduleAlarm({
    required String id,
    required String title,
    required int timestamp,
    bool isFeeding = false,
  }) async {
    try {
      await _channel.invokeMethod('scheduleAlarm', {
        'id': id,
        'title': title,
        'timestamp': timestamp,
        'isFeeding': isFeeding,
      });
    } on PlatformException catch (e) {
      print("Failed to schedule alarm: '${e.message}'.");
    }
  }

  static Future<void> cancelAlarm(String id) async {
    try {
      await _channel.invokeMethod('cancelAlarm', {'id': id});
    } on PlatformException catch (e) {
      print("Failed to cancel alarm: '${e.message}'.");
    }
  }
}
