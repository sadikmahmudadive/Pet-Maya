/// Firestore `calls/{callId}` — WebRTC signaling + call lifecycle record.
class CallModel {
  final String id;
  final String callerId;
  final String calleeId;
  final String callerName;
  final String calleeName;
  final String? callerPhoto;
  final String petId;
  final String petName;
  final String? appointmentId;
  final String status; // ringing | accepted | declined | cancelled | missed | busy | ended
  final int createdAtMs;
  final int? answeredAt;
  final int? endedAt;
  final String? endReason;
  final Map<String, dynamic>? offer;
  final Map<String, dynamic>? answer;

  const CallModel({
    required this.id,
    required this.callerId,
    required this.calleeId,
    required this.callerName,
    required this.calleeName,
    this.callerPhoto,
    this.petId = '',
    this.petName = '',
    this.appointmentId,
    required this.status,
    required this.createdAtMs,
    this.answeredAt,
    this.endedAt,
    this.endReason,
    this.offer,
    this.answer,
  });

  bool get isTerminal => const {
        'declined',
        'cancelled',
        'missed',
        'busy',
        'ended',
      }.contains(status);

  factory CallModel.fromMap(String id, Map<String, dynamic> m) {
    Map<String, dynamic>? asMap(dynamic v) =>
        v is Map ? Map<String, dynamic>.from(v) : null;
    return CallModel(
      id: id,
      callerId: m['callerId']?.toString() ?? '',
      calleeId: m['calleeId']?.toString() ?? '',
      callerName: m['callerName']?.toString() ?? 'Pet Maya',
      calleeName: m['calleeName']?.toString() ?? '',
      callerPhoto: m['callerPhoto']?.toString(),
      petId: m['petId']?.toString() ?? '',
      petName: m['petName']?.toString() ?? '',
      appointmentId: (m['appointmentId']?.toString().isEmpty ?? true)
          ? null
          : m['appointmentId'].toString(),
      status: m['status']?.toString() ?? 'ringing',
      createdAtMs: (m['createdAtMs'] as num?)?.toInt() ?? 0,
      answeredAt: (m['answeredAt'] as num?)?.toInt(),
      endedAt: (m['endedAt'] as num?)?.toInt(),
      endReason: m['endReason']?.toString(),
      offer: asMap(m['offer']),
      answer: asMap(m['answer']),
    );
  }
}
