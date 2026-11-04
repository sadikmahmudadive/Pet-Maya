import 'package:flutter_test/flutter_test.dart';
import 'package:tail_wagging_flutter/data/feeding_times.dart';

void main() {
  test('plain 24-hour times pass through, sorted and unique', () {
    expect(normaliseFeedingTimes(['19:00', '08:00', '08:00', '13:30']), ['08:00', '13:30', '19:00']);
  });

  test('a sentence from the AI is cut down to its clock time', () {
    expect(
      normaliseFeedingTimes(['8:00 AM - breakfast, 1 cup of kibble with a teaspoon of pumpkin', 'Dinner at 6:30 pm (wet food)']),
      ['08:00', '18:30'],
    );
  });

  test('12-hour edge cases and hour-only times', () {
    expect(normaliseFeedingTimes(['12:00 AM', '12:15 PM', '7 pm', '6am']), ['00:00', '06:00', '12:15', '19:00']);
  });

  test('entries without a usable time are dropped; nothing usable gives the defaults', () {
    expect(normaliseFeedingTimes(['morning', '25:99', null, '08:00']), ['08:00']);
    expect(normaliseFeedingTimes(['morning', 'evening']), defaultFeedingTimes);
    expect(normaliseFeedingTimes(const []), defaultFeedingTimes);
  });
}
