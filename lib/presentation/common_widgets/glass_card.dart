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
    this.borderRadius = 24,
    this.borderColor,
    this.borderSide,
    this.gradient,
    this.glowColor,
    this.enableBlur = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultGradient = isDark ? AppColors.glassGradientDark : AppColors.glassGradientLight;
    
    Widget cardContent = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null
            ? (isDark ? AppColors.iosCardDark.withValues(alpha: opacity) : AppColors.iosCard.withValues(alpha: opacity))
            : null,
        gradient: gradient ?? defaultGradient,
        borderRadius: BorderRadius.circular(borderRadius),
        border: borderSide != null 
          ? Border.fromBorderSide(borderSide!) 
          : Border.all(
              color: borderColor ?? (isDark ? Colors.white.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.8)),
              width: 1.0,
            ),
        boxShadow: [
          BoxShadow(
            color: glowColor != null
                ? glowColor!.withValues(alpha: isDark ? 0.2 : 0.08)
                : (isDark ? Colors.black.withValues(alpha: 0.35) : AppColors.cardShadow),
            blurRadius: glowColor != null ? 20 : 16,
            spreadRadius: 0,
            offset: const Offset(0, 5),
          ),
        ],
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

    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: cardContent,
      ),
    );
  }
}
