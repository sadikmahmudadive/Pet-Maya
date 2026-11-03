// Support Center data: tickets, their messages, and the choices offered in the forms.
// Tickets and messages are written only by the `support_*` Cloud Functions; the app reads them.

const List<String> supportCategories = [
  'Order',
  'Delivery',
  'Payment',
  'Account',
  'Points & rewards',
  'Vet booking',
  'App problem',
  'Other',
];

const List<String> feedbackCategories = ['Bug', 'Idea', 'Praise', 'Other'];

enum SupportStatus {
  open('Open'),
  inProgress('In progress'),
  resolved('Resolved');

  final String label;
  const SupportStatus(this.label);

  static SupportStatus parse(String? raw) {
    switch (raw) {
      case 'in_progress':
        return SupportStatus.inProgress;
      case 'resolved':
        return SupportStatus.resolved;
      default:
        return SupportStatus.open;
    }
  }
}

int _int(dynamic v) => v is num ? v.toInt() : 0;

/// Phone, WhatsApp, email and opening hours shown in Help & Support. Edited by admins in the web console
/// (settings/support); the same cleaning rules live in web/src/lib/contact.js (keep in step).
class SupportContact {
  final String phone;
  final String phone2;
  final String whatsapp;
  final String whatsapp2;
  final String email;
  final String hours;

  const SupportContact({
    this.phone = '',
    this.phone2 = '',
    this.whatsapp = '',
    this.whatsapp2 = '',
    this.email = '',
    this.hours = '',
  });

  factory SupportContact.fromMap(
    Map<String, dynamic>? m, {
    String defaultEmail = '',
  }) {
    String s(String key) => (m?[key] ?? '').toString().trim();
    return SupportContact(
      phone: s('phone'),
      phone2: s('phone2'),
      whatsapp: s('whatsapp'),
      whatsapp2: s('whatsapp2'),
      email: s('email').isNotEmpty ? s('email') : defaultEmail,
      hours: s('hours'),
    );
  }

  /// Keeps a leading + and the digits: "+880 1712-345 678" -> "+8801712345678". Empty when there are no digits.
  static String dialNumber(String raw) {
    final s = raw.trim();
    final digits = s.replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) return '';
    return s.startsWith('+') ? '+$digits' : digits;
  }

  /// Digits for a wa.me link; a Bangladesh local number (01XXXXXXXXX) gets the 880 country code.
  static String whatsappDigits(String raw) {
    var d = raw.replaceAll(RegExp(r'\D'), '');
    if (d.startsWith('00')) {
      d = d.substring(2);
    } else if (d.startsWith('0')) {
      d = '880${d.substring(1)}';
    }
    return d;
  }

  /// The call buttons: up to two numbers, skipping empty ones and the same number entered twice.
  List<({String number, Uri uri})> get callNumbers {
    final seen = <String>{};
    final out = <({String number, Uri uri})>[];
    for (final raw in [phone, phone2]) {
      final number = raw.trim();
      final dial = dialNumber(number);
      if (dial.isEmpty) continue;
      // +880 1712… and 01712… are the same number.
      final key = dial
          .replaceFirst(RegExp(r'^\+?880'), '0')
          .replaceFirst('+', '');
      if (!seen.add(key)) continue;
      out.add((number: number, uri: Uri(scheme: 'tel', path: dial)));
    }
    return out;
  }

  /// The WhatsApp buttons: up to two numbers, skipping empty, too short or repeated ones.
  List<({String number, Uri uri})> whatsappNumbers([String text = '']) {
    final seen = <String>{};
    final out = <({String number, Uri uri})>[];
    for (final raw in [whatsapp, whatsapp2]) {
      final number = raw.trim();
      final d = whatsappDigits(number);
      if (d.length < 8 || !seen.add(d)) continue;
      out.add((
        number: number,
        uri: Uri.parse(
          'https://wa.me/$d${text.isEmpty ? '' : '?text=${Uri.encodeComponent(text)}'}',
        ),
      ));
    }
    return out;
  }
}

class SupportTicket {
  final String id;
  final String subject;
  final String category;
  final String message;
  final String orderNumber;
  final String? imageUrl;
  final SupportStatus status;
  final int createdAt;
  final int lastMessageAt;

  /// 'user' or 'staff': who wrote last.
  final String lastMessageBy;
  final int messageCount;

  /// True while the support team has replied and the customer has not opened the ticket yet.
  final bool unreadForUser;

  const SupportTicket({
    required this.id,
    required this.subject,
    required this.category,
    required this.message,
    this.orderNumber = '',
    this.imageUrl,
    this.status = SupportStatus.open,
    this.createdAt = 0,
    this.lastMessageAt = 0,
    this.lastMessageBy = 'user',
    this.messageCount = 0,
    this.unreadForUser = false,
  });

  factory SupportTicket.fromMap(String id, Map<String, dynamic> m) {
    final image = m['imageUrl'];
    final created = _int(m['createdAt']);
    return SupportTicket(
      id: id,
      subject: (m['subject'] ?? '').toString(),
      category: (m['category'] ?? 'Other').toString(),
      message: (m['message'] ?? '').toString(),
      orderNumber: (m['orderNumber'] ?? '').toString(),
      imageUrl: image is String && image.isNotEmpty ? image : null,
      status: SupportStatus.parse(m['status']?.toString()),
      createdAt: created,
      lastMessageAt: _int(m['lastMessageAt']) > 0
          ? _int(m['lastMessageAt'])
          : created,
      lastMessageBy: (m['lastMessageBy'] ?? 'user').toString(),
      messageCount: _int(m['messageCount']),
      unreadForUser: m['unreadForUser'] == true,
    );
  }
}

class SupportMessage {
  final String id;
  final bool fromStaff;
  final String senderName;
  final String text;
  final int createdAt;

  const SupportMessage({
    required this.id,
    required this.fromStaff,
    required this.senderName,
    required this.text,
    required this.createdAt,
  });

  factory SupportMessage.fromMap(String id, Map<String, dynamic> m) =>
      SupportMessage(
        id: id,
        fromStaff: m['senderRole'] == 'staff',
        senderName: (m['senderName'] ?? '').toString(),
        text: (m['text'] ?? '').toString(),
        createdAt: _int(m['createdAt']),
      );
}
