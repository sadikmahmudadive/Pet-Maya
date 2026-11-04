/// Meal times are stored as short 24-hour "HH:mm" strings. The AI sometimes answers with a sentence instead
/// ("8:00 AM - breakfast, 1 cup of kibble"), which broke the layout of the time chips. This pulls the clock time out of
/// each entry and drops anything that has no time in it.
const defaultFeedingTimes = ['08:00', '13:00', '19:00'];

final RegExp _clock = RegExp(r'(?<![\d:.])(\d{1,2})\s*[:.]\s*(\d{2})(?!\d)\s*([ap])?\.?m?\.?', caseSensitive: false);
final RegExp _hourOnly = RegExp(r'(?<![\d:.])(\d{1,2})\s*([ap])\.?m\.?', caseSensitive: false);

String? _toHhMm(int hour, int minute, String? meridiem) {
  var h = hour;
  if (meridiem != null) {
    if (h < 1 || h > 12) return null;
    final pm = meridiem.toLowerCase() == 'p';
    h = h % 12 + (pm ? 12 : 0);
  }
  if (h < 0 || h > 23 || minute < 0 || minute > 59) return null;
  return '${h.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
}

/// Cleans a list of meal times: "HH:mm", unique and sorted. Falls back to [defaultFeedingTimes] when nothing usable is left.
List<String> normaliseFeedingTimes(Iterable<Object?> raw) {
  final out = <String>{};
  for (final item in raw) {
    final text = item?.toString() ?? '';
    final m = _clock.firstMatch(text);
    String? t;
    if (m != null) {
      t = _toHhMm(int.parse(m.group(1)!), int.parse(m.group(2)!), m.group(3));
    } else {
      final h = _hourOnly.firstMatch(text);
      if (h != null) t = _toHhMm(int.parse(h.group(1)!), 0, h.group(2));
    }
    if (t != null) out.add(t);
  }
  if (out.isEmpty) return List.of(defaultFeedingTimes);
  return out.toList()..sort();
}
