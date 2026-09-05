import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import '../../core/theme/app_colors.dart';

class TailWaggingLoader extends StatelessWidget {
  final double size;
  final bool useBottomPosition;
  final bool isGlobal;

  const TailWaggingLoader({
    super.key,
    this.size = 140, // Balanced premium size
    this.useBottomPosition = false,
    this.isGlobal = false,
  });

  @override
  Widget build(BuildContext context) {
    final Widget loader = RepaintBoundary(
      child: SizedBox(
        width: size,
        height: size * (200 / 280),
        child: Lottie.asset(
          'assets/lottie/cat_wagging.json',
          fit: BoxFit.contain,
          repeat: true,
          renderCache: RenderCache.drawingCommands,
          frameRate: FrameRate.max,
          frameRate: const FrameRate(60),
          addRepaintBoundary: true,
          filterQuality: FilterQuality.medium,
          errorBuilder: (context, error, stackTrace) {
            return Icon(Icons.pets_rounded, size: size * 0.4, color: AppColors.primary);
          },
        ),
      ),
    );

    if (!useBottomPosition && !isGlobal) {
      return Center(child: loader);
    }

    Widget content = Center(
      child: loader,
    );

    if (isGlobal) {
      return Material(
        color: Colors.black.withValues(alpha: 0.2),
        child: content,
      );
    }

    return content;
  }
}
