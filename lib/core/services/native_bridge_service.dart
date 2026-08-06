import 'package:flutter/services.dart';

class NativeBridgeService {
  static const MethodChannel _channel = MethodChannel('com.masa.petmaya/native_bridge');

  /// Launches the native Location Picker activity and returns the selected address
  static Future<String?> openNativeLocationPicker() async {
    try {
      final String? result = await _channel.invokeMethod('openLocationPicker');
      return result;
    } on PlatformException catch (e) {
      print("Failed to open location picker: '${e.message}'.");
      return null;
    }
  }

  /// Launches the native Pet Tracker activity for a specific pet
  static Future<void> openNativePetTracker(String petId, String petName, String? photoUrl) async {
    try {
      await _channel.invokeMethod('openPetTracker', {
        'petId': petId,
        'petName': petName,
        'photoUrl': photoUrl,
      });
    } on PlatformException catch (e) {
      print("Failed to open pet tracker: '${e.message}'.");
    }
  }

  /// Calculates distance between two points using native Android Location API
  static Future<double> calculateDistance(double startLat, double startLng, double endLat, double endLng) async {
    try {
      final double distance = await _channel.invokeMethod('calculateDistance', {
        'startLat': startLat,
        'startLng': startLng,
        'endLat': endLat,
        'endLng': endLng,
      });
      return distance; // Distance in meters
    } on PlatformException catch (e) {
      print("Failed to calculate distance: '${e.message}'.");
      return 0.0;
    }
  }
}
