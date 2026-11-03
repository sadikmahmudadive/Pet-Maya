import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import 'illustrations/pet_illustrations.dart';
import 'motion/soft_motion.dart';

/// A friendly empty state: a small animated scene, a headline, one line of help and (optionally) the next step.
/// Every existing call passes an [icon]; it is used to pick a fitting scene unless [scene] is given.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final IllustrationScene? scene;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
    this.scene,
  });

  static IllustrationScene sceneFor(IconData icon) {
    if (icon == Icons.notifications_off_rounded) return IllustrationScene.noNotifications;
    if (icon == Icons.support_agent_rounded ||
        icon == Icons.chat_bubble_outline_rounded ||
        icon == Icons.article_outlined) {
      return IllustrationScene.noTickets;
    }
    if (icon == Icons.travel_explore_rounded) return IllustrationScene.noAnimals;
    if (icon == Icons.shopping_bag_outlined ||
        icon == Icons.shopping_basket_rounded ||
        icon == Icons.receipt_long_rounded ||
        icon == Icons.inventory_2_rounded) {
      return IllustrationScene.noOrders;
    }
    if (icon == Icons.event_available_rounded || icon == Icons.event_busy_rounded) {
      return IllustrationScene.noAppointments;
    }
    if (icon == Icons.favorite_border_rounded || icon == Icons.star_outline_rounded) return IllustrationScene.care;
    if (icon == Icons.medical_services_outlined || icon == Icons.people_outline_rounded) return IllustrationScene.noResults;
    return IllustrationScene.noPets;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Center(
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Reveal(child: SoftIllustration(scene: scene ?? sceneFor(icon), size: 200)),
              const SizedBox(height: 20),
              Reveal(
                index: 1,
                child: Text(
                  title,
                  textAlign: TextAlign.center,
                  style: AppTypography.headlineMedium.copyWith(color: isDark ? Colors.white : AppColors.textPrimary),
                ),
              ),
              const SizedBox(height: 8),
              Reveal(
                index: 2,
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 340),
                  child: Text(
                    message,
                    textAlign: TextAlign.center,
                    style: AppTypography.bodyMedium.copyWith(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ),
              ),
              if (actionLabel != null && onAction != null) ...[
                const SizedBox(height: 28),
                Reveal(
                  index: 3,
                  child: Pressable(
                    onTap: onAction,
                    child: Container(
                      constraints: const BoxConstraints(minWidth: 200, minHeight: 54),
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 15),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: AppColors.primaryStrong,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        boxShadow: AppShadows.soft(isDark, tint: AppColors.primaryStrong),
                      ),
                      child: Text(
                        actionLabel!,
                        textAlign: TextAlign.center,
                        style: AppTypography.titleMedium.copyWith(color: Colors.white, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
