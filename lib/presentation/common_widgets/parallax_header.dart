import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class ParallaxHeader extends SliverPersistentHeaderDelegate {
  final double expandedHeight;
  final String userName;
  final String? userPhotoUrl;
  final VoidCallback onProfileTap;
  final VoidCallback onNotificationTap;
  final int unreadCount;

  ParallaxHeader({
    required this.expandedHeight,
    required this.userName,
    this.userPhotoUrl,
    required this.onProfileTap,
    required this.onNotificationTap,
    this.unreadCount = 0,
  });

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final double percent = (shrinkOffset / expandedHeight).clamp(0.0, 1.0);
    final double opacity = (1.0 - percent).clamp(0.0, 1.0);

    return Stack(
      fit: StackFit.expand,
      children: [
        // Background Image with Parallax
        CachedNetworkImage(
          imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
          fit: BoxFit.cover,
          color: Colors.black.withValues(alpha: 0.4 * opacity),
          colorBlendMode: BlendMode.darken,
          placeholder: (c, url) => Container(color: Colors.grey[300]),
          errorWidget: (c, url, e) => Container(color: AppColors.primary),
        ),
        
        // Gradient Overlay (Simplified)
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.transparent,
                AppColors.background.withValues(alpha: percent.clamp(0, 1)),
              ],
            ),
          ),
        ),

        // Collapsed Header (Sticky Bar)
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: SafeArea(
            child: Container(
              height: 60,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: onProfileTap,
                    child: Hero(
                      tag: 'user_profile',
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.primary,
                        backgroundImage: (userPhotoUrl != null && userPhotoUrl!.isNotEmpty)
                            ? CachedNetworkImageProvider(userPhotoUrl!)
                            : null,
                        child: (userPhotoUrl == null || userPhotoUrl!.isEmpty)
                            ? const Icon(Icons.person, color: Colors.white, size: 20)
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Hi, $userName',
                      style: AppTypography.titleMedium.copyWith(
                        color: AppColors.textPrimary.withValues(alpha: percent),
                      ),
                    ),
                  ),
                  _buildNotificationIcon(percent),
                ],
              ),
            ),
          ),
        ),

        Positioned(
          bottom: 20,
          left: 20,
          right: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _getGreeting(),
                style: AppTypography.titleMedium.copyWith(
                  color: Colors.white.withValues(alpha: opacity), 
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '$userName!',
                style: AppTypography.displayLarge.copyWith(
                  color: Colors.white.withValues(alpha: opacity), 
                  fontSize: 32,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  Widget _buildNotificationIcon(double percent) {
    final color = Color.lerp(Colors.white, AppColors.textPrimary, percent);
    return GestureDetector(
      onTap: onNotificationTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(Icons.notifications_none_rounded, color: color, size: 26),
          if (unreadCount > 0)
            Positioned(
              top: -2,
              right: -2,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: AppColors.dangerRed, shape: BoxShape.circle),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  double get maxExtent => expandedHeight;

  @override
  double get minExtent => 100;

  @override
  bool shouldRebuild(covariant ParallaxHeader oldDelegate) => true;
}
