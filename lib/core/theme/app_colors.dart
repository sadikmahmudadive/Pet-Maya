import 'package:flutter/material.dart';

/// Pet Maya colour tokens: a warm, soft palette. Brand mint stays the lead colour; everything around it is cream,
/// peach, butter, sky and lilac so screens feel friendly instead of clinical. Text tokens are tuned for contrast on
/// the cream background (body text at least 4.5:1).
class AppColors {
  AppColors._();

  // ─── Primary Triad (#1AB680, #00B6D2, #FFFFFF) ───
  static const Color primary = Color(0xFF1AB680);
  static const Color primaryDark = Color(0xFF0E7A56);
  static const Color primaryLight = Color(0xFFDDF6EA);
  /// Fill for buttons that carry white text (4.5:1); the lighter [primary] is for accents and large shapes.
  static const Color primaryStrong = Color(0xFF0C8760);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // Secondary & Accent (Radiant Turquoise / Electric Cyan)
  static const Color secondary = Color(0xFF00B6D2);
  static const Color secondaryDark = Color(0xFF007E94);
  static const Color secondaryLight = Color(0xFFDDF4FA);
  static const Color secondaryContainer = Color(0xFFCDEFF8);
  static const Color tertiary = Color(0xFF3B82F6); // Modern Royal Blue Accent

  // Accents & Semantics
  static const Color accentAmber = Color(0xFFFF9500);
  static const Color warningYellow = Color(0xFFFFCC00);
  static const Color healthGreen = Color(0xFF34C759);
  static const Color healthGreenSoft = Color(0xFF30D158);
  static const Color healthGreenLight = Color(0xFFE8F9ED);
  static const Color lemonGreen = Color(0xFFA4E82F);
  static const Color dangerRed = Color(0xFFFF3B30);
  static const Color dangerRedDeep = Color(0xFFD70015);
  static const Color dangerRedLight = Color(0xFFFFEBEA);

  // ─── Soft pastel tints (backgrounds for tiles, chips and illustrations) and their readable "ink" colours ───
  static const Color peach = Color(0xFFFFE6D5);
  static const Color peachInk = Color(0xFF9A4A1B);
  static const Color butter = Color(0xFFFFF0BF);
  static const Color butterInk = Color(0xFF7A5C00);
  static const Color mintSoft = Color(0xFFD9F5E7);
  static const Color mintInk = Color(0xFF0E6B4B);
  static const Color sky = Color(0xFFDDF1FB);
  static const Color skyInk = Color(0xFF0B6384);
  static const Color lilac = Color(0xFFECE5FF);
  static const Color lilacInk = Color(0xFF5B3FB0);
  static const Color rose = Color(0xFFFFE0E6);
  static const Color roseInk = Color(0xFFAA2745);

  // Background & Surfaces. Light is warm cream; dark keeps the deep emerald base.
  static const Color background = Color(0xFFFFFAF2);
  static const Color backgroundDark = Color(0xFF021E20);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF0B2826);
  static const Color surfaceContainer = Color(0xFFFFFFFF);
  static const Color surfaceContainerDark = Color(0xFF103330);
  static const Color surfaceContainerLow = Color(0xFFF7F1E8);
  static const Color surfaceGlass = Color(0xF2FFFFFF);
  static const Color surfaceGlassDark = Color(0xD90B2826);

  // Card tokens
  static const Color iosSystemGroupedBgDark = Color(0xFF021E20);
  static const Color iosCard = Color(0xFFFFFFFF);
  static const Color iosCardDark = Color(0xFF0B2826);
  static const Color iosCardSecondary = Color(0xFFF7F1E8);
  static const Color iosCardSecondaryDark = Color(0xFF103330);
  static const Color iosBorder = Color(0x14403020);
  static const Color iosBorderDark = Color(0x2B1AB680);
  static const Color iosDivider = Color(0x1F403020);
  static const Color iosDividerDark = Color(0x2B1AB680);

  // Text colours: warm ink instead of pure black. Secondary and tertiary both pass 4.5:1 on cream and white.
  static const Color textPrimary = Color(0xFF1E2A28);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF55625F);
  static const Color textSecondaryDark = Color(0xFFA3B2AF);
  static const Color textTertiary = Color(0xFF68756F);

  // Borders & Dividers
  static const Color borderLight = Color(0x14403020);
  static const Color borderDark = Color(0x24FFFFFF);
  static const Color cardShadow = Color(0x141F3C34);
  static const Color cardShadowSoft = Color(0x0F1AB680);

  // ─── Signature Gradients ───
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF1AB680), Color(0xFF00B6D2)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cyanGradient = LinearGradient(
    colors: [Color(0xFF00B6D2), Color(0xFF38BDF8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient mintGradient = LinearGradient(
    colors: [Color(0xFF1AB680), Color(0xFF34D399)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient coralGradient = LinearGradient(
    colors: [Color(0xFFFF6B6B), Color(0xFFFF4757)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFFF9500), Color(0xFFFF5E3A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Warm morning wash behind hero areas: peach into butter.
  static const LinearGradient sunriseGradient = LinearGradient(
    colors: [Color(0xFFFFE6D5), Color(0xFFFFF0BF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  /// Calm mint into sky, for friendly hero cards.
  static const LinearGradient meadowGradient = LinearGradient(
    colors: [Color(0xFFD9F5E7), Color(0xFFDDF1FB)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Card fills (kept as gradients so older call sites keep working; light is plain white now, not frosted).
  static const LinearGradient glassGradientLight = LinearGradient(
    colors: [Color(0xFFFFFFFF), Color(0xFFFFFFFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassGradientDark = LinearGradient(
    colors: [Color(0xFA0E302C), Color(0xF0082422)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

/// Corner radii used across the app: bigger and rounder than before.
class AppRadius {
  AppRadius._();
  static const double sm = 14;
  static const double md = 20;
  static const double lg = 26;
  static const double xl = 32;
}

/// Soft, offset shadows (never a hard block or a zero-offset halo).
class AppShadows {
  AppShadows._();

  static List<BoxShadow> soft(bool isDark, {Color? tint}) => [
    BoxShadow(
      color: isDark
          ? Colors.black.withValues(alpha: 0.35)
          : (tint ?? const Color(0xFF1F3C34)).withValues(alpha: 0.08),
      blurRadius: 24,
      offset: const Offset(0, 10),
    ),
    BoxShadow(
      color: isDark ? Colors.black.withValues(alpha: 0.2) : const Color(0xFF1F3C34).withValues(alpha: 0.04),
      blurRadius: 4,
      offset: const Offset(0, 1),
    ),
  ];
}
