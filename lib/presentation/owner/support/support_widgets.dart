import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/support_models.dart';

const _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/// "Today, 3:05 PM" / "Yesterday, 9:40 AM" / "12 Mar, 4:10 PM". Empty for an unknown time.
String supportTime(int millis) {
  if (millis <= 0) return '';
  final d = DateTime.fromMillisecondsSinceEpoch(millis);
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(d.year, d.month, d.day);
  final hour12 = d.hour % 12 == 0 ? 12 : d.hour % 12;
  final clock =
      '$hour12:${d.minute.toString().padLeft(2, '0')} ${d.hour < 12 ? 'AM' : 'PM'}';
  final diff = today.difference(day).inDays;
  if (diff == 0) return 'Today, $clock';
  if (diff == 1) return 'Yesterday, $clock';
  return '${d.day} ${_months[d.month - 1]}${d.year == now.year ? '' : ' ${d.year}'}, $clock';
}

/// Colour for a ticket status; the label always carries the meaning too, so colour is never the only signal.
Color supportStatusColor(SupportStatus s) => switch (s) {
  SupportStatus.open => AppColors.accentAmber,
  SupportStatus.inProgress => AppColors.primary,
  SupportStatus.resolved => AppColors.healthGreen,
};

class SupportStatusChip extends StatelessWidget {
  final SupportStatus status;
  const SupportStatusChip(this.status, {super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = supportStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          // The light-mode tint of these colours is too pale for text, so darken it there.
          color: isDark
              ? color
              : Color.alphaBlend(Colors.black.withValues(alpha: 0.45), color),
        ),
      ),
    );
  }
}
