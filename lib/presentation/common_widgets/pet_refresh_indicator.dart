import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lottie/lottie.dart';
import '../../../core/theme/app_colors.dart';

/// Ultra-high-performance, 120fps pull-to-refresh indicator.
/// Uses an [AnimationController] so Lottie only ticks during active refresh,
/// completely avoiding gesture thread contention, GPU offscreen saveLayer passes,
/// and memory churn during pull drags.
class PetRefreshIndicator extends StatefulWidget {
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
    return PetRefreshIndicator(
      refreshState: refreshState,
      pulledExtent: pulledExtent,
      refreshTriggerPullDistance: refreshTriggerPullDistance,
      refreshIndicatorExtent: refreshIndicatorExtent,
    );
  }

  @override
  State<PetRefreshIndicator> createState() => _PetRefreshIndicatorState();
}

class _PetRefreshIndicatorState extends State<PetRefreshIndicator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  bool _armedHapticFired = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
  }

  @override
  void didUpdateWidget(covariant PetRefreshIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.refreshState == RefreshIndicatorMode.armed && !_armedHapticFired) {
      HapticFeedback.lightImpact();
      _armedHapticFired = true;
    } else if (widget.refreshState == RefreshIndicatorMode.inactive) {
      _armedHapticFired = false;
    }

    // Only run Lottie animation ticks when actually in refresh mode
    if (widget.refreshState == RefreshIndicatorMode.refresh) {
      if (!_controller.isAnimating) {
        _controller.repeat();
      }
    } else if (widget.refreshState == RefreshIndicatorMode.drag) {
      if (_controller.isAnimating) {
        _controller.stop();
      }
      final double progress =
          (widget.pulledExtent / widget.refreshTriggerPullDistance).clamp(0.0, 1.0);
      _controller.value = progress * 0.25; // Gentle reactive posture tracking finger
    } else {
      if (_controller.isAnimating) {
        _controller.stop();
        _controller.reset();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.refreshState == RefreshIndicatorMode.inactive ||
        widget.pulledExtent <= 0.0) {
      return const SizedBox.shrink();
    }

    final double progress =
        (widget.pulledExtent / widget.refreshTriggerPullDistance).clamp(0.0, 1.0);

    // Dynamic scale without offscreen saveLayer Opacity widgets
    final double scale = widget.refreshState == RefreshIndicatorMode.refresh
        ? 1.0
        : (0.65 + 0.35 * progress).clamp(0.0, 1.05);

    return RepaintBoundary(
      child: Center(
        child: Transform.scale(
          scale: scale,
          child: SizedBox(
            height: 64,
            width: 90,
            child: Lottie.asset(
              'assets/lottie/cat_wagging.json',
              controller: _controller,
              fit: BoxFit.contain,
              addRepaintBoundary: true,
              filterQuality: FilterQuality.medium,
              errorBuilder: (context, error, stackTrace) => const Icon(
                Icons.pets_rounded,
                size: 32,
                color: AppColors.primary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
