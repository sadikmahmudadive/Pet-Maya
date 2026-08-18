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

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.blur = 6, // Optimized from 16 to 6 for maximum GPU performance & zero heat
    this.opacity = 0.85,
    this.borderRadius = 24,
    this.borderColor,
    this.borderSide,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultGradient = isDark ? AppColors.glassGradientDark : AppColors.glassGradientLight;
    
    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur > 0 ? blur : 4, sigmaY: blur > 0 ? blur : 4),
          child: Container(
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
                    color: borderColor ?? (isDark ? AppColors.iosBorderDark : AppColors.iosBorder),
                    width: 0.8,
                  ),
              boxShadow: [
                BoxShadow(
                  color: isDark ? Colors.black.withValues(alpha: 0.25) : Colors.black.withValues(alpha: 0.03),
                  blurRadius: 14,
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
