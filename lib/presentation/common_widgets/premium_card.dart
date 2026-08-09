import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'glass_card.dart';

class PremiumCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double borderRadius;
  final bool useGlass;
  final double opacity;
  final Color? backgroundColor;
  final BorderSide? borderSide;

  const PremiumCard({
    super.key,
    required this.child,
    this.onTap,
    this.borderRadius = 28,
    this.useGlass = true,
    this.opacity = 0.5,
    this.backgroundColor,
    this.borderSide,
  });

  @override
  State<PremiumCard> createState() => _PremiumCardState();
}

class _PremiumCardState extends State<PremiumCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.96).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        if (widget.onTap != null) {
          _controller.forward();
          HapticFeedback.lightImpact();
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
                child: widget.child,
              )
            : Container(
                decoration: BoxDecoration(
                  color: widget.backgroundColor ?? Theme.of(context).cardTheme.color,
                  borderRadius: BorderRadius.circular(widget.borderRadius),
                  border: widget.borderSide != null ? Border.fromBorderSide(widget.borderSide!) : null,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: widget.child,
              ),
      ),
    );
  }
}
