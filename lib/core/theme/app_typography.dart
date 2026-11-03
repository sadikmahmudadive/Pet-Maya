import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Nunito throughout: its rounded terminals match the soft, friendly look, and it stays legible at small sizes.
/// Display and headings are heavy and tight; body text is a little looser than before for easy reading.
class AppTypography {
  AppTypography._();

  // Display
  static TextStyle get displayLarge => GoogleFonts.nunito(
        fontSize: 36,
        fontWeight: FontWeight.w900,
        height: 1.1,
        letterSpacing: -0.8,
      );

  static TextStyle get displayMedium => GoogleFonts.nunito(
        fontSize: 30,
        fontWeight: FontWeight.w900,
        height: 1.12,
        letterSpacing: -0.6,
      );

  static TextStyle get displaySmall => GoogleFonts.nunito(
        fontSize: 26,
        fontWeight: FontWeight.w800,
        height: 1.15,
        letterSpacing: -0.4,
      );

  // Headings
  static TextStyle get headlineLarge => GoogleFonts.nunito(
        fontSize: 23,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.3,
      );

  static TextStyle get headlineMedium => GoogleFonts.nunito(
        fontSize: 21,
        fontWeight: FontWeight.w800,
        height: 1.2,
        letterSpacing: -0.2,
      );

  static TextStyle get headlineSmall => GoogleFonts.nunito(
        fontSize: 19,
        fontWeight: FontWeight.w800,
        height: 1.25,
        letterSpacing: -0.1,
      );

  // Titles
  static TextStyle get titleLarge => GoogleFonts.nunito(
        fontSize: 18,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.1,
      );

  static TextStyle get titleMedium => GoogleFonts.nunito(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        letterSpacing: 0,
      );

  static TextStyle get titleSmall => GoogleFonts.nunito(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0,
      );

  // Body
  static TextStyle get bodyLarge => GoogleFonts.nunito(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        height: 1.5,
        letterSpacing: 0,
      );

  static TextStyle get bodyMedium => GoogleFonts.nunito(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        height: 1.5,
        letterSpacing: 0,
      );

  static TextStyle get bodySmall => GoogleFonts.nunito(
        fontSize: 12.5,
        fontWeight: FontWeight.w500,
        height: 1.4,
        letterSpacing: 0.1,
      );

  // Labels
  static TextStyle get labelLarge => GoogleFonts.nunito(
        fontSize: 14,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.1,
      );

  static TextStyle get labelMedium => GoogleFonts.nunito(
        fontSize: 12.5,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      );

  static TextStyle get labelSmall => GoogleFonts.nunito(
        fontSize: 11.5,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.4,
      );

  // Section header text (caps with relaxed tracking)
  static TextStyle get iosSectionHeader => GoogleFonts.nunito(
        fontSize: 12,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.8,
      );
}
