import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/responsive.dart';
import 'soft_backdrop.dart';

class GlassScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final bool extendBodyBehindAppBar;
  final Color backgroundColor;
  /// Widest the body may grow on tablets/desktop; it is centred beyond that.
  /// Pass [double.infinity] for full-bleed screens such as maps.
  final double maxContentWidth;


  const GlassScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.extendBodyBehindAppBar = true,
    this.backgroundColor = const Color(0xFFA7C9B1),
    this.maxContentWidth = Responsive.contentMaxWidth,
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
        backgroundColor: backgroundColor != const Color(0xFFA7C9B1) 
            ? backgroundColor 
            : Theme.of(context).scaffoldBackgroundColor,
        extendBodyBehindAppBar: extendBodyBehindAppBar,
        appBar: appBar,
        body: Stack(
          children: [
            // Static, hardware-accelerated ambient glowing background (0% CPU / 0% GPU idle overhead)
            RepaintBoundary(
              child: const SoftBackdrop(),
            ),
            
            // Main Content (capped and centred on wide screens)
            maxContentWidth.isFinite
                ? ResponsiveCenter(maxWidth: maxContentWidth, child: body)
                : body,
          ],
        ),
        floatingActionButton: floatingActionButton,
        floatingActionButtonLocation: floatingActionButtonLocation,
        bottomNavigationBar: bottomNavigationBar,
      ),
    );
  }
}
