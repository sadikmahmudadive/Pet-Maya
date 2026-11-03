/// Answers to the questions people ask most, shown in the Support Center. They are written in the app, so changing
/// them needs an app update; anything not covered here goes through a support ticket.
class FaqItem {
  final String topic;
  final String question;
  final String answer;
  const FaqItem(this.topic, this.question, this.answer);

  /// True when [needle] (already lower-cased) appears in the question, answer or topic.
  bool matches(String needle) =>
      needle.isEmpty ||
      question.toLowerCase().contains(needle) ||
      answer.toLowerCase().contains(needle) ||
      topic.toLowerCase().contains(needle);
}

const List<FaqItem> supportFaq = [
  FaqItem(
    'Orders & delivery',
    'Where is my order?',
    'Open Shop > Orders to see its status. Orders move from Pending to Processing, then Dispatched and Delivered. '
        'If it seems late, open a ticket and add the order number so we can check with the courier.',
  ),
  FaqItem(
    'Orders & delivery',
    'Can I cancel or change an order?',
    'An order can be cancelled while it is still Pending or Processing. After it is dispatched it cannot be '
        'cancelled, but a return can be requested once it is delivered. Open a ticket with the order number to '
        'cancel, return or change the delivery address.',
  ),
  FaqItem(
    'Orders & delivery',
    'Which areas do you deliver to? Why is medicine not available for my area?',
    'We deliver across Bangladesh. Cold-chain medicines (vaccines and similar) are shipped only to Dhaka, Gazipur '
        'and Narayanganj so they stay at the right temperature.',
  ),
  FaqItem(
    'Points & rewards',
    'How do I earn points?',
    'You get 15 points when you join, 5 points every day you open the app, and 100 points each time a friend '
        'joins with your referral code.',
  ),
  FaqItem(
    'Points & rewards',
    'Where do I find my referral code, and where does a friend enter it?',
    'Your code is on your profile under Rewards & Referral. A friend can type it in the "Referral Code" box when '
        'they sign up, or later from the same section on their profile. Each person can use one code, once.',
  ),
  FaqItem(
    'Points & rewards',
    'I did not get my daily points.',
    'The daily 5 points are given the first time you open the app each day (Bangladesh time) while you are '
        'connected to the internet. Close the app, reopen it and wait a few seconds. If it still does not work, '
        'send us a ticket.',
  ),
  FaqItem(
    'AI Health Scanner',
    'Is the AI Health Scanner a diagnosis?',
    'No. It gives a first screening and care tips only. For anything serious, or if the report says Emergency, '
        'see a verified vet straight away.',
  ),
  FaqItem(
    'AI Health Scanner',
    'Can I scan a stray or a friend\'s pet?',
    'Yes. In the scanner choose "Not my pet". It is saved under "Not Your Pets" on your profile, separate from '
        'your own pets, and the advice is written for someone who does not know the animal\'s history.',
  ),
  FaqItem(
    'Vets & bookings',
    'How do I book a vet?',
    'Go to Services, pick a verified vet, groomer or boarding provider and choose a time. Your bookings appear in '
        'the calendar.',
  ),
  FaqItem(
    'Pets & reminders',
    'My reminders do not ring on time.',
    'Allow notifications and "Alarms & reminders" for Pet Maya in your phone settings, and switch off battery '
        'saving for the app. Phones from some brands stop background apps, so you may also need to allow '
        '"Auto-start".',
  ),
  FaqItem(
    'GPS tracker',
    'My tracker shows offline.',
    'Check that the collar is charged and has Wi-Fi or LoRa coverage. A tracker that has not reported for about '
        '5 minutes is marked offline. Charge it, move it near its gateway or Wi-Fi, and wait a few minutes.',
  ),
  FaqItem(
    'Account',
    'How do I delete my account or change my details?',
    'Open your profile and tap Edit Profile to change your name, phone and address. The same screen has the '
        'option to permanently delete your account and data.',
  ),
];
