import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

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

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).padding.bottom;
    const double barHeight = 72;
    final double containerHeight = 85 + (bottomPadding > 0 ? 0 : 15); // Adjust for pop-out

    return Container(
      height: containerHeight,
      margin: EdgeInsets.fromLTRB(24, 0, 24, bottomPadding > 0 ? bottomPadding : 16),
      child: Stack(
        alignment: Alignment.bottomCenter,
        clipBehavior: Clip.none,
        children: [
          // 1. The Ultra-Premium Frosted Glass Dock
          ClipRRect(
            borderRadius: BorderRadius.circular(36),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                height: barHeight,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
                  borderRadius: BorderRadius.circular(36),
                  border: Border.all(
                    color: Theme.of(context).dividerColor.withOpacity(0.2),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(Theme.of(context).brightness == Brightness.dark ? 0.2 : 0.04),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildTabItem(context, 0, Icons.grid_view_rounded, 'Home'),
                    _buildTabItem(context, 1, Icons.explore_rounded, 'Explore'),
                    const SizedBox(width: 65), // Reduced width to prevent overflow
                    _buildTabItem(context, 2, Icons.forum_rounded, 'Social'),
                    _buildTabItem(context, 3, Icons.person_rounded, 'Me'),
                  ],
                ),
              ),
            ),
          ),

          // 2. Center Action Button (The "Jewel")
          Positioned(
            top: 0, // Perfectly sits on the top edge of the pill
            child: _buildCenterAction(context),
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem(BuildContext context, int index, IconData icon, String label) {
    final bool isSelected = selectedIndex == index;
    final Color activeColor = Theme.of(context).colorScheme.primary;
    final Color inactiveColor = Theme.of(context).hintColor;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (!isSelected) {
            HapticFeedback.selectionClick();
            onItemTapped(index);
          }
        },
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? activeColor : inactiveColor,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? activeColor : inactiveColor,
              ),
            ),
            // Minimalist dot indicator
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.only(top: 4),
              height: 3,
              width: isSelected ? 3 : 0,
              decoration: BoxDecoration(
                color: activeColor,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCenterAction(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.heavyImpact();
        onFabTapped();
      },
      child: Container(
        width: 62, // Reduced size slightly
        height: 62,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Theme.of(context).colorScheme.primary, 
          border: Border.all(
            color: Theme.of(context).colorScheme.surface, 
            width: 3,
          ),
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.4),
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: const Icon(
          Icons.add, 
          color: Colors.white,
          size: 34,
        ),
      ),
    );
  }
}
