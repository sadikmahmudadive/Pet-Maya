import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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
            // Static, hardware-accelerated ambient glowing background (0% CPU / 0% GPU idle overhead)
            RepaintBoundary(
              child: _buildStaticBackground(context, isDark),
            ),
            
            // Main Content
            body,
          ],
        ),
        floatingActionButton: floatingActionButton,
        floatingActionButtonLocation: floatingActionButtonLocation,
        bottomNavigationBar: bottomNavigationBar,
      ),
    );
  }

  Widget _buildStaticBackground(BuildContext context, bool isDark) {
    final size = MediaQuery.of(context).size;
    final width = size.width;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Top-left soft ambient glow
        Positioned(
          top: -width * 0.25,
          left: -width * 0.25,
          child: Container(
            width: width * 0.9,
            height: width * 0.9,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Theme.of(context).colorScheme.primary.withValues(alpha: isDark ? 0.12 : 0.08),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.7],
              ),
            ),
          ),
        ),
        // Bottom-right soft ambient glow
        Positioned(
          bottom: -width * 0.35,
          right: -width * 0.25,
          child: Container(
            width: width * 1.1,
            height: width * 1.1,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Theme.of(context).colorScheme.secondary.withValues(alpha: isDark ? 0.08 : 0.06),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.75],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
