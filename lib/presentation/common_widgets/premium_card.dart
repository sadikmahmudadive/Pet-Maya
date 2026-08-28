import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'glass_card.dart';
import '../../core/theme/app_colors.dart';

class PremiumCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double borderRadius;
  final bool useGlass;
  final double opacity;
  final Color? backgroundColor;
  final BorderSide? borderSide;
  final Color? glowColor;
  final bool enableBlur;

  const PremiumCard({
    super.key,
    required this.child,
    this.onTap,
    this.borderRadius = 22,
    this.useGlass = true,
    this.opacity = 0.85,
    this.backgroundColor,
    this.borderSide,
    this.glowColor,
    this.enableBlur = false,
  });

  @override
  State<PremiumCard> createState() => _PremiumCardState();
}

class _PremiumCardState extends State<PremiumCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 140),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.97,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTapDown: (_) {
        if (widget.onTap != null) {
          _controller.forward();
          HapticFeedback.selectionClick();
        }
      },
      onTapUp: (_) {
        if (widget.onTap != null) _controller.reverse();
      },
      onTapCancel: () {
        if (widget.onTap != null) _controller.reverse();
      },
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.useGlass
            ? GlassCard(
                borderRadius: widget.borderRadius,
                opacity: widget.opacity,
                borderSide: widget.borderSide,
                glowColor: widget.glowColor,
                enableBlur: widget.enableBlur,
                child: widget.child,
              )
            : Container(
                decoration: BoxDecoration(
                  color:
                      widget.backgroundColor ??
                      (isDark ? AppColors.iosCardDark : AppColors.iosCard),
                  borderRadius: BorderRadius.circular(widget.borderRadius),
                  border: widget.borderSide != null
                      ? Border.fromBorderSide(widget.borderSide!)
                      : Border.all(
                          color: isDark
                              ? AppColors.iosBorderDark
                              : AppColors.iosBorder,
                          width: 0.8,
                        ),
                  boxShadow: [
                    BoxShadow(
                      color: widget.glowColor != null
                          ? widget.glowColor!.withValues(alpha: isDark ? 0.2 : 0.08)
                          : (isDark
                              ? Colors.black.withValues(alpha: 0.35)
                              : Colors.black.withValues(alpha: 0.04)),
                      blurRadius: widget.glowColor != null ? 22 : 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: widget.child,
              ),
      ),
    );
  }
}
