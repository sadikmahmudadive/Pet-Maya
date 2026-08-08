import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class StatusChip extends StatelessWidget {
  final String label;
  final Color color;
  final IconData? icon;

  const StatusChip({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.28), width: 1.2),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 5),
          ],
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }

  factory StatusChip.health(int index) {
    if (index < 50) return const StatusChip(label: 'Urgent', color: AppColors.dangerRed, icon: Icons.error_outline_rounded);
    if (index < 85) return const StatusChip(label: 'Checkup', color: AppColors.accentAmber, icon: Icons.info_outline_rounded);
    return const StatusChip(label: 'Healthy', color: AppColors.healthGreen, icon: Icons.check_circle_outline_rounded);
  }
  
  factory StatusChip.order(String status) {
    Color color = AppColors.primary;
    if (status.toLowerCase() == 'delivered') color = AppColors.healthGreen;
    if (status.toLowerCase() == 'cancelled') color = AppColors.dangerRed;
    if (status.toLowerCase() == 'pending') color = AppColors.accentAmber;
    return StatusChip(label: status, color: color);
  }

  factory StatusChip.verified(bool isVerified) {
    return isVerified 
      ? const StatusChip(label: 'Verified', color: AppColors.healthGreen, icon: Icons.verified_rounded)
      : const StatusChip(label: 'Pending', color: AppColors.accentAmber, icon: Icons.hourglass_empty_rounded);
  }
}
