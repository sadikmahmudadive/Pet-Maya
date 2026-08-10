import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../../data/models/notification_model.dart';

class PremiumNotificationOverlay extends StatefulWidget {
  final String title;
  final String message;
  final NotificationType type;
  final VoidCallback onDismiss;

  const PremiumNotificationOverlay({
    super.key,
    required this.title,
    required this.message,
    required this.type,
    required this.onDismiss,
  });

  static void show(BuildContext context, {
    required String title,
    required String message,
    required NotificationType type,
  }) {
    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) => PremiumNotificationOverlay(
        title: title,
        message: message,
        type: type,
        onDismiss: () => entry.remove(),
      ),
    );
    Overlay.of(context).insert(entry);
  }

  @override
  State<PremiumNotificationOverlay> createState() => _PremiumNotificationOverlayState();
}

class _PremiumNotificationOverlayState extends State<PremiumNotificationOverlay> with SingleTickerProviderStateMixin {
  bool _isVisible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 50), () {
      if (mounted) setState(() => _isVisible = true);
    });
    
    // Auto-dismiss after 4 seconds
    Future.delayed(const Duration(seconds: 4), _hide);
  }

  void _hide() {
    if (mounted) {
      setState(() => _isVisible = false);
      Future.delayed(const Duration(milliseconds: 500), widget.onDismiss);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedPositioned(
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutBack,
      top: _isVisible ? 60 : -100,
      left: 20,
      right: 20,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 400),
        opacity: _isVisible ? 1.0 : 0.0,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10.0, sigmaY: 10.0),
            child: Material(
              color: Colors.white.withOpacity(0.15),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _getColor(widget.type).withOpacity(0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(_getIcon(widget.type), color: _getColor(widget.type), size: 22),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(widget.title, 
                            style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 14)),
                          const SizedBox(height: 2),
                          Text(widget.message, 
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, fontSize: 12)),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 18, color: Colors.grey),
                      onPressed: _hide,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getIcon(NotificationType type) {
    switch (type) {
      case NotificationType.health: return Icons.health_and_safety_rounded;
      case NotificationType.social: return Icons.forum_rounded;
      case NotificationType.order: return Icons.shopping_bag_rounded;
      case NotificationType.system: return Icons.info_rounded;
    }
  }

  Color _getColor(NotificationType type) {
    switch (type) {
      case NotificationType.health: return AppColors.healthGreen;
      case NotificationType.social: return AppColors.primary;
      case NotificationType.order: return AppColors.accentAmber;
      case NotificationType.system: return AppColors.tertiary;
    }
  }
}
