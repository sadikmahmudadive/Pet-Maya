class EventModel {
  final String id;
  final String userId;
  final String title;
  final String category; // Vet Visit, Vaccination, Grooming, Medication, Feeding
  final String note;
  final String petName;
  final String petId;
  final String? providerId; // UID of the Vet/Service provider
  final DateTime date;
  final String fromTime;
  final String toTime;
  final String status; // PENDING, CONFIRMED, CANCELLED, COMPLETED
  final bool isReminderEnabled;
  final bool isCompleted;

  EventModel({
    required this.id,
    required this.userId,
    required this.title,
    required this.category,
    this.note = '',
    required this.petName,
    required this.petId,
    this.providerId,
    required this.date,
    required this.fromTime,
    required this.toTime,
    this.status = 'PENDING',
    this.isReminderEnabled = true,
    this.isCompleted = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'title': title,
      'category': category,
      'note': note,
      'petName': petName,
      'petId': petId,
      'providerId': providerId,
      'date': date.toIso8601String(),
      'fromTime': fromTime,
      'toTime': toTime,
      'status': status,
      'isReminderEnabled': isReminderEnabled,
      'isCompleted': isCompleted,
    };
  }

  factory EventModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return EventModel(
      id: id,
      userId: map['userId'] ?? '',
      title: map['title'] ?? '',
      category: map['category'] ?? 'General',
      note: map['note'] ?? '',
      petName: map['petName'] ?? '',
      petId: map['petId'] ?? '',
      providerId: map['providerId'] ?? map['vetId'],
      date: map['date'] != null ? DateTime.tryParse(map['date']) ?? DateTime.now() : DateTime.now(),
      fromTime: map['fromTime'] ?? map['time'] ?? '09:00 AM',
      toTime: map['toTime'] ?? '10:00 AM',
      status: map['status'] ?? 'PENDING',
      isReminderEnabled: map['isReminderEnabled'] ?? true,
      isCompleted: map['isCompleted'] ?? false,
    );
  }
}
