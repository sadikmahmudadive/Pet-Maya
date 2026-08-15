import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';

enum ToastType { success, error, info, warning }

class PremiumToast extends StatefulWidget {
  final String message;
  final ToastType type;
  final VoidCallback onDismiss;

  const PremiumToast({
    super.key,
    required this.message,
    required this.type,
    required this.onDismiss,
  });

  static void show(BuildContext context, String message, {ToastType type = ToastType.success}) {
    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) => PremiumToast(
        message: message,
        type: type,
        onDismiss: () => entry.remove(),
      ),
    );
    Overlay.of(context).insert(entry);
  }

  @override
  State<PremiumToast> createState() => _PremiumToastState();
}

class _PremiumToastState extends State<PremiumToast> {
  bool _isVisible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 50), () {
      if (mounted) setState(() => _isVisible = true);
    });
    Future.delayed(const Duration(seconds: 3), _hide);
  }

  void _hide() {
    if (mounted) {
      setState(() => _isVisible = false);
      Future.delayed(const Duration(milliseconds: 500), widget.onDismiss);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedPositioned(
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeOutBack,
      bottom: _isVisible ? 100 : -100,
      left: 32,
      right: 32,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 400),
        opacity: _isVisible ? 0.95 : 0.0,
        child: Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                decoration: BoxDecoration(
                  color: _getBgColor(widget.type).withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    )
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_getIcon(widget.type), color: Colors.white, size: 18),
                    const SizedBox(width: 12),
                    Flexible(
                      child: Text(
                        widget.message,
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  IconData _getIcon(ToastType type) {
    switch (type) {
      case ToastType.success: return Icons.check_circle_rounded;
      case ToastType.error: return Icons.error_rounded;
      case ToastType.warning: return Icons.warning_rounded;
      case ToastType.info: return Icons.info_rounded;
    }
  }

  Color _getBgColor(ToastType type) {
    switch (type) {
      case ToastType.success: return AppColors.healthGreen;
      case ToastType.error: return AppColors.dangerRed;
      case ToastType.warning: return AppColors.accentAmber;
      case ToastType.info: return AppColors.primary;
    }
  }
}

