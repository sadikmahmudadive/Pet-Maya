import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

/// The page background of the soft & friendly look: warm cream with pastel clouds (peach top right, mint bottom left,
/// sky in the middle). Dark mode keeps quiet emerald glows. Fully static, so it costs nothing while idle.
class SoftBackdrop extends StatelessWidget {
  const SoftBackdrop({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final width = MediaQuery.sizeOf(context).width;
    final scheme = Theme.of(context).colorScheme;

    Widget cloud({required Color color, required double size, double? top, double? bottom, double? left, double? right}) {
      return Positioned(
        top: top,
        bottom: bottom,
        left: left,
        right: right,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: [color, color.withValues(alpha: 0)], stops: const [0.0, 0.72]),
          ),
        ),
      );
    }

    return ExcludeSemantics(
      child: RepaintBoundary(
        child: Stack(
          fit: StackFit.expand,
          children: isDark
              ? [
                  cloud(color: scheme.primary.withValues(alpha: 0.12), size: width * 0.9, top: -width * 0.25, left: -width * 0.25),
                  cloud(color: scheme.secondary.withValues(alpha: 0.08), size: width * 1.1, bottom: -width * 0.35, right: -width * 0.25),
                ]
              : [
                  cloud(color: AppColors.peach.withValues(alpha: 0.85), size: width * 1.0, top: -width * 0.38, right: -width * 0.3),
                  cloud(color: AppColors.mintSoft.withValues(alpha: 0.9), size: width * 1.1, bottom: -width * 0.4, left: -width * 0.4),
                  cloud(color: AppColors.sky.withValues(alpha: 0.6), size: width * 0.8, top: width * 0.9, right: -width * 0.45),
                ],
        ),
      ),
    );
  }
}
