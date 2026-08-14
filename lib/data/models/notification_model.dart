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

    final rawType = (map['type'] ?? '').toString().toLowerCase();
    NotificationType parsedType = NotificationType.system;
    if (rawType.contains('health')) {
      parsedType = NotificationType.health;
    } else if (rawType.contains('social')) {
      parsedType = NotificationType.social;
    } else if (rawType.contains('order')) {
      parsedType = NotificationType.order;
    } else {
      parsedType = NotificationType.system;
    }

    return NotificationModel(
      id: id,
      title: map['title']?.toString() ?? '',
      message: map['message']?.toString() ?? '',
      type: parsedType,
      timestamp: parsedTimestamp,
      isRead: map['isRead'] == true || map['isRead']?.toString().toLowerCase() == 'true',
    );
  }
}
