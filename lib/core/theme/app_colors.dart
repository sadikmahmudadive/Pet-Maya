import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ─── Primary Triad (#1AB680, #00B6D2, #FFFFFF) ───
  static const Color primary = Color(0xFF1AB680);
  static const Color primaryDark = Color(0xFF138A61);
  static const Color primaryLight = Color(0xFFE2F9F0);
  static const Color onPrimary = Color(0xFFFFFFFF);

  // Secondary & Accent (Radiant Turquoise / Electric Cyan)
  static const Color secondary = Color(0xFF00B6D2);
  static const Color secondaryDark = Color(0xFF008AA0);
  static const Color secondaryLight = Color(0xFFE0F9FD);
  static const Color secondaryContainer = Color(0xFFD0F4FB);
  static const Color tertiary = Color(0xFF3B82F6); // Modern Royal Blue Accent

  // Accents & Semantics (Apple HIG vibrance)
  static const Color accentAmber = Color(0xFFFF9500);
  static const Color warningYellow = Color(0xFFFFCC00);
  static const Color healthGreen = Color(0xFF34C759);
  static const Color healthGreenSoft = Color(0xFF30D158);
  static const Color healthGreenLight = Color(0xFFE8F9ED);
  static const Color lemonGreen = Color(0xFFA4E82F);
  static const Color dangerRed = Color(0xFFFF3B30);
  static const Color dangerRedDeep = Color(0xFFD70015);
  static const Color dangerRedLight = Color(0xFFFFEBEA);

  // Background & Surfaces (Apple iOS System Grouped Theme)
  static const Color background = Color(0xFFEDFFF3);
  static const Color backgroundDark = Color(0xFF000000); // True Apple Dark Mode
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1C1C1E); // Apple Inset Card Dark
  static const Color surfaceContainer = Color(0xFFFFFFFF);
  static const Color surfaceContainerDark = Color(0xFF2C2C2E);
  static const Color surfaceContainerLow = Color(0xFFF8F9FA);
  static const Color surfaceGlass = Color(0xE6FFFFFF);
  static const Color surfaceGlassDark = Color(0xCC1C1C1E);

  // Apple HIG Specific Tokens
  static const Color iosSystemGroupedBgDark = Color(0xFF000000);
  static const Color iosCard = Color(0xFFFFFFFF);
  static const Color iosCardDark = Color(0xFF1C1C1E);
  static const Color iosCardSecondary = Color(0xFFF8F9FA);
  static const Color iosCardSecondaryDark = Color(0xFF2C2C2E);
  static const Color iosBorder = Color(0x12000000);
  static const Color iosBorderDark = Color(0x22FFFFFF);
  static const Color iosDivider = Color(0x1F3C3C43);
  static const Color iosDividerDark = Color(0x33545458);

  // Text colors (Apple HIG dynamic text levels)
  static const Color textPrimary = Color(0xFF000000);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF8E8E93);
  static const Color textSecondaryDark = Color(0xFF98989D);
  static const Color textTertiary = Color(0xFFC7C7CC);

  // Borders & Dividers
  static const Color borderLight = Color(0x12000000);
  static const Color borderDark = Color(0x24FFFFFF);
  static const Color cardShadow = Color(0x08000000);
  static const Color cardShadowSoft = Color(0x0C1AB680);

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

  // Glass Gradients
  static const LinearGradient glassGradientLight = LinearGradient(
    colors: [Color(0xF5FFFFFF), Color(0xEBFFFFFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassGradientDark = LinearGradient(
    colors: [Color(0xE61C1C1E), Color(0xD91C1C1E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
