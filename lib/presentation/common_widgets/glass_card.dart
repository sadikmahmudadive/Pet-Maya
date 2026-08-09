import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double blur; // Kept for API compatibility
  final double opacity;
  final double borderRadius;
  final Color? borderColor;
  final BorderSide? borderSide;
  final Gradient? gradient;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.blur = 0,
    this.opacity = 0.75,
    this.borderRadius = 28,
    this.borderColor,
    this.borderSide,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultGradient = isDark ? AppColors.glassGradientDark : AppColors.glassGradientLight;
    
    return RepaintBoundary(
      child: Container(
        padding: padding,
        decoration: BoxDecoration(
          color: gradient == null ? Theme.of(context).colorScheme.surface.withOpacity(opacity) : null,
          gradient: gradient ?? defaultGradient,
          borderRadius: BorderRadius.circular(borderRadius),
          border: borderSide != null 
            ? Border.fromBorderSide(borderSide!) 
            : Border.all(
                color: borderColor ?? Theme.of(context).dividerColor.withOpacity(isDark ? 0.25 : 0.15),
                width: 1.2,
              ),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black.withOpacity(0.3) : AppColors.primary.withOpacity(0.04),
              blurRadius: 24,
              spreadRadius: 0,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: child,
      ),
    );
  }
}
