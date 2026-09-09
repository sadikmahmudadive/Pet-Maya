import 'dart:convert';

/// Represents a smart tracking hardware device (GPS collar, Bluetooth beacon,
/// health monitor band, or smart tag) linked to a pet.
class PetDeviceModel {
  final String id;
  final String name;
  final String deviceType; // 'gps_collar', 'ble_beacon', 'activity_tracker', 'qr_tag'
  final String modelNumber;
  final String serialNumber;
  final String? petId;
  final String? petName;
  final int batteryLevel; // 0-100
  final bool isOnline;
  final int signalStrength; // 1-4 bars
  final String trackingMode; // 'Real-Time (10s)', 'Balanced (5m)', 'Battery Saver (30m)'
  final bool isSafeZone;
  final DateTime lastSync;
  final String firmwareVersion;
  final double? latitude;
  final double? longitude;

  const PetDeviceModel({
    required this.id,
    required this.name,
    this.deviceType = 'gps_collar',
    this.modelNumber = 'PetMaya ProTrack Gen 2',
    required this.serialNumber,
    this.petId,
    this.petName,
    this.batteryLevel = 100,
    this.isOnline = true,
    this.signalStrength = 4,
    this.trackingMode = 'Real-Time (10s)',
    this.isSafeZone = true,
    required this.lastSync,
    this.firmwareVersion = 'v2.1.0',
    this.latitude,
    this.longitude,
  });

  String get typeDisplayName {
    switch (deviceType) {
      case 'ble_beacon':
        return 'Bluetooth Tag';
      case 'activity_tracker':
        return 'Health Tracker';
      case 'qr_tag':
        return 'Smart QR Tag';
      case 'gps_collar':
      default:
        return 'GPS Smart Collar';
    }
  }

  PetDeviceModel copyWith({
    String? id,
    String? name,
    String? deviceType,
    String? modelNumber,
    String? serialNumber,
    String? petId,
    String? petName,
    int? batteryLevel,
    bool? isOnline,
    int? signalStrength,
    String? trackingMode,
    bool? isSafeZone,
    DateTime? lastSync,
    String? firmwareVersion,
    double? latitude,
    double? longitude,
  }) {
    return PetDeviceModel(
      id: id ?? this.id,
      name: name ?? this.name,
      deviceType: deviceType ?? this.deviceType,
      modelNumber: modelNumber ?? this.modelNumber,
      serialNumber: serialNumber ?? this.serialNumber,
      petId: petId ?? this.petId,
      petName: petName ?? this.petName,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      isOnline: isOnline ?? this.isOnline,
      signalStrength: signalStrength ?? this.signalStrength,
      trackingMode: trackingMode ?? this.trackingMode,
      isSafeZone: isSafeZone ?? this.isSafeZone,
      lastSync: lastSync ?? this.lastSync,
      firmwareVersion: firmwareVersion ?? this.firmwareVersion,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'deviceType': deviceType,
      'modelNumber': modelNumber,
      'serialNumber': serialNumber,
      'petId': petId,
      'petName': petName,
      'batteryLevel': batteryLevel,
      'isOnline': isOnline,
      'signalStrength': signalStrength,
      'trackingMode': trackingMode,
      'isSafeZone': isSafeZone,
      'lastSync': lastSync.toIso8601String(),
      'firmwareVersion': firmwareVersion,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory PetDeviceModel.fromMap(Map<String, dynamic> map) {
    return PetDeviceModel(
      id: map['id'] ?? '',
      name: map['name'] ?? 'Pet Tracker',
      deviceType: map['deviceType'] ?? 'gps_collar',
      modelNumber: map['modelNumber'] ?? 'PetMaya ProTrack Gen 2',
      serialNumber: map['serialNumber'] ?? 'PM-TRK-0000',
      petId: map['petId'],
      petName: map['petName'],
      batteryLevel: (map['batteryLevel'] as num?)?.toInt() ?? 100,
      isOnline: map['isOnline'] ?? true,
      signalStrength: (map['signalStrength'] as num?)?.toInt() ?? 4,
      trackingMode: map['trackingMode'] ?? 'Real-Time (10s)',
      isSafeZone: map['isSafeZone'] ?? true,
      lastSync: map['lastSync'] != null
          ? DateTime.tryParse(map['lastSync'].toString()) ?? DateTime.now()
          : DateTime.now(),
      firmwareVersion: map['firmwareVersion'] ?? 'v2.1.0',
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
    );
  }

  String toJson() => jsonEncode(toMap());
  factory PetDeviceModel.fromJson(String source) =>
      PetDeviceModel.fromMap(jsonDecode(source) as Map<String, dynamic>);
}

