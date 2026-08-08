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
    int parsedTimestamp = DateTime.now().millisecondsSinceEpoch;
    final rawTs = map['timestamp'];
    if (rawTs is num) {
      parsedTimestamp = rawTs.toInt();
    } else if (rawTs is String) {
      parsedTimestamp = int.tryParse(rawTs) ?? DateTime.tryParse(rawTs)?.millisecondsSinceEpoch ?? parsedTimestamp;
    }

    return NotificationModel(
      id: id,
      title: map['title'] ?? '',
      message: map['message'] ?? '',
      type: NotificationType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => NotificationType.system,
      ),
      timestamp: parsedTimestamp,
      isRead: map['isRead'] == true || map['isRead'] == 'true',
    );
  }
}
