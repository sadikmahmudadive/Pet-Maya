import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';

/// A production-grade Bento container designed to build asymmetric,
/// structured, and modular Bento grids with Apple HIG tactile feedback.
class BentoCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final Color? backgroundColor;
  final Color? borderColor;
  final Gradient? gradient;
  final Widget? badge;
  final bool enableHoverScale;

  const BentoCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(18),
    this.borderRadius = AppRadius.lg,
    this.backgroundColor,
    this.borderColor,
    this.gradient,
    this.badge,
    this.enableHoverScale = true,
  });

  @override
  State<BentoCard> createState() => _BentoCardState();
}

class _BentoCardState extends State<BentoCard> with SingleTickerProviderStateMixin {
  late AnimationController _pressController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _pressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.97).animate(
      CurvedAnimation(parent: _pressController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pressController.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails _) {
    if (widget.onTap != null && widget.enableHoverScale) {
      _pressController.forward();
    }
  }

  void _onTapUp(TapUpDetails _) {
    if (widget.onTap != null && widget.enableHoverScale) {
      _pressController.reverse();
    }
  }

  void _onTapCancel() {
    if (widget.onTap != null && widget.enableHoverScale) {
      _pressController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final defaultBg = isDark ? const Color(0xFF0B2826) : Colors.white;

    Widget card = Container(
      padding: widget.padding,
      decoration: BoxDecoration(
        color: widget.gradient == null ? (widget.backgroundColor ?? defaultBg) : null,
        gradient: widget.gradient,
        borderRadius: BorderRadius.circular(widget.borderRadius),
        // Soft cards are lifted by shadow; only dark mode (or an explicit colour) gets an outline.
        border: widget.borderColor != null
            ? Border.all(color: widget.borderColor!, width: 1.0)
            : (isDark ? Border.all(color: const Color(0x2B1AB680), width: 1.0) : null),
        boxShadow: AppShadows.soft(isDark),
      ),
      child: widget.child,
    );

    if (widget.badge != null) {
      card = Stack(
        clipBehavior: Clip.none,
        children: [
          card,
          Positioned(
            top: 12,
            right: 12,
            child: widget.badge!,
          ),
        ],
      );
    }

    if (widget.onTap != null) {
      card = GestureDetector(
        onTapDown: _onTapDown,
        onTapUp: _onTapUp,
        onTapCancel: _onTapCancel,
        onTap: () {
          HapticFeedback.lightImpact();
          widget.onTap!();
        },
        behavior: HitTestBehavior.opaque,
        child: card,
      );
    }

    if (widget.enableHoverScale && widget.onTap != null) {
      return ScaleTransition(
        scale: _scaleAnimation,
        child: card,
      );
    }

    return card;
  }
}

