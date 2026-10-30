/// An animal the user scanned that is NOT their own pet: a stray, a neighbour's or friend's pet, a rescue.
///
/// These live in their own collection (`other_animals`, readable only by the person who saved them) instead of `pets`,
/// so they never show up in Pet Family, reminders, bookings, vet directories or the website, which all read `pets`.
class OtherAnimalModel {
  /// Types offered when saving an animal. Free text is not accepted, so the list stays clean.
  static const List<String> types = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];

  final String id;
  final String ownerID;
  final String name; // optional nickname
  final String type;
  final String breed; // optional breed or a short look-alike description
  final String note; // where or when the animal was seen
  final String? photoUrl;
  final int createdAt;
  final int lastScanAt;
  final int scanCount;
  final bool lastUrgent;

  const OtherAnimalModel({
    required this.id,
    required this.ownerID,
    this.name = '',
    this.type = 'Dog',
    this.breed = '',
    this.note = '',
    this.photoUrl,
    required this.createdAt,
    required this.lastScanAt,
    this.scanCount = 0,
    this.lastUrgent = false,
  });

  /// "Rocky", or "Unnamed cat" when the user did not give a name.
  String get displayName {
    final n = name.trim();
    if (n.isNotEmpty) return n;
    return 'Unnamed ${type.toLowerCase()}';
  }

  /// "Dog · Labrador mix"
  String get subtitle => [type, if (breed.trim().isNotEmpty) breed.trim()].join(' · ');

  Map<String, dynamic> toMap() => {
        'id': id,
        'ownerID': ownerID,
        'name': name.trim(),
        'type': type,
        'breed': breed.trim(),
        'note': note.trim(),
        'photoUrl': photoUrl,
        'createdAt': createdAt,
        'lastScanAt': lastScanAt,
        'scanCount': scanCount,
        'lastUrgent': lastUrgent,
      };

  factory OtherAnimalModel.fromMap(String id, Map<dynamic, dynamic> map) {
    final type = map['type']?.toString() ?? 'Dog';
    return OtherAnimalModel(
      id: id,
      ownerID: map['ownerID']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      type: types.contains(type) ? type : 'Other',
      breed: map['breed']?.toString() ?? '',
      note: map['note']?.toString() ?? '',
      photoUrl: (map['photoUrl'] as String?)?.isNotEmpty == true ? map['photoUrl'] as String : null,
      createdAt: (map['createdAt'] as num?)?.toInt() ?? 0,
      lastScanAt: (map['lastScanAt'] as num?)?.toInt() ?? 0,
      scanCount: (map['scanCount'] as num?)?.toInt() ?? 0,
      lastUrgent: map['lastUrgent'] == true,
    );
  }

  OtherAnimalModel copyWith({
    String? name,
    String? type,
    String? breed,
    String? note,
    String? photoUrl,
    int? lastScanAt,
    int? scanCount,
    bool? lastUrgent,
  }) =>
      OtherAnimalModel(
        id: id,
        ownerID: ownerID,
        name: name ?? this.name,
        type: type ?? this.type,
        breed: breed ?? this.breed,
        note: note ?? this.note,
        photoUrl: photoUrl ?? this.photoUrl,
        createdAt: createdAt,
        lastScanAt: lastScanAt ?? this.lastScanAt,
        scanCount: scanCount ?? this.scanCount,
        lastUrgent: lastUrgent ?? this.lastUrgent,
      );
}

/// One saved AI health scan of an [OtherAnimalModel] (`other_animals/{id}/scans/{scanId}`).
class OtherAnimalScan {
  final String id;
  final String issue; // what the user described
  final String diagnosis; // the AI report
  final bool urgent;
  final String? imageUrl;
  final int timestamp;

  const OtherAnimalScan({
    required this.id,
    required this.issue,
    required this.diagnosis,
    this.urgent = false,
    this.imageUrl,
    required this.timestamp,
  });

  /// The reports flag emergencies in plain words; the scanner screen already treats that as "Urgent".
  static bool isUrgent(String diagnosis) => diagnosis.toLowerCase().contains('emergency');

  Map<String, dynamic> toMap() => {
        'id': id,
        'issue': issue,
        'diagnosis': diagnosis,
        'urgent': urgent,
        'imageUrl': imageUrl,
        'timestamp': timestamp,
      };

  factory OtherAnimalScan.fromMap(String id, Map<dynamic, dynamic> map) => OtherAnimalScan(
        id: id,
        issue: map['issue']?.toString() ?? '',
        diagnosis: map['diagnosis']?.toString() ?? '',
        urgent: map['urgent'] == true,
        imageUrl: (map['imageUrl'] as String?)?.isNotEmpty == true ? map['imageUrl'] as String : null,
        timestamp: (map['timestamp'] as num?)?.toInt() ?? 0,
      );
}
