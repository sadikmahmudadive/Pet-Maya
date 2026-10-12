import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Material 3 window size classes, measured in logical pixels of width.
enum ScreenSize { compact, medium, expanded }

/// Breakpoints and layout helpers shared by every screen, so phones, small
/// phones, foldables, tablets and desktop/web all lay out from one place.
class Responsive {
  Responsive._();

  /// < 600: phones in portrait.
  static const double mediumBreakpoint = 600;

  /// >= 840: tablets in landscape, desktop, web.
  static const double expandedBreakpoint = 840;

  /// Below this width (e.g. iPhone SE 1st gen, small Androids) layouts tighten.
  static const double smallPhoneWidth = 360;

  /// Readable column width for regular (form / detail / feed) screens.
  static const double contentMaxWidth = 760;

  /// Wider cap for dashboards and data-heavy admin screens.
  static const double dashboardMaxWidth = 1240;

  /// Text never scales past this, so accessibility font sizes don't explode
  /// fixed-height cards, while still honouring the user's setting.
  static const double maxTextScale = 1.3;
  static const double minTextScale = 0.85;

  static ScreenSize sizeOf(BuildContext context) =>
      sizeForWidth(MediaQuery.sizeOf(context).width);

  static ScreenSize sizeForWidth(double width) {
    if (width >= expandedBreakpoint) return ScreenSize.expanded;
    if (width >= mediumBreakpoint) return ScreenSize.medium;
    return ScreenSize.compact;
  }

  static bool isCompact(BuildContext context) =>
      sizeOf(context) == ScreenSize.compact;
  static bool isMedium(BuildContext context) =>
      sizeOf(context) == ScreenSize.medium;
  static bool isExpanded(BuildContext context) =>
      sizeOf(context) == ScreenSize.expanded;
  static bool isSmallPhone(BuildContext context) =>
      MediaQuery.sizeOf(context).width < smallPhoneWidth;

  /// Picks a value per size class; [medium] and [expanded] fall back upward.
  static T value<T>(
    BuildContext context, {
    required T compact,
    T? medium,
    T? expanded,
  }) {
    switch (sizeOf(context)) {
      case ScreenSize.expanded:
        return expanded ?? medium ?? compact;
      case ScreenSize.medium:
        return medium ?? compact;
      case ScreenSize.compact:
        return compact;
    }
  }

  /// Side gutter that grows with the screen (16 on small phones, 20 on phones,
  /// 24 on tablets, 32 on desktop).
  static double gutter(BuildContext context) {
    if (isSmallPhone(context)) return 16;
    return value(context, compact: 20.0, medium: 24.0, expanded: 32.0);
  }

  /// Number of grid columns that fit [width] with each tile at least
  /// [minTileWidth] wide, clamped to [min]..[max].
  static int columnsFor(
    double width, {
    required double minTileWidth,
    int min = 1,
    int max = 6,
  }) {
    final count = (width / minTileWidth).floor();
    return count.clamp(min, max);
  }

  /// Uniform scale for hand-tuned sizes (hero heights, icon blobs, etc.):
  /// 0.85 on tiny phones, 1.0 on a 390-wide phone, capped at 1.25.
  static double scale(BuildContext context) {
    final w = math.min(MediaQuery.sizeOf(context).width, contentMaxWidth);
    return (w / 390).clamp(0.85, 1.25);
  }

  /// Phones stay portrait (the UI is designed for it); tablets, foldables
  /// opened flat and desktops may rotate freely.
  static Future<void> applyOrientationPolicy() async {
    final views = WidgetsBinding.instance.platformDispatcher.views;
    if (views.isEmpty) return;
    final view = views.first;
    final shortest = view.physicalSize.shortestSide / view.devicePixelRatio;
    if (shortest > 0 && shortest < mediumBreakpoint) {
      await SystemChrome.setPreferredOrientations(const [
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);
    } else {
      await SystemChrome.setPreferredOrientations(const []);
    }
  }
}

extension ResponsiveContext on BuildContext {
  ScreenSize get screenSize => Responsive.sizeOf(this);
  bool get isCompact => Responsive.isCompact(this);
  bool get isTabletOrLarger => !Responsive.isCompact(this);
  bool get isSmallPhone => Responsive.isSmallPhone(this);
  double get gutter => Responsive.gutter(this);
}

/// Caps its child at [maxWidth] and centres it horizontally.
///
/// It also narrows `MediaQuery.size` for the subtree, so widgets that size
/// themselves with `MediaQuery.of(context).size.width * x` stay inside the
/// column instead of overflowing it on tablets and desktop.
class ResponsiveCenter extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final Alignment alignment;

  const ResponsiveCenter({
    super.key,
    required this.child,
    this.maxWidth = Responsive.contentMaxWidth,
    this.alignment = Alignment.topCenter,
  });

  @override
  Widget build(BuildContext context) {
    // The widget tree is identical on every width, so rotating a tablet or
    // resizing a desktop window never resets the state below.
    return LayoutBuilder(
      builder: (context, constraints) {
        final mq = MediaQuery.of(context);
        final available = constraints.hasBoundedWidth
            ? constraints.maxWidth
            : mq.size.width;
        final width = math.min(available, maxWidth);
        return Align(
          alignment: alignment,
          child: SizedBox(
            width: width,
            child: MediaQuery(
              data: available > maxWidth
                  ? mq.copyWith(size: Size(width, mq.size.height))
                  : mq,
              child: child,
            ),
          ),
        );
      },
    );
  }
}

/// Clamps the system text scale to [Responsive.minTextScale]..[Responsive.maxTextScale].
class ClampedTextScale extends StatelessWidget {
  final Widget child;
  const ClampedTextScale({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return MediaQuery(
      data: mq.copyWith(
        textScaler: mq.textScaler.clamp(
          minScaleFactor: Responsive.minTextScale,
          maxScaleFactor: Responsive.maxTextScale,
        ),
      ),
      child: child,
    );
  }
}
