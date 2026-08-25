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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (notifications.any((n) => !n.isRead))
            TextButton(
              onPressed: () {
                HapticFeedback.mediumImpact();
                repo.markAllNotificationsAsRead();
              },
              child: const Text('Read All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
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
                        onTap: () {
                          repo.markNotificationAsRead(notification.id);
                          _showNotificationDetail(context, notification);
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(18),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: _getColor(notification.type).withValues(alpha: 0.1),
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
                                      crossAxisAlignment: CrossAxisAlignment.center,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            notification.title,
                                            style: AppTypography.titleMedium.copyWith(
                                              fontSize: 14,
                                              fontWeight: notification.isRead ? FontWeight.w600 : FontWeight.w800,
                                              color: Theme.of(context).brightness == Brightness.dark
                                                ? (notification.isRead ? Colors.white38 : Colors.white)
                                                : (notification.isRead ? Colors.black38 : Colors.black87),
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
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
        color: AppColors.dangerRed.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(24),
      ),
      child: const Icon(Icons.delete_sweep_rounded, color: AppColors.dangerRed, size: 28),
    );
  }

  void _showNotificationDetail(BuildContext context, NotificationModel notification) {
    final date = DateTime.fromMillisecondsSinceEpoch(notification.timestamp);
    final timeStr = DateFormat.yMMMMEEEEd().add_jm().format(date);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (ctx) => FadeInUp(
        duration: const Duration(milliseconds: 300),
        child: AlertDialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24),
          contentPadding: EdgeInsets.zero,
          content: PremiumCard(
            opacity: 0.9,
            borderRadius: 32,
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _getColor(notification.type).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _getIcon(notification.type),
                      color: _getColor(notification.type),
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    notification.title,
                    textAlign: TextAlign.center,
                    style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w900, fontSize: 20),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    timeStr,
                    style: TextStyle(fontSize: 12, color: Colors.grey[500], fontWeight: FontWeight.w600),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Divider(height: 1),
                  ),
                  Text(
                    notification.message,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.6,
                      color: isDark ? Colors.white70 : Colors.black87,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _getColor(notification.type),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('CLOSE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
