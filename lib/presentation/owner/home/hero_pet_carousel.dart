import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/bento_card.dart';
import '../../common_widgets/premium_toast.dart';
import '../../common_widgets/resilient_network_image.dart';
import '../devices/my_devices_screen.dart';
import '../pets/pet_passport_screen.dart';
import '../pets/vaccination_screen.dart';
import 'pet_tracker_screen.dart';

/// A production-ready, auto-sweeping carousel that displays hero bento cards
/// for all of a user's pets.
///
/// Sweeps automatically to the next pet every 10 seconds. Pauses during manual
/// drag/interaction and resumes when released. Features interactive Apple-style
/// indicator pills for fast navigation between pets.
class HeroPetCarousel extends StatefulWidget {
  final List<PetModel> pets;
  final List<ServiceRecordModel> allRecords;

  const HeroPetCarousel({
    super.key,
    required this.pets,
    required this.allRecords,
  });

  @override
  State<HeroPetCarousel> createState() => _HeroPetCarouselState();
}

class _HeroPetCarouselState extends State<HeroPetCarousel> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _autoSweepTimer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoSweepTimer();
  }

  void _startAutoSweepTimer() {
    _autoSweepTimer?.cancel();
    if (widget.pets.length > 1) {
      _autoSweepTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
        if (!mounted || !_pageController.hasClients) return;
        final nextIndex = (_currentPage + 1) % widget.pets.length;
        _pageController.animateToPage(
          nextIndex,
          duration: const Duration(milliseconds: 650),
          curve: Curves.easeInOutCubic,
        );
      });
    }
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentPage = index;
    });
    // Restart 10s timer when page changes so user has a full 10s on the new pet
    _startAutoSweepTimer();
  }

  @override
  void didUpdateWidget(covariant HeroPetCarousel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pets.length != oldWidget.pets.length) {
      if (_currentPage >= widget.pets.length) {
        _currentPage = 0;
        if (_pageController.hasClients) {
          _pageController.jumpToPage(0);
        }
      }
      _startAutoSweepTimer();
    }
  }

  @override
  void dispose() {
    _autoSweepTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.pets.isEmpty) return const SizedBox.shrink();

    // Single pet fallback: no PageView or indicator dots needed
    if (widget.pets.length == 1) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: _buildHeroBentoPetCard(
          context,
          widget.pets.first,
          widget.allRecords,
        ),
      );
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            height: 215,
            child: NotificationListener<ScrollNotification>(
              onNotification: (notification) {
                if (notification is ScrollStartNotification) {
                  if (notification.dragDetails != null) {
                    // User started dragging, pause timer
                    _autoSweepTimer?.cancel();
                  }
                } else if (notification is ScrollEndNotification) {
                  // Drag finished, resume timer
                  _startAutoSweepTimer();
                }
                return false;
              },
              child: PageView.builder(
                controller: _pageController,
                itemCount: widget.pets.length,
                physics: const BouncingScrollPhysics(),
                onPageChanged: _onPageChanged,
                itemBuilder: (context, index) {
                  final pet = widget.pets[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _buildHeroBentoPetCard(
                      context,
                      pet,
                      widget.allRecords,
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 10),
          // Animated indicator pills
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              widget.pets.length,
              (index) {
                final isSelected = _currentPage == index;
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    _pageController.animateToPage(
                      index,
                      duration: const Duration(milliseconds: 500),
                      curve: Curves.easeInOutCubic,
                    );
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    margin: const EdgeInsets.symmetric(horizontal: 3.5),
                    width: isSelected ? 22 : 6,
                    height: 5,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? Colors.white24 : Colors.black12),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBentoPetCard(
    BuildContext context,
    PetModel pet,
    List<ServiceRecordModel> allRecords,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final petRecords = allRecords.where((r) => r.petId == pet.petID).toList();
    final hasMedicalLogs =
        petRecords.isNotEmpty ||
        (pet.vaccinationDetails?.trim().isNotEmpty == true);
    final petHealthScore = hasMedicalLogs ? pet.healthIndex : 0;

    final repo = context.watch<AppStateRepository>();
    final petDevice = repo.devices.where((d) => d.petId == pet.petID).firstOrNull;
    final hasDevice = petDevice != null;
    final isOnline = petDevice?.isOnline ?? false;
    final batteryLevel = petDevice?.batteryLevel ?? 0;

    final Color statusColor = hasDevice
        ? (isOnline ? AppColors.healthGreen : AppColors.dangerRed)
        : (isDark ? Colors.white38 : Colors.grey.shade500);

    final String statusText = hasDevice
        ? (isOnline
            ? '${petDevice.typeDisplayName.toUpperCase()} ONLINE • $batteryLevel% BATTERY'
            : '${petDevice.typeDisplayName.toUpperCase()} OFFLINE')
        : 'NO TRACKER LINKED';

    return BentoCard(
      padding: const EdgeInsets.all(20),
      borderRadius: 28,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? [const Color(0xFF0E302C), const Color(0xFF082422)]
            : [Colors.white, const Color(0xFFF3F7FA)],
      ),
      borderColor: isDark
          ? const Color(0x2B1AB680)
          : AppColors.primary.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar with circular vitality ring
              Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 76,
                    height: 76,
                    child: CircularProgressIndicator(
                      value: hasMedicalLogs ? (petHealthScore / 100.0) : 0.0,
                      strokeWidth: 4,
                      backgroundColor: isDark ? Colors.white12 : Colors.black12,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        hasMedicalLogs
                            ? AppColors.healthGreen
                            : AppColors.accentAmber,
                      ),
                    ),
                  ),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(34),
                    child: pet.photoUrl != null && pet.photoUrl!.isNotEmpty
                        ? ResilientNetworkImage(
                            imageUrl: pet.photoUrl!,
                            width: 66,
                            height: 66,
                            fit: BoxFit.cover,
                            fallbackAssetPath:
                                'assets/images/pet_placeholder.png',
                          )
                        : Container(
                            width: 66,
                            height: 66,
                            color: AppColors.primary.withValues(alpha: 0.1),
                            child: const Icon(
                              Icons.pets,
                              size: 28,
                              color: AppColors.primary,
                            ),
                          ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: hasMedicalLogs
                            ? AppColors.healthGreen
                            : AppColors.accentAmber,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        hasMedicalLogs ? '$petHealthScore%' : '0%',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (hasDevice) ...[
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: statusColor,
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              statusText,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: statusColor,
                                letterSpacing: 0.4,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                    ],
                    Text(
                      pet.name,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        _buildHeroMetaPill(context, pet.breed),
                        _buildHeroMetaPill(context, '${pet.age} yrs'),
                        _buildHeroMetaPill(context, '${pet.weight} kg'),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          // Action Buttons Bar
          Row(
            children: [
              Expanded(
                child: _buildHeroActionPill(
                  context,
                  icon: Icons.badge_outlined,
                  label: 'Passport',
                  color: AppColors.primary,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => PetPassportScreen(pet: pet),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildHeroActionPill(
                  context,
                  icon: Icons.vaccines_outlined,
                  label: 'Vaccines',
                  color: const Color(0xFF10B981),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => VaccinationScreen(initialPet: pet),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildHeroActionPill(
                  context,
                  icon: Icons.radar_rounded,
                  label: 'Radar',
                  color: const Color(0xFF0288D1),
                  onTap: () {
                    final repo = context.read<AppStateRepository>();
                    final hasGpsDevice = repo.devices.any(
                      (d) => d.deviceType == 'gps_collar' || d.isOnline,
                    );
                    if (!hasGpsDevice) {
                      repo.showToast(
                        'No GPS device paired! Please pair a tracker first 🛰️',
                        type: ToastType.warning,
                        context: context,
                      );
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MyDevicesScreen(),
                        ),
                      );
                      return;
                    }
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PetTrackerScreen(pet: pet),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeroMetaPill(BuildContext context, String text) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.08)
            : Colors.black.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white70 : Colors.black87,
        ),
      ),
    );
  }

  Widget _buildHeroActionPill(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: isDark ? 0.16 : 0.10),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withValues(alpha: isDark ? 0.35 : 0.2),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
