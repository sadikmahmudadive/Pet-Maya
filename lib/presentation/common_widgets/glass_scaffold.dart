import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';

class GlassScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final bool extendBodyBehindAppBar;
  final Color backgroundColor;

  const GlassScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
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
        bottomNavigationBar: bottomNavigationBar,
      ),
    );
  }

  Widget _buildBackgroundDecorations(BuildContext context, bool isDark) {
    final size = MediaQuery.of(context).size;
    final width = size.width;

    return RepaintBoundary(
      child: Stack(
        children: [
          Positioned(
            top: -width * 0.1,
            left: -width * 0.1,
            child: _buildStaticBlob(
              width * 0.7, 
              Theme.of(context).colorScheme.primary.withOpacity(isDark ? 0.08 : 0.05)
            ),
          ),
          Positioned(
            bottom: -width * 0.1,
            right: -width * 0.1,
            child: _buildStaticBlob(
              width * 0.8, 
              Theme.of(context).colorScheme.secondary.withOpacity(isDark ? 0.05 : 0.03)
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStaticBlob(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            color,
            color.withOpacity(0.0),
          ],
        ),
      ),
    );
  }
}
