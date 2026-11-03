import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double blur;
  final double opacity;
  final double borderRadius;
  final Color? borderColor;
  final BorderSide? borderSide;
  final Gradient? gradient;
  final Color? glowColor;
  final bool enableBlur;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.blur = 0,
    this.opacity = 0.85,
    this.borderRadius = AppRadius.lg,
    this.borderColor,
    this.borderSide,
    this.gradient,
    this.glowColor,
    this.enableBlur = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Soft cards: a plain surface lifted by a warm, offset shadow. No frosted border; glow tints it when asked.
    Widget cardContent = Container(
      padding: padding,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: gradient == null
            ? (isDark ? AppColors.iosCardDark.withValues(alpha: opacity.clamp(0.0, 1.0) < 0.9 ? 0.92 : opacity) : AppColors.iosCard)
            : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: borderSide != null
            ? Border.fromBorderSide(borderSide!)
            : (isDark
                ? Border.all(color: borderColor ?? Colors.white.withValues(alpha: 0.08), width: 1.0)
                : (borderColor != null ? Border.all(color: borderColor!, width: 1.0) : null)),
        boxShadow: AppShadows.soft(isDark, tint: glowColor),
      ),
      child: child,
    );

    // Optimized: Only allocate GPU offscreen blur textures when explicitly requested (e.g. Modals / Navbars)
    if (enableBlur && blur > 0) {
      return RepaintBoundary(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
            child: cardContent,
          ),
        ),
      );
    }

    // The container clips its own child to the rounded shape, so the shadow outside it stays visible.
    return RepaintBoundary(child: cardContent);
  }
}
