import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lottie/lottie.dart';
import '../../../core/theme/app_colors.dart';

/// Ultra-smooth, 60/120fps pull-to-refresh indicator featuring the Pet Maya cat mascot.
/// Fully isolated via [RepaintBoundary] and cached GPU drawing commands to eliminate
/// scroll jank, layout thrashing, and viewport repaints.
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

class _PetRefreshIndicatorState extends State<PetRefreshIndicator> {
  bool _armedHapticFired = false;

  @override
  void didUpdateWidget(covariant PetRefreshIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.refreshState == RefreshIndicatorMode.armed &&
        !_armedHapticFired) {
      HapticFeedback.lightImpact();
      _armedHapticFired = true;
    } else if (widget.refreshState == RefreshIndicatorMode.inactive) {
      _armedHapticFired = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.refreshState == RefreshIndicatorMode.inactive ||
        widget.pulledExtent <= 0.0) {
      return const SizedBox.shrink();
    }

    // Normalized progress [0.0, 1.0]
    final double progress =
        (widget.pulledExtent / widget.refreshTriggerPullDistance).clamp(
          0.0,
          1.0,
        );

    // Compute smooth scale and opacity based on gesture state
    final double scale;
    final double opacity;

    switch (widget.refreshState) {
      case RefreshIndicatorMode.drag:
        scale = (0.55 + (0.45 * Curves.easeOutBack.transform(progress))).clamp(
          0.0,
          1.0,
        );
        opacity = Curves.easeIn.transform(progress).clamp(0.0, 1.0);
        break;
      case RefreshIndicatorMode.armed:
        scale = 1.06;
        opacity = 1.0;
        break;
      case RefreshIndicatorMode.refresh:
        scale = 1.0;
        opacity = 1.0;
        break;
      case RefreshIndicatorMode.done:
        scale = (widget.pulledExtent / widget.refreshIndicatorExtent).clamp(
          0.0,
          1.0,
        );
        opacity = scale;
        break;
      case RefreshIndicatorMode.inactive:
        scale = 0.0;
        opacity = 0.0;
        break;
    }

    return RepaintBoundary(
      child: Center(
        child: Opacity(
          opacity: opacity,
          child: Transform.scale(
            scale: scale,
            child: Container(
              height: 68,
              width: 96,
              alignment: Alignment.center,
              child: Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  // Subtle emerald ambient glow behind cat
                  Container(
                    width: 56,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(
                            alpha:
                                widget.refreshState ==
                                    RefreshIndicatorMode.refresh
                                ? 0.22
                                : (0.12 * progress),
                          ),
                          blurRadius: 18,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                  ),

                  // High-performance hardware-cached mascot animation
                  RepaintBoundary(
                    child: SizedBox(
                      width: 90,
                      height: 64,
                      child: Lottie.asset(
                        'assets/lottie/cat_wagging.json',
                        fit: BoxFit.contain,
                        repeat: true,
                        renderCache: RenderCache.drawingCommands,
                        frameRate: const FrameRate(60),
                        addRepaintBoundary: true,
                        filterQuality: FilterQuality.medium,
                        errorBuilder: (context, error, stackTrace) =>
                            const Icon(
                              Icons.pets_rounded,
                              size: 32,
                              color: AppColors.primary,
                            ),
                      ),
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
