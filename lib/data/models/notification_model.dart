enum NotificationType { health, social, order, system }

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final NotificationType type;
  final int timestamp;
  bool isRead;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.timestamp,
    this.isRead = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type.name,
      'timestamp': timestamp,
      'isRead': isRead,
    };
  }

  factory NotificationModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return NotificationModel(
      id: id,
      title: map['title'] ?? '',
      message: map['message'] ?? '',
      type: NotificationType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => NotificationType.system,
      ),
      timestamp: map['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
      isRead: map['isRead'] ?? false,
    );
  }
}
