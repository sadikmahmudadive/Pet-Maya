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

    return RepaintBoundary(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          14,
          0,
          14,
          bottomInset > 0 ? bottomInset + 8 : 14,
        ),
        child: SizedBox(
          height: barHeight,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(
                sigmaX: 24,
                sigmaY: 24,
              ),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),

                  // Very subtle liquid glass surface
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: isDark
                        ? [
                      Colors.white.withValues(alpha: 0.10),
                      Colors.white.withValues(alpha: 0.045),
                    ]
                        : [
                      Colors.white.withValues(alpha: 0.72),
                      Colors.white.withValues(alpha: 0.48),
                    ],
                  ),

                  border: Border.all(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.14)
                        : Colors.white.withValues(alpha: 0.70),
                    width: 0.8,
                  ),

                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(
                        alpha: isDark ? 0.25 : 0.08,
                      ),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: _NavbarContent(
                  selectedIndex: selectedIndex,
                  isProvider: isProvider,
                  isDark: isDark,
                  onItemTapped: onItemTapped,
                  onFabTapped: onFabTapped,
                  getSlotIndex: _getSlotIndex,
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final activeSlot =
        getSlotIndex(selectedIndex > 3 ? 1 : selectedIndex);

        final slotWidth = constraints.maxWidth / 5;

        const indicatorWidth = 64.0;
        const indicatorHeight = 54.0;

        final indicatorLeft =
            activeSlot * slotWidth +
                (slotWidth - indicatorWidth) / 2;

        return Stack(
          children: [

            // --------------------------------------------------
            // LIQUID ACTIVE INDICATOR
            // --------------------------------------------------

            AnimatedPositioned(
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeOutCubic,

              left: indicatorLeft,
              top: 8,

              width: indicatorWidth,
              height: indicatorHeight,

              child: IgnorePointer(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 350),
                  curve: Curves.easeOutCubic,

                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),

                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isDark
                          ? [
                        Colors.white.withValues(alpha: 0.15),
                        AppColors.primary.withValues(alpha: 0.10),
                      ]
                          : [
                        Colors.white.withValues(alpha: 0.82),
                        AppColors.primary.withValues(alpha: 0.08),
                      ],
                    ),

                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.14)
                          : Colors.white.withValues(alpha: 0.55),
                      width: 0.8,
                    ),

                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(
                          alpha: isDark ? 0.10 : 0.08,
                        ),
                        blurRadius: 18,
                        spreadRadius: -2,
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // --------------------------------------------------
            // NAVIGATION ITEMS
            // --------------------------------------------------

            Row(
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
                    child: _LiquidActionButton(
                      onTap: onFabTapped,
                      isDark: isDark,
                    ),
                  ),
                ),

                _buildNavItem(
                  context,
                  index: 2,
                  selectedIcon: isProvider
                      ? Icons.forum_rounded
                      : Icons.pets_rounded,
                  unselectedIcon: isProvider
                      ? Icons.forum_outlined
                      : Icons.pets_outlined,
                  label: 'Community',
                ),

                _buildNavItem(
                  context,
                  index: 3,
                  selectedIcon:
                  CupertinoIcons.person_crop_circle_fill,
                  unselectedIcon:
                  CupertinoIcons.person_crop_circle,
                  label: 'Profile',
                ),
              ],
            ),
          ],
        );
      },
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

    final activeColor = isDark
        ? Colors.white
        : AppColors.primary;

    final inactiveColor = isDark
        ? Colors.white.withValues(alpha: 0.50)
        : Colors.black.withValues(alpha: 0.45);

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

              AnimatedSlide(
                duration: const Duration(milliseconds: 300),
                curve: Curves.easeOutCubic,

                offset: isSelected
                    ? const Offset(0, -0.04)
                    : Offset.zero,

                child: AnimatedScale(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutBack,

                  scale: isSelected ? 1.08 : 1.0,

                  child: Icon(
                    isSelected
                        ? selectedIcon
                        : unselectedIcon,

                    size: 23,

                    color: isSelected
                        ? activeColor
                        : inactiveColor,
                  ),
                ),
              ),

              const SizedBox(height: 3),

              // ------------------------------------------------
              // LABEL
              // ------------------------------------------------

              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOut,

                style: GoogleFonts.plusJakartaSans(
                  fontSize: 9.5,

                  fontWeight: isSelected
                      ? FontWeight.w700
                      : FontWeight.w500,

                  color: isSelected
                      ? activeColor
                      : inactiveColor,

                  letterSpacing: -0.1,

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

  const _LiquidActionButton({
    required this.onTap,
    required this.isDark,
  });

  @override
  State<_LiquidActionButton> createState() =>
      _LiquidActionButtonState();
}


class _LiquidActionButtonState
    extends State<_LiquidActionButton>
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
          final scale =
              1.0 - (_controller.value * 0.10);

          return Transform.scale(
            scale: scale,
            child: child,
          );
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
                  : [
                AppColors.primary,
                AppColors.secondary,
              ],
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
            child: Icon(
              CupertinoIcons.add,
              color: Colors.white,
              size: 22,
            ),
          ),
        ),
      ),
    );
  }
}