import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';

/// Ultra-smooth, zero-lag pull-to-refresh component.
/// 
/// Can be used either as:
/// 1. A wrapper widget around any scrollable: `PetRefreshIndicator(onRefresh: ..., child: ...)`
/// 2. A sliver builder via [PetRefreshIndicator.builder] for legacy [CupertinoSliverRefreshControl].
class PetRefreshIndicator extends StatelessWidget {
  final Future<void> Function() onRefresh;
  final Widget child;
  final double? edgeOffset;
  final double displacement;
  final Color? color;

  const PetRefreshIndicator({
    super.key,
    required this.onRefresh,
    required this.child,
    this.edgeOffset,
    this.displacement = 36.0,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final double topSafeArea = edgeOffset ?? (MediaQuery.paddingOf(context).top + 8.0);

    return RefreshIndicator(
      color: color ?? AppColors.primary,
      backgroundColor: isDark ? const Color(0xFF1E2825) : Colors.white,
      strokeWidth: 2.8,
      displacement: displacement,
      edgeOffset: topSafeArea,
      onRefresh: () async {
        HapticFeedback.lightImpact();
        await onRefresh();
      },
      child: child,
    );
  }

  /// Zero-jank, fully constrained sliver indicator builder for [CupertinoSliverRefreshControl].
  static Widget builder(
    BuildContext context,
    RefreshIndicatorMode refreshState,
    double pulledExtent,
    double refreshTriggerPullDistance,
    double refreshIndicatorExtent,
  ) {
    if (refreshState == RefreshIndicatorMode.inactive || pulledExtent <= 0) {
      return const SizedBox.shrink();
    }

    final double progress = (pulledExtent / refreshTriggerPullDistance).clamp(0.0, 1.0);

    return RepaintBoundary(
      child: SizedBox(
        height: pulledExtent,
        child: Center(
          child: refreshState == RefreshIndicatorMode.refresh
              ? const CupertinoActivityIndicator(radius: 12)
              : Transform.scale(
                  scale: 0.6 + (0.4 * progress),
                  child: Icon(
                    Icons.pets_rounded,
                    size: 22,
                    color: AppColors.primary.withValues(alpha: 0.25 + (0.75 * progress)),
                  ),
                ),
        ),
      ),
    );
  }
}
