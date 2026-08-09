import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/notification_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/empty_state.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = context.select((AppStateRepository repo) => repo.notifications);
    final repo = context.read<AppStateRepository>();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (notifications.isNotEmpty)
            TextButton(
              onPressed: () {
                HapticFeedback.mediumImpact();
                repo.clearNotifications();
              },
              child: const Text('Clear All', style: TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.bold)),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: notifications.isEmpty
          ? const EmptyState(
              icon: Icons.notifications_off_rounded,
              title: 'All caught up!',
              message: 'You have no new alerts at the moment',
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
              itemCount: notifications.length,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                final date = DateTime.fromMillisecondsSinceEpoch(notification.timestamp);
                final timeStr = DateFormat.jm().format(date);

                return Dismissible(
                  key: Key(notification.id),
                  direction: DismissDirection.horizontal,
                  onDismissed: (direction) {
                    HapticFeedback.lightImpact();
                    repo.removeNotification(notification.id); 
                  },
                  background: _buildDismissBackground(true),
                  secondaryBackground: _buildDismissBackground(false),
                  child: FadeInUp(
                    delay: Duration(milliseconds: 50 * index),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: PremiumCard(
                        opacity: notification.isRead ? 0.1 : 0.25,
                        borderRadius: 24,
                        onTap: () => repo.markNotificationAsRead(notification.id),
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: _getColor(notification.type).withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  _getIcon(notification.type),
                                  color: _getColor(notification.type),
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          notification.title,
                                          style: AppTypography.titleMedium.copyWith(
                                            fontSize: 15,
                                            fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w700,
                                            color: notification.isRead ? AppColors.textSecondary : AppColors.textPrimary,
                                          ),
                                        ),
                                        Text(timeStr, style: AppTypography.labelSmall.copyWith(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textTertiary)),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      notification.message,
                                      style: AppTypography.bodyMedium.copyWith(
                                        fontSize: 13,
                                        height: 1.4,
                                        color: notification.isRead ? AppColors.textTertiary : AppColors.textSecondary,
                                        fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (!notification.isRead)
                                Container(
                                  width: 8,
                                  height: 8,
                                  margin: const EdgeInsets.only(left: 12, top: 4),
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
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

  Widget _buildDismissBackground(bool isStart) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      alignment: isStart ? Alignment.centerLeft : Alignment.centerRight,
      decoration: BoxDecoration(
        color: AppColors.dangerRed.withOpacity(0.1),
        borderRadius: BorderRadius.circular(24),
      ),
      child: const Icon(Icons.delete_sweep_rounded, color: AppColors.dangerRed, size: 28),
    );
  }
}
