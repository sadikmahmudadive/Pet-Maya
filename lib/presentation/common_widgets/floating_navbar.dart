import 'dart:ui';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';

class FloatingNavbar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;
  final VoidCallback onFabTapped;
  final bool isProvider;

  const FloatingNavbar({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
    required this.onFabTapped,
    this.isProvider = false,
  });

  int _getSlotIndex(int navIndex) {
    switch (navIndex) {
      case 0:
        return 0;
      case 1:
        return 1;
      case 2:
        return 3;
      case 3:
        return 4;
      default:
        return 0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bottomInset = MediaQuery.of(context).padding.bottom;

    const double barHeight = 70;
    const double barRadius = 35; // Perfect stadium / capsule curve

    return RepaintBoundary(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          14,
          0,
          14,
          bottomInset > 0 ? bottomInset + 8 : 14,
        ),
        child: Container(
          height: barHeight,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(barRadius),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.32 : 0.07),
                blurRadius: 28,
                offset: const Offset(0, 8),
                spreadRadius: -2,
              ),
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.20 : 0.04),
                blurRadius: 10,
                offset: const Offset(0, 3),
                spreadRadius: -1,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(barRadius),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
              child: CustomPaint(
                foregroundPainter: _LiquidGlassRimPainter(
                  borderRadius: barRadius,
                  borderWidth: 1.0,
                  isDark: isDark,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(barRadius),
                    // Clear iOS glass translucent surface
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isDark
                          ? [
                              Colors.white.withValues(alpha: 0.12),
                              Colors.white.withValues(alpha: 0.04),
                            ]
                          : [
                              Colors.white.withValues(alpha: 0.45),
                              Colors.white.withValues(alpha: 0.20),
                            ],
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Top specular edge glint
                      Positioned(
                        top: 0,
                        left: 35,
                        right: 35,
                        height: 1.0,
                        child: IgnorePointer(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.white.withValues(
                                    alpha: isDark ? 0.35 : 0.70,
                                  ),
                                  Colors.transparent,
                                ],
                                stops: const [0.0, 0.5, 1.0],
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Main Navbar Content
                      _NavbarContent(
                        selectedIndex: selectedIndex,
                        isProvider: isProvider,
                        isDark: isDark,
                        onItemTapped: onItemTapped,
                        onFabTapped: onFabTapped,
                        getSlotIndex: _getSlotIndex,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// ------------------------------------------------------------
/// NAVBAR CONTENT
/// ------------------------------------------------------------

class _NavbarContent extends StatelessWidget {
  final int selectedIndex;
  final bool isProvider;
  final bool isDark;
  final Function(int) onItemTapped;
  final VoidCallback onFabTapped;
  final int Function(int) getSlotIndex;

  const _NavbarContent({
    required this.selectedIndex,
    required this.isProvider,
    required this.isDark,
    required this.onItemTapped,
    required this.onFabTapped,
    required this.getSlotIndex,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _buildNavItem(
          context,
          index: 0,
          selectedIcon: isProvider
              ? Icons.medical_services_rounded
              : CupertinoIcons.house_fill,
          unselectedIcon: isProvider
              ? Icons.medical_services_outlined
              : CupertinoIcons.house,
          label: isProvider ? 'Console' : 'Home',
        ),

        _buildNavItem(
          context,
          index: 1,
          selectedIcon: isProvider
              ? Icons.pets_rounded
              : CupertinoIcons.compass_fill,
          unselectedIcon: isProvider
              ? Icons.pets_outlined
              : CupertinoIcons.compass,
          label: isProvider ? 'Patients' : 'Explore',
        ),

        // ------------------------------------------------
        // CENTER ACTION
        // ------------------------------------------------
        Expanded(
          child: Center(
            child: _LiquidActionButton(onTap: onFabTapped, isDark: isDark),
          ),
        ),

        _buildNavItem(
          context,
          index: 2,
          selectedIcon: isProvider ? Icons.forum_rounded : Icons.pets_rounded,
          unselectedIcon: isProvider
              ? Icons.forum_outlined
              : Icons.pets_outlined,
          label: 'Community',
        ),

        _buildNavItem(
          context,
          index: 3,
          selectedIcon: CupertinoIcons.person_crop_circle_fill,
          unselectedIcon: CupertinoIcons.person_crop_circle,
          label: 'Profile',
        ),
      ],
    );
  }

  // ------------------------------------------------------------
  // NAV ITEM
  // ------------------------------------------------------------

  Widget _buildNavItem(
    BuildContext context, {
    required int index,
    required IconData selectedIcon,
    required IconData unselectedIcon,
    required String label,
  }) {
    final isSelected = selectedIndex == index;

    // Native iOS HIG tab bar colors
    final activeColor = isDark ? const Color(0xFF34D399) : AppColors.primary;

    final inactiveColor = isDark
        ? const Color(0xFF98989D) // iOS dark SystemGray
        : const Color(0xFF8E8E93); // iOS light SystemGray

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,

        onTap: () {
          if (!isSelected) {
            HapticFeedback.selectionClick();
            onItemTapped(index);
          }
        },

        child: SizedBox(
          height: 70,

          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,

            children: [
              // ------------------------------------------------
              // ICON
              // ------------------------------------------------

              AnimatedScale(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutBack,

                scale: isSelected ? 1.08 : 1.0,

                child: Icon(
                  isSelected ? selectedIcon : unselectedIcon,

                  size: 24,

                  color: isSelected ? activeColor : inactiveColor,
                ),
              ),

              const SizedBox(height: 4),

              // ------------------------------------------------
              // LABEL
              // ------------------------------------------------
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,

                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,

                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,

                  color: isSelected ? activeColor : inactiveColor,

                  letterSpacing: -0.2,

                  height: 1.0,
                ),

                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// ------------------------------------------------------------
/// LIQUID CENTER ACTION
/// ------------------------------------------------------------

class _LiquidActionButton extends StatefulWidget {
  final VoidCallback onTap;
  final bool isDark;

  const _LiquidActionButton({required this.onTap, required this.isDark});

  @override
  State<_LiquidActionButton> createState() => _LiquidActionButtonState();
}

class _LiquidActionButtonState extends State<_LiquidActionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 160),
      lowerBound: 0.0,
      upperBound: 1.0,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,

      onTapDown: (_) {
        _controller.forward();
      },

      onTapUp: (_) {
        _controller.reverse();
      },

      onTapCancel: () {
        _controller.reverse();
      },

      onTap: () {
        HapticFeedback.mediumImpact();
        widget.onTap();
      },

      child: AnimatedBuilder(
        animation: _controller,

        builder: (context, child) {
          final scale = 1.0 - (_controller.value * 0.10);

          return Transform.scale(scale: scale, child: child);
        },

        child: Container(
          width: 48,
          height: 48,

          decoration: BoxDecoration(
            shape: BoxShape.circle,

            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,

              colors: widget.isDark
                  ? [
                      AppColors.primary.withValues(alpha: 0.90),
                      AppColors.secondary.withValues(alpha: 0.75),
                    ]
                  : [AppColors.primary, AppColors.secondary],
            ),

            border: Border.all(
              color: Colors.white.withValues(alpha: 0.45),
              width: 1.0,
            ),

            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(
                  alpha: widget.isDark ? 0.28 : 0.20,
                ),
                blurRadius: 18,
                spreadRadius: -2,
                offset: const Offset(0, 5),
              ),
            ],
          ),

          child: const Center(
            child: Icon(CupertinoIcons.add, color: Colors.white, size: 22),
          ),
        ),
      ),
    );
  }
}

