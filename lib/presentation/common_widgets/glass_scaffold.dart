import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';

class GlassScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final bool extendBodyBehindAppBar;
  final Color backgroundColor;

  const GlassScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.extendBodyBehindAppBar = true,
    this.backgroundColor = const Color(0xFFF3F9FF),
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: backgroundColor != const Color(0xFFF3F9FF) 
            ? backgroundColor 
            : Theme.of(context).scaffoldBackgroundColor,
        extendBodyBehindAppBar: extendBodyBehindAppBar,
        appBar: appBar,
        body: Stack(
          children: [
            // Background abstract shapes (Hard Optimized: Only 2 static shapes)
            _buildBackgroundDecorations(context, isDark),
            
            // Main Body
            body,
          ],
        ),
        floatingActionButton: floatingActionButton,
        floatingActionButtonLocation: floatingActionButtonLocation,
        bottomNavigationBar: bottomNavigationBar,
      ),
    );
  }

  Widget _buildBackgroundDecorations(BuildContext context, bool isDark) {
    final size = MediaQuery.of(context).size;
    final width = size.width;

    return Stack(
      children: [
        Positioned(
          top: -width * 0.2,
          left: -width * 0.2,
          child: _FluidBlob(
            size: width * 0.9,
            color: Theme.of(context).colorScheme.primary.withValues(alpha: isDark ? 0.08 : 0.05),
            duration: const Duration(seconds: 15),
          ),
        ),
        Positioned(
          bottom: -width * 0.3,
          right: -width * 0.2,
          child: _FluidBlob(
            size: width * 1.1,
            color: Theme.of(context).colorScheme.secondary.withValues(alpha: isDark ? 0.05 : 0.04),
            duration: const Duration(seconds: 20),
            reverse: true,
          ),
        ),
      ],
    );
  }
}

class _FluidBlob extends StatefulWidget {
  final double size;
  final Color color;
  final Duration duration;
  final bool reverse;

  const _FluidBlob({
    required this.size,
    required this.color,
    required this.duration,
    this.reverse = false,
  });

  @override
  State<_FluidBlob> createState() => _FluidBlobState();
}

class _FluidBlobState extends State<_FluidBlob> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _moveAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)..repeat(reverse: true);

    _moveAnimation = Tween<Offset>(
      begin: widget.reverse ? const Offset(0.05, 0.05) : Offset.zero,
      end: widget.reverse ? Offset.zero : const Offset(0.05, 0.05),
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine));

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine)
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(
            _moveAnimation.value.dx * widget.size,
            _moveAnimation.value.dy * widget.size,
          ),
          child: Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [widget.color, widget.color.withValues(alpha: 0)],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
