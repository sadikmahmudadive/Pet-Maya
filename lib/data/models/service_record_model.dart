class ServiceRecordModel {
  final String recordId;
  final String petId;
  final String petName;
  final String serviceType; // Required by your DB Rules
  final String providerId;
  final String providerName;
  final String providerRole;
  final String date;
  final String title;
  final String description;
  final String? diagnosis;
  final String? suggestion;
  final int timestamp;

  ServiceRecordModel({
    required this.recordId,
    required this.petId,
    required this.petName,
    this.serviceType = 'General Consultation',
    required this.providerId,
    required this.providerName,
    required this.providerRole,
    required this.date,
    required this.title,
    required this.description,
    this.diagnosis,
    this.suggestion,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': recordId, // Your rules expect 'id' instead of 'recordId'
      'petId': petId,
      'petName': petName,
      'serviceType': serviceType,
      'providerId': providerId,
      'providerName': providerName,
      'providerRole': providerRole,
      'date': date,
      'title': title,
      'description': description,
      'diagnosis': diagnosis ?? description,
      'suggestion': suggestion ?? '',
      'timestamp': timestamp,
    };
  }

  factory ServiceRecordModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return ServiceRecordModel(
      recordId: map['id'] ?? id,
      petId: map['petId'] ?? '',
      petName: map['petName'] ?? '',
      serviceType: map['serviceType'] ?? 'General Consultation',
      providerId: map['providerId'] ?? '',
      providerName: map['providerName'] ?? '',
      providerRole: map['providerRole'] ?? 'Veterinarian',
      date: map['date'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? map['diagnosis'] ?? '',
      diagnosis: map['diagnosis'],
      suggestion: map['suggestion'],
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
    );
  }
}
