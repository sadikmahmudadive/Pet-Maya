import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Ultra-lightweight, zero-lag native pull-to-refresh indicator.
/// Dynamically positions the loader below camera cutouts, notches, and status bars.
class PetRefreshIndicator extends StatelessWidget {
  final RefreshIndicatorMode refreshState;
  final double pulledExtent;
  final double refreshTriggerPullDistance;
  final double refreshIndicatorExtent;

  const PetRefreshIndicator({
    super.key,
    required this.refreshState,
    required this.pulledExtent,
    required this.refreshTriggerPullDistance,
    required this.refreshIndicatorExtent,
  });

  /// Factory builder matching [RefreshControlIndicatorBuilder] for [CupertinoSliverRefreshControl].
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

    final double topSafeArea = MediaQuery.of(context).padding.top;
    // Push the loader down past the camera cutout / status bar notch (topSafeArea + 16px clear margin)
    final double topPadding = topSafeArea > 0 ? topSafeArea + 16.0 : 20.0;

    if (refreshState == RefreshIndicatorMode.refresh) {
      return Padding(
        padding: EdgeInsets.only(top: topPadding),
        child: const Center(
          child: CupertinoActivityIndicator(radius: 14),
        ),
      );
    }

    final double progress =
        (pulledExtent / refreshTriggerPullDistance).clamp(0.0, 1.0);

    return Padding(
      padding: EdgeInsets.only(top: topPadding),
      child: Center(
        child: Transform.scale(
          scale: 0.5 + (0.5 * progress),
          child: Icon(
            Icons.pets_rounded,
            size: 22,
            color: AppColors.primary.withValues(alpha: 0.3 + (0.7 * progress)),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return builder(
      context,
      refreshState,
      pulledExtent,
      refreshTriggerPullDistance,
      refreshIndicatorExtent,
    );
  }
}
