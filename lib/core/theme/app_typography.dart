import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTypography {
  AppTypography._();

  static TextStyle get displayLarge => GoogleFonts.fredoka(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: 0,
      );

  static TextStyle get displayMedium => GoogleFonts.fredoka(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: 0,
      );

  static TextStyle get displaySmall => GoogleFonts.fredoka(
        fontSize: 24,
        fontWeight: FontWeight.w700,
      );

  static TextStyle get headlineLarge => GoogleFonts.fredoka(
        fontSize: 24,
        fontWeight: FontWeight.w700,
      );

  static TextStyle get headlineMedium => GoogleFonts.fredoka(
        fontSize: 20,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get headlineSmall => GoogleFonts.fredoka(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleLarge => GoogleFonts.fredoka(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleMedium => GoogleFonts.fredoka(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get titleSmall => GoogleFonts.fredoka(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.normal,
      );

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.6, // Increased line height for better readability
      );

  static TextStyle get bodySmall => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get labelLarge => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get labelMedium => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get labelSmall => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5, // Relaxed letter spacing for small caps
      );
}
