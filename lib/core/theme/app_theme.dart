import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';
import 'app_typography.dart';

/// Soft & friendly Material 3 theme. Light and dark share one builder so they can never drift apart.
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme => _build(Brightness.light);
  static ThemeData get darkTheme => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final dark = brightness == Brightness.dark;
    final ink = dark ? AppColors.textPrimaryDark : AppColors.textPrimary;
    final muted = dark ? AppColors.textSecondaryDark : AppColors.textSecondary;
    final surface = dark ? AppColors.surfaceDark : AppColors.surface;
    final field = dark ? AppColors.surfaceContainerDark : AppColors.surfaceContainerLow;
    final border = dark ? AppColors.iosBorderDark : AppColors.iosBorder;

    OutlineInputBorder inputBorder(Color color, [double width = 1]) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppRadius.md),
      borderSide: BorderSide(color: color, width: width),
    );

    final scheme = ColorScheme(
      brightness: brightness,
      primary: AppColors.primary,
      onPrimary: dark ? Colors.white : AppColors.onPrimary,
      primaryContainer: dark ? AppColors.primaryDark : AppColors.primaryLight,
      onPrimaryContainer: dark ? AppColors.primaryLight : AppColors.primaryDark,
      secondary: AppColors.secondary,
      onSecondary: Colors.white,
      secondaryContainer: dark ? AppColors.surfaceContainerDark : AppColors.secondaryContainer,
      onSecondaryContainer: dark ? Colors.white : AppColors.secondaryDark,
      tertiary: AppColors.tertiary,
      onTertiary: Colors.white,
      error: AppColors.dangerRed,
      onError: Colors.white,
      surface: surface,
      onSurface: ink,
      surfaceContainer: dark ? AppColors.surfaceContainerDark : AppColors.surfaceContainer,
      onSurfaceVariant: muted,
      outline: border,
      shadow: dark ? Colors.black : AppColors.cardShadow,
    );

    final buttonShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md));
    const buttonPadding = EdgeInsets.symmetric(horizontal: 26, vertical: 17);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      platform: TargetPlatform.iOS,
      splashFactory: NoSplash.splashFactory,
      highlightColor: (dark ? Colors.white : Colors.black).withValues(alpha: dark ? 0.05 : 0.035),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
      colorScheme: scheme,
      textTheme: TextTheme(
        displayLarge: AppTypography.displayLarge.copyWith(color: ink),
        displayMedium: AppTypography.displayMedium.copyWith(color: ink),
        displaySmall: AppTypography.displaySmall.copyWith(color: ink),
        headlineLarge: AppTypography.headlineLarge.copyWith(color: ink),
        headlineMedium: AppTypography.headlineMedium.copyWith(color: ink),
        headlineSmall: AppTypography.headlineSmall.copyWith(color: ink),
        titleLarge: AppTypography.titleLarge.copyWith(color: ink),
        titleMedium: AppTypography.titleMedium.copyWith(color: ink),
        titleSmall: AppTypography.titleSmall.copyWith(color: ink),
        bodyLarge: AppTypography.bodyLarge.copyWith(color: ink),
        bodyMedium: AppTypography.bodyMedium.copyWith(color: muted),
        bodySmall: AppTypography.bodySmall.copyWith(color: muted),
        labelLarge: AppTypography.labelLarge.copyWith(color: dark ? AppColors.primary : AppColors.primaryDark),
        labelMedium: AppTypography.labelMedium.copyWith(color: muted),
        labelSmall: AppTypography.labelSmall.copyWith(color: muted),
      ),
      scaffoldBackgroundColor: dark ? AppColors.backgroundDark : AppColors.background,
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: ink),
        titleTextStyle: AppTypography.titleLarge.copyWith(color: ink),
        systemOverlayStyle: dark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),
      // Sheets are rounded on top, with a visible drag handle, and stay a comfortable width on tablets.
      bottomSheetTheme: BottomSheetThemeData(
        constraints: const BoxConstraints(maxWidth: 640),
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        showDragHandle: true,
        dragHandleColor: muted.withValues(alpha: 0.4),
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl))),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg + 2)),
        titleTextStyle: AppTypography.titleLarge.copyWith(color: ink),
        contentTextStyle: AppTypography.bodyMedium.copyWith(color: muted),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: dark ? AppColors.surfaceContainerDark : AppColors.textPrimary,
        contentTextStyle: AppTypography.bodyMedium.copyWith(color: Colors.white, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
        insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: field,
        selectedColor: dark ? AppColors.primaryDark : AppColors.primaryLight,
        disabledColor: field.withValues(alpha: 0.5),
        side: BorderSide.none,
        shape: const StadiumBorder(),
        showCheckmark: false,
        labelStyle: AppTypography.labelLarge.copyWith(color: ink),
        secondaryLabelStyle: AppTypography.labelLarge.copyWith(color: dark ? Colors.white : AppColors.primaryDark),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      ),
      dividerTheme: DividerThemeData(color: dark ? AppColors.iosDividerDark : AppColors.iosDivider, thickness: 0.6, space: 1),
      cardTheme: CardThemeData(
        color: surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        shadowColor: AppColors.cardShadow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          side: BorderSide(color: border, width: 0.8),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: field,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: inputBorder(Colors.transparent, 0),
        enabledBorder: inputBorder(Colors.transparent, 0),
        disabledBorder: inputBorder(Colors.transparent, 0),
        focusedBorder: inputBorder(AppColors.primary, 2),
        errorBorder: inputBorder(AppColors.dangerRed, 1.5),
        focusedErrorBorder: inputBorder(AppColors.dangerRed, 2),
        hintStyle: AppTypography.bodyMedium.copyWith(color: muted.withValues(alpha: 0.85)),
        labelStyle: AppTypography.bodyMedium.copyWith(color: muted),
        floatingLabelStyle: AppTypography.labelMedium.copyWith(color: dark ? AppColors.primary : AppColors.primaryDark),
        errorStyle: AppTypography.bodySmall.copyWith(color: dark ? const Color(0xFFFF8A80) : AppColors.dangerRedDeep, fontWeight: FontWeight.w700),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryStrong,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.primaryStrong.withValues(alpha: 0.35),
          disabledForegroundColor: Colors.white.withValues(alpha: 0.8),
          elevation: 0,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primaryStrong,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.primaryStrong.withValues(alpha: 0.35),
          disabledForegroundColor: Colors.white.withValues(alpha: 0.8),
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: dark ? AppColors.primary : AppColors.primaryDark,
          side: BorderSide(color: dark ? AppColors.primary : AppColors.primaryDark.withValues(alpha: 0.5), width: 1.5),
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: dark ? AppColors.primary : AppColors.primaryDark,
          shape: buttonShape,
          textStyle: AppTypography.titleSmall.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.all(Colors.white),
        trackColor: WidgetStateProperty.resolveWith(
          (s) => s.contains(WidgetState.selected) ? AppColors.primary : (dark ? Colors.white24 : const Color(0xFFD5CFC4)),
        ),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.primary),
      // The caret, selection handles and highlight belong to the palette too, not the platform default.
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: AppColors.primary,
        selectionColor: AppColors.primary.withValues(alpha: 0.28),
        selectionHandleColor: AppColors.primary,
      ),
    );
  }
}
