import 'package:flutter_test/flutter_test.dart';
import 'package:tail_wagging_flutter/data/models/support_models.dart';
import 'package:tail_wagging_flutter/data/support_faq.dart';
import 'package:tail_wagging_flutter/presentation/owner/support/support_widgets.dart';

void main() {
  contactTests();
  test('a stored ticket is read defensively', () {
    final t = SupportTicket.fromMap('t1', {
      'subject': 'Late order',
      'category': 'Delivery',
      'message': 'Not here yet',
      'status': 'in_progress',
      'createdAt': 100,
      'lastMessageAt': 250.0,
      'lastMessageBy': 'staff',
      'messageCount': 2,
      'unreadForUser': true,
      'imageUrl': '',
    });
    expect(t.status, SupportStatus.inProgress);
    expect(t.lastMessageAt, 250);
    expect(t.unreadForUser, true);
    expect(t.imageUrl, isNull);

    final bare = SupportTicket.fromMap('t2', {'createdAt': 70});
    expect(bare.status, SupportStatus.open);
    expect(bare.category, 'Other');
    expect(bare.lastMessageAt, 70); // falls back to when it was created
    expect(bare.unreadForUser, false);
  });

  test('status text maps to the three states, anything unknown is open', () {
    expect(SupportStatus.parse('resolved'), SupportStatus.resolved);
    expect(SupportStatus.parse('in_progress'), SupportStatus.inProgress);
    expect(SupportStatus.parse('whatever'), SupportStatus.open);
    expect(SupportStatus.parse(null), SupportStatus.open);
  });

  test('a message knows whether support wrote it', () {
    expect(
      SupportMessage.fromMap('m', {
        'senderRole': 'staff',
        'text': 'Hi',
      }).fromStaff,
      true,
    );
    expect(
      SupportMessage.fromMap('m', {
        'senderRole': 'user',
        'text': 'Hi',
      }).fromStaff,
      false,
    );
  });

  test('the form choices match what the server accepts', () {
    expect(supportCategories, [
      'Order',
      'Delivery',
      'Payment',
      'Account',
      'Points & rewards',
      'Vet booking',
      'App problem',
      'Other',
    ]);
    expect(feedbackCategories, ['Bug', 'Idea', 'Praise', 'Other']);
  });

  test('FAQ search matches the question, the answer and the topic', () {
    List<FaqItem> find(String q) =>
        supportFaq.where((f) => f.matches(q)).toList();
    expect(find('').length, supportFaq.length);
    expect(find('referral'), isNotEmpty);
    expect(find('tracker').every((f) => f.matches('tracker')), true);
    expect(find('zzzz-no-such-word'), isEmpty);
  });

  test('times read as today, yesterday or a date', () {
    final now = DateTime.now();
    expect(supportTime(0), '');
    expect(supportTime(now.millisecondsSinceEpoch), startsWith('Today, '));
    expect(
      supportTime(now.subtract(const Duration(days: 1)).millisecondsSinceEpoch),
      startsWith('Yesterday, '),
    );
    expect(
      supportTime(DateTime(2020, 3, 5, 15, 7).millisecondsSinceEpoch),
      '5 Mar 2020, 3:07 PM',
    );
  });
}

void contactTests() {
  test(
    'a Bangladesh local number gets 880 for WhatsApp, and phone numbers are dialled without spaces',
    () {
      expect(SupportContact.whatsappDigits('01712 345678'), '8801712345678');
      expect(
        SupportContact.whatsappDigits('+880 1712-345678'),
        '8801712345678',
      );
      expect(
        SupportContact.whatsappDigits('00880 1712 345678'),
        '8801712345678',
      );
      expect(SupportContact.dialNumber('+880 1712-345 678'), '+8801712345678');
      expect(SupportContact.dialNumber('call me'), '');
    },
  );

  test('buttons appear only for the details an admin filled in', () {
    const empty = SupportContact();
    expect(empty.callNumbers, isEmpty);
    expect(empty.whatsappNumbers(), isEmpty);
    // too short to open a chat
    expect(const SupportContact(whatsapp: '12').whatsappNumbers(), isEmpty);

    const c = SupportContact(
      phone: '01712 345678',
      whatsapp: '01712345678',
      hours: 'Sat-Thu',
    );
    expect(c.callNumbers.single.uri.toString(), 'tel:01712345678');
    expect(
      c.whatsappNumbers().single.uri.toString(),
      'https://wa.me/8801712345678',
    );
    expect(
      c.whatsappNumbers('Hi there').single.uri.toString(),
      'https://wa.me/8801712345678?text=Hi%20there',
    );
  });

  test(
    'two phone and two WhatsApp numbers each get a button; the second can stand alone and repeats are dropped',
    () {
      const both = SupportContact(
        phone: '01712 345678',
        phone2: '01800-111222',
        whatsapp: '01712345678',
        whatsapp2: '+880 1800 111222',
      );
      expect(both.callNumbers.map((c) => c.uri.toString()), [
        'tel:01712345678',
        'tel:01800111222',
      ]);
      expect(both.whatsappNumbers().map((c) => c.uri.toString()), [
        'https://wa.me/8801712345678',
        'https://wa.me/8801800111222',
      ]);

      const second = SupportContact(
        phone2: '01800 111222',
        whatsapp2: '01800111222',
      );
      expect(second.callNumbers.single.number, '01800 111222');
      expect(second.whatsappNumbers().single.number, '01800111222');

      const same = SupportContact(
        phone: '01712 345678',
        phone2: '+880 1712 345678',
        whatsapp: '01712345678',
        whatsapp2: '+8801712345678',
      );
      expect(same.callNumbers, hasLength(1));
      expect(same.whatsappNumbers(), hasLength(1));
    },
  );

  test(
    'stored details are read defensively and the email falls back to the default',
    () {
      final c = SupportContact.fromMap({
        'phone': ' 01712 345678 ',
        'phone2': ' 01800 111222 ',
        'email': '',
        'hours': null,
      }, defaultEmail: 'support@petmaya.app');
      expect(c.phone, '01712 345678');
      expect(c.phone2, '01800 111222');
      expect(c.whatsapp2, '');
      expect(c.email, 'support@petmaya.app');
      expect(c.hours, '');
      expect(
        SupportContact.fromMap(null, defaultEmail: 'x@y.z').email,
        'x@y.z',
      );
      expect(
        SupportContact.fromMap({
          'email': 'help@petmaya.app',
        }, defaultEmail: 'x@y.z').email,
        'help@petmaya.app',
      );
    },
  );
}
