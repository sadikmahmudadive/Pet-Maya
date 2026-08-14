import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ─── Primary Triad (#1AB680, #00B6D2, #FFFFFF) ───
  // Primary (Vibrant Emerald / Mint Green)
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

  // Accents & Semantics
  static const Color accentAmber = Color(0xFFF59E0B);
  static const Color warningYellow = Color(0xFFFBBF24);
  static const Color healthGreen = Color(0xFF10B981);
  static const Color healthGreenSoft = Color(0xFF34D399);
  static const Color healthGreenLight = Color(0xFFECFDF5);
  static const Color lemonGreen = Color(0xFF84CC16);
  static const Color dangerRed = Color(0xFFEF4444);
  static const Color dangerRedDeep = Color(0xFFDC2626);
  static const Color dangerRedLight = Color(0xFFFEE2E2);

  // Background & Surfaces (Clean White / Refined Dark)
  static const Color background = Color(0xFFF7FBF9);
  static const Color backgroundDark = Color(0xFF0C141A); // Deep Slate Mint Dark
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF132029); // Deep Navy Slate
  static const Color surfaceContainer = Color(0xFFEEF7F4);
  static const Color surfaceContainerDark = Color(0xFF1A2B37);
  static const Color surfaceContainerLow = Color(0xFFF3FAF7);
  static const Color surfaceGlass = Color(0xF2FFFFFF);
  static const Color surfaceGlassDark = Color(0xE6132029);

  // Text colors
  static const Color textPrimary = Color(0xFF111827);
  static const Color textPrimaryDark = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF4B5563);
  static const Color textSecondaryDark = Color(0xFF9CA3AF);
  static const Color textTertiary = Color(0xFF9CA3AF);

  // Borders & Dividers
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color borderDark = Color(0xFF1F2937);
  static const Color cardShadow = Color(0x0A1AB680);
  static const Color cardShadowSoft = Color(0x1400B6D2);

  // ─── Signature Gradients ───
  // Primary Signature Gradient: Mint Green ➔ Turquoise Cyan
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF1AB680), Color(0xFF00B6D2)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Cyan Gradient
  static const LinearGradient cyanGradient = LinearGradient(
    colors: [Color(0xFF00B6D2), Color(0xFF38BDF8)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Mint Gradient
  static const LinearGradient mintGradient = LinearGradient(
    colors: [Color(0xFF1AB680), Color(0xFF34D399)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Warm Coral Accent Gradient
  static const LinearGradient coralGradient = LinearGradient(
    colors: [Color(0xFFFF7A7A), Color(0xFFFF5252)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Amber Accent Gradient
  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Glass Gradients
  static const LinearGradient glassGradientLight = LinearGradient(
    colors: [Color(0xFAFFFFFF), Color(0xEEF3FAF7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassGradientDark = LinearGradient(
    colors: [Color(0xF01A2B37), Color(0xE60C141A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
