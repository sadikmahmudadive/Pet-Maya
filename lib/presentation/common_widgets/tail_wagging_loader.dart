import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// Ultra-lightweight, zero-lag loading indicator for page loads & async operations.
class TailWaggingLoader extends StatelessWidget {
  final double size;
  final bool useBottomPosition;
  final bool isGlobal;

  const TailWaggingLoader({
    super.key,
    this.size = 40,
    this.useBottomPosition = false,
    this.isGlobal = false,
  });

  @override
  Widget build(BuildContext context) {
    final Widget loader = Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CupertinoActivityIndicator(radius: 16),
        const SizedBox(height: 12),
        const Icon(Icons.pets_rounded, size: 20, color: AppColors.primary),
      ],
    );

    if (isGlobal) {
      return Material(
        color: Colors.black.withValues(alpha: 0.2),
        child: Center(child: loader),
      );
    }

    return Center(child: loader);
  }
}
