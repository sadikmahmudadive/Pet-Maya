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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
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
