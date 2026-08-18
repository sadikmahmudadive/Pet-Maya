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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    const double barHeight = 66;
    final double totalHeight = barHeight + (bottomPadding > 0 ? bottomPadding : 10);
    final activeSlot = _getSlotIndex(selectedIndex > 3 ? 1 : selectedIndex);

    return RepaintBoundary(
      child: Container(
        height: totalHeight,
        margin: EdgeInsets.fromLTRB(14, 0, 14, bottomPadding > 0 ? bottomPadding : 10),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
            height: barHeight,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0x99131D28)
                  : const Color(0xB8FFFFFF),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.14)
                    : Colors.white.withValues(alpha: 0.75),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? Colors.black.withValues(alpha: 0.45)
                      : AppColors.primary.withValues(alpha: 0.08),
                  blurRadius: 28,
                  offset: const Offset(0, 10),
                  spreadRadius: 0,
                ),
                BoxShadow(
                  color: isDark
                      ? Colors.black.withValues(alpha: 0.25)
                      : Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final double totalWidth = constraints.maxWidth;
                final double slotWidth = totalWidth / 5;
                final double indicatorWidth = slotWidth - 6;
                const double indicatorHeight = 54;

                return Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    // ─── Sliding Liquid Glass Morph Indicator ───
                    AnimatedPositioned(
                      duration: const Duration(milliseconds: 340),
                      curve: Curves.fastLinearToSlowEaseIn,
                      left: activeSlot * slotWidth + (slotWidth - indicatorWidth) / 2,
                      top: (barHeight - indicatorHeight) / 2,
                      child: Container(
                        width: indicatorWidth,
                        height: indicatorHeight,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppColors.primary.withValues(alpha: isDark ? 0.24 : 0.16),
                              AppColors.secondary.withValues(alpha: isDark ? 0.14 : 0.08),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: AppColors.primary.withValues(alpha: isDark ? 0.40 : 0.25),
                            width: 1.0,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: isDark ? 0.20 : 0.10),
                              blurRadius: 12,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ─── Navigation Items Row ───
                    Row(
                      children: [
                        _buildNavItem(
                          context: context,
                          index: 0,
                          selectedIcon: isProvider ? Icons.medical_services_rounded : CupertinoIcons.house_fill,
                          unselectedIcon: isProvider ? Icons.medical_services_outlined : CupertinoIcons.house,
                          label: isProvider ? 'Console' : 'Home',
                        ),
                        _buildNavItem(
                          context: context,
                          index: 1,
                          selectedIcon: isProvider ? Icons.pets_rounded : CupertinoIcons.compass_fill,
                          unselectedIcon: isProvider ? Icons.pets_outlined : CupertinoIcons.compass,
                          label: isProvider ? 'Patients' : 'Explore',
                        ),
                        Expanded(
                          child: Center(
                            child: _buildCenterActionButton(context, isDark),
                          ),
                        ),
                        _buildNavItem(
                          context: context,
                          index: 2,
                          selectedIcon: isProvider ? Icons.forum_rounded : Icons.pets_rounded,
                          unselectedIcon: isProvider ? Icons.forum_outlined : Icons.pets_outlined,
                          label: 'Community',
                        ),
                        _buildNavItem(
                          context: context,
                          index: 3,
                          selectedIcon: CupertinoIcons.person_crop_circle_fill,
                          unselectedIcon: CupertinoIcons.person_crop_circle,
                          label: isProvider ? 'Profile' : 'Profile',
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    ));
  }

  Widget _buildNavItem({
    required BuildContext context,
    required int index,
    required IconData selectedIcon,
    required IconData unselectedIcon,
    required String label,
  }) {
    final bool isSelected = selectedIndex == index;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final Color activeColor = AppColors.primary;
    final Color inactiveColor = isDark
        ? const Color(0xFF8E8E93)
        : const Color(0xFF8E8E93);

    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (!isSelected) {
            HapticFeedback.selectionClick();
            onItemTapped(index);
          }
        },
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          height: 66,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedScale(
                scale: isSelected ? 1.08 : 1.0,
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutBack,
                child: Icon(
                  isSelected ? selectedIcon : unselectedIcon,
                  color: isSelected ? activeColor : inactiveColor,
                  size: 22,
                ),
              ),
              const SizedBox(height: 2),
              AnimatedDefaultTextStyle(
                duration: const Duration(milliseconds: 180),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                  color: isSelected ? activeColor : inactiveColor,
                  letterSpacing: -0.2,
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

  Widget _buildCenterActionButton(BuildContext context, bool isDark) {
    return _SpringActionButton(
      onTap: () {
        HapticFeedback.mediumImpact();
        onFabTapped();
      },
    );
  }
}

class _SpringActionButton extends StatefulWidget {
  final VoidCallback onTap;

  const _SpringActionButton({required this.onTap});

  @override
  State<_SpringActionButton> createState() => _SpringActionButtonState();
}

class _SpringActionButtonState extends State<_SpringActionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.88).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
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
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      onTap: widget.onTap,
      behavior: HitTestBehavior.opaque,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1AB680),
                Color(0xFF00B6D2),
              ],
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.35),
              width: 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.35),
                blurRadius: 12,
                offset: const Offset(0, 4),
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
