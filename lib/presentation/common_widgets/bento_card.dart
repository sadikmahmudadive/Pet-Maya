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
    this.borderRadius = 24,
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

    final defaultBg = isDark
        ? const Color(0xFF1C1C1E).withValues(alpha: 0.85)
        : Colors.white.withValues(alpha: 0.92);

    final defaultBorder = isDark
        ? Colors.white.withValues(alpha: 0.08)
        : Colors.black.withValues(alpha: 0.06);

    Widget card = Container(
      padding: widget.padding,
      decoration: BoxDecoration(
        color: widget.gradient == null ? (widget.backgroundColor ?? defaultBg) : null,
        gradient: widget.gradient,
        borderRadius: BorderRadius.circular(widget.borderRadius),
        border: Border.all(
          color: widget.borderColor ?? defaultBorder,
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
            blurRadius: 18,
            offset: const Offset(0, 4),
          ),
        ],
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

