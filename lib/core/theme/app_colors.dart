import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Primary Palette (Deep & Premium)
  static const Color primary = Color(0xFF006684);
  static const Color primaryDark = Color(0xFF004D63);
  static const Color primaryLight = Color(0xFFBFE9FF);
  static const Color onPrimary = Colors.white;

  // Secondary & Accents (Vibrant & Warm)
  static const Color secondary = Color(0xFFFF8A80); // Vibrant Coral
  static const Color secondaryContainer = Color(0xFFFFD8D6);
  static const Color tertiary = Color(0xFF5D5B7D);
  
  // Accents & Semantics
  static const Color accentAmber = Color(0xFFFEB941);
  static const Color warningYellow = Color(0xFFFFC107);
  static const Color healthGreen = Color(0xFF66BB6A);
  static const Color healthGreenSoft = Color(0xFF81C784);
  static const Color healthGreenLight = Color(0xFFE8F5E9);
  static const Color lemonGreen = Color(0xFFD4E157);
  static const Color dangerRed = Color(0xFFFF035F);
  static const Color dangerRedDeep = Color(0xFFBA1A1A);
  static const Color dangerRedLight = Color(0xFFFFEBEE);

  // Background & Surfaces (Cloud White / Slate Deep)
  static const Color background = Color(0xFFFBFCFE);
  static const Color backgroundDark = Color(0xFF0A0F1E); // Deep Midnight
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF131C2B); // Deep Navy
  static const Color surfaceContainer = Color(0xFFF3F7FA);
  static const Color surfaceContainerDark = Color(0xFF1E293B);
  static const Color surfaceContainerLow = Color(0xFFF4F4F7);
  static const Color surfaceGlass = Color(0xF2FFFFFF);
  static const Color surfaceGlassDark = Color(0xE61E293B);

  // Text colors
  static const Color textPrimary = Color(0xFF191C1E);
  static const Color textPrimaryDark = Color(0xFFF8FAFC); // Slate 50
  static const Color textSecondary = Color(0xFF70787D);
  static const Color textSecondaryDark = Color(0xFF94A3B8); // Slate 400
  static const Color textTertiary = Color(0xFF9E9E9E);

  // Borders & Dividers
  static const Color borderLight = Color(0xFFE0E5E8);
  static const Color borderDark = Color(0xFF334155); // Slate 700
  static const Color cardShadow = Color(0x0D000000);
  static const Color cardShadowSoft = Color(0x14000000);

  // Gradients for Modern Depth
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF006684), Color(0xFF0088B0)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient coralGradient = LinearGradient(
    colors: [Color(0xFFFF8A80), Color(0xFFFF5252)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFFEB941), Color(0xFFFF9800)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassGradientLight = LinearGradient(
    colors: [Color(0xFAFFFFFF), Color(0xEEF8FAFC)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient glassGradientDark = LinearGradient(
    colors: [Color(0xF01E293B), Color(0xE60F172A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