/// ------------------------------------------------------------
/// LIQUID GLASS RIM PAINTER
/// Draws a subpixel gradient stroke along the capsule border with
/// specular top-left brilliance, simulating refractive glass edges.
/// ------------------------------------------------------------

class _LiquidGlassRimPainter extends CustomPainter {
  final double borderRadius;
  final double borderWidth;
  final bool isDark;

  const _LiquidGlassRimPainter({
    required this.borderRadius,
    this.borderWidth = 1.2,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(
      borderWidth / 2,
      borderWidth / 2,
      size.width - borderWidth,
      size.height - borderWidth,
    );

    final rrect = RRect.fromRectAndRadius(
      rect,
      Radius.circular(borderRadius - borderWidth / 2),
    );

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? [
                Colors.white.withValues(alpha: 0.35),
                Colors.white.withValues(alpha: 0.15),
                Colors.white.withValues(alpha: 0.05),
                Colors.white.withValues(alpha: 0.12),
              ]
            : [
                Colors.white.withValues(alpha: 0.85),
                Colors.white.withValues(alpha: 0.50),
                Colors.white.withValues(alpha: 0.15),
                Colors.white.withValues(alpha: 0.30),
              ],
        stops: const [0.0, 0.35, 0.70, 1.0],
      ).createShader(rect);

    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(covariant _LiquidGlassRimPainter oldDelegate) {
    return oldDelegate.borderRadius != borderRadius ||
        oldDelegate.borderWidth != borderWidth ||
        oldDelegate.isDark != isDark;
  }
}
