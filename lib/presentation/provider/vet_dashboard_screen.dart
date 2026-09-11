import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/event_model.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/premium_toast.dart';
import '../common_widgets/floating_navbar.dart';
import '../auth/login_screen.dart';
import '../owner/community/community_feed_screen.dart';
import '../owner/home/user_profile_screen.dart';
import 'add_service_record_modal.dart';
import 'client_list_screen.dart';

class ProviderRoleConfig {
  final String consoleTitle;
  final String badgeText;
  final IconData badgeIcon;
  final String greetingPrefix;
  final String kpi1Label;
  final String kpi2Label;
  final String appointmentsTitle;
  final String caseLogsTitle;

  const ProviderRoleConfig({
    required this.consoleTitle,
    required this.badgeText,
    required this.badgeIcon,
    required this.greetingPrefix,
    required this.kpi1Label,
    required this.kpi2Label,
    required this.appointmentsTitle,
    required this.caseLogsTitle,
  });
}

ProviderRoleConfig _getRoleConfig(UserRole? role) {
  switch (role) {
    case UserRole.grooming:
      return const ProviderRoleConfig(
        consoleTitle: 'Grooming Studio Console',
        badgeText: '✂️ GROOMING & SPA',
        badgeIcon: Icons.content_cut_rounded,
        greetingPrefix: 'Groomer',
        kpi1Label: 'APPOINTMENTS',
        kpi2Label: 'CLIENT PETS',
        appointmentsTitle: 'Grooming Schedule',
        caseLogsTitle: 'Grooming & Style Logs',
      );
    case UserRole.boarding:
      return const ProviderRoleConfig(
        consoleTitle: 'Boarding Resort Console',
        badgeText: '🏡 BOARDING & HOTEL',
        badgeIcon: Icons.night_shelter_rounded,
        greetingPrefix: 'Manager',
        kpi1Label: 'RESERVATIONS',
        kpi2Label: 'STAYING GUESTS',
        appointmentsTitle: 'Guest Stays & Reservations',
        caseLogsTitle: 'Stay Care Logs',
      );
    case UserRole.shelter:
      return const ProviderRoleConfig(
        consoleTitle: 'Rescue & Shelter Console',
        badgeText: '🐾 SHELTER & RESCUE',
        badgeIcon: Icons.volunteer_activism_rounded,
        greetingPrefix: 'Coordinator',
        kpi1Label: 'ADOPTIONS',
        kpi2Label: 'RESCUE CASES',
        appointmentsTitle: 'Adoption Appointments',
        caseLogsTitle: 'Intake & Care Logs',
      );
    case UserRole.veterinarian:
    default:
      return const ProviderRoleConfig(
        consoleTitle: 'Clinic Practice Console',
        badgeText: '🩺 VETERINARY PRACTICE',
        badgeIcon: Icons.local_hospital_rounded,
        greetingPrefix: 'Dr.',
        kpi1Label: 'CONSULTATIONS',
        kpi2Label: 'PATIENTS',
        appointmentsTitle: 'Scheduled Consultations',
        caseLogsTitle: 'Recent Case Logs & EHR',
      );
  }
}

class VetDashboardScreen extends StatefulWidget {
  const VetDashboardScreen({super.key});

  @override
  State<VetDashboardScreen> createState() => _VetDashboardScreenState();
}

class _VetDashboardScreenState extends State<VetDashboardScreen> {
  int _currentNavIndex = 0;

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _currentNavIndex,
            children: [
              const VetConsoleHomeFragment(), // 0: Clinic / Studio Console
              const ClientListScreen(), // 1: Patients Directory
              const CommunityFeedScreen(), // 2: Clinical Community
              const UserProfileScreen(), // 3: Doctor Profile & Rewards
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: FloatingNavbar(
              isProvider: true,
              selectedIndex: _currentNavIndex,
              onItemTapped: (index) {
                HapticFeedback.lightImpact();
                setState(() => _currentNavIndex = index);
              },
              onFabTapped: () {
                HapticFeedback.mediumImpact();
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const AddServiceRecordModal(),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class VetConsoleHomeFragment extends StatelessWidget {
  const VetConsoleHomeFragment({super.key});

  String _formatGreeting(String? rawName, String prefix) {
    if (rawName == null || rawName.trim().isEmpty) return 'Hi, Welcome!';
    final name = rawName.trim();
    final lower = name.toLowerCase();
    final prefLower = prefix.toLowerCase();
    if (lower.startsWith('dr.') ||
        lower.startsWith('groomer') ||
        lower.startsWith('manager') ||
        lower.startsWith('coordinator') ||
        lower.contains(prefLower)) {
      return 'Hi, $name';
    }
    return 'Hi, $prefix $name';
  }

  void _showAppointmentDetailsModal(
    BuildContext context,
    EventModel evt,
    AppStateRepository state,
    bool isDark,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: EdgeInsets.fromLTRB(
            24,
            20,
            24,
            MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E2623) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Booking Details',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Patient info
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.pets_rounded,
                      color: AppColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          evt.petName.isNotEmpty ? evt.petName : 'Patient',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          '${evt.category} • ${evt.fromTime} - ${evt.toTime}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              if (evt.note.isNotEmpty) ...[
                const Text(
                  'Client Notes:',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Text(
                  evt.note,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Status update buttons
              const Text(
                'Update Booking Status',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () async {
                        await state.updateEvent(evt.copyWith(status: 'CONFIRMED'));
                        state.showToast('Appointment CONFIRMED', type: ToastType.success);
                        if (ctx.mounted) Navigator.pop(ctx);
                      },
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Confirm',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () async {
                        await state.updateEvent(
                          evt.copyWith(status: 'COMPLETED', isCompleted: true),
                        );
                        state.showToast('Appointment COMPLETED', type: ToastType.success);
                        if (ctx.mounted) Navigator.pop(ctx);
                      },
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Complete',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.dangerRed,
                        side: const BorderSide(color: AppColors.dangerRed),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      onPressed: () async {
                        await state.updateEvent(evt.copyWith(status: 'CANCELLED'));
                        state.showToast('Appointment CANCELLED', type: ToastType.info);
                        if (ctx.mounted) Navigator.pop(ctx);
                      },
                      child: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'Cancel',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Action button to Add Service EHR log
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1AB680),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () {
                    final pet = state.pets.where((p) => p.petID == evt.petId).firstOrNull;
                    Navigator.pop(ctx);
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (_) => AddServiceRecordModal(initialPet: pet),
                    );
                  },
                  icon: const Icon(Icons.note_add_rounded),
                  label: const Text(
                    'Add EHR Case Note',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String label = status.toUpperCase();

    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        bg = const Color(0xFF10B981).withValues(alpha: 0.18);
        fg = const Color(0xFF10B981);
        break;
      case 'COMPLETED':
        bg = AppColors.primary.withValues(alpha: 0.18);
        fg = AppColors.primary;
        break;
      case 'CANCELLED':
        bg = AppColors.dangerRed.withValues(alpha: 0.18);
        fg = AppColors.dangerRed;
        break;
      case 'PENDING':
      default:
        bg = Colors.amber.withValues(alpha: 0.18);
        fg = Colors.amber.shade800;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w900,
          color: fg,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.select(
      (AppStateRepository state) => state.currentUser,
    );
    final roleConfig = _getRoleConfig(user?.role);

    final rawEvents = context.select(
      (AppStateRepository state) => state.events,
    );
    final events = rawEvents.where((e) => e.category != 'Birthday').toList();
    final records = context.select(
      (AppStateRepository state) => state.serviceRecords,
    );
    final state = context.read<AppStateRepository>();

    // Count unique consulted patients for this doctor/provider
    final consultedPetIds = <String>{};
    if (user != null) {
      final uid = user.uid;
      final uName = user.name.trim().toLowerCase();
      for (final r in records) {
        if (r.providerId == uid ||
            (uName.isNotEmpty && r.providerName.toLowerCase() == uName)) {
          consultedPetIds.add(r.petId);
        }
      }
      for (final e in events) {
        if (e.providerId == uid) consultedPetIds.add(e.petId);
      }
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return CustomScrollView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      slivers: [
        SliverAppBar(
          title: Text(
            roleConfig.consoleTitle,
            style: const TextStyle(fontWeight: FontWeight.w800),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          floating: true,
          actions: [
            IconButton(
              icon: const Icon(
                Icons.logout_rounded,
                color: AppColors.dangerRed,
              ),
              onPressed: () {
                HapticFeedback.mediumImpact();
                state.logout();
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (r) => false,
                );
              },
            ),
            const SizedBox(width: 8),
          ],
        ),
        CupertinoSliverRefreshControl(
          onRefresh: () async {
            HapticFeedback.mediumImpact();
            if (user != null) await state.syncFromFirebase(user);
          },
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Welcome Banner
                FadeInDown(
                  child: Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(
                            alpha: isDark ? 0.35 : 0.18,
                          ),
                          AppColors.secondary.withValues(
                            alpha: isDark ? 0.20 : 0.10,
                          ),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        width: 1.5,
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(
                                    alpha: 0.2,
                                  ),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  roleConfig.badgeText,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primary,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                _formatGreeting(user?.name, roleConfig.greetingPrefix),
                                style: AppTypography.headlineMedium.copyWith(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 22,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Your live practice queue & patient records are active.',
                                style: AppTypography.bodyMedium.copyWith(
                                  color: isDark
                                      ? Colors.white70
                                      : Colors.black87,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary.withValues(alpha: 0.2),
                          ),
                          child: Icon(
                            roleConfig.badgeIcon,
                            color: AppColors.primary,
                            size: 26,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Clinic KPI Cards
                Row(
                  children: [
                    Expanded(
                      child: FadeInLeft(
                        child: _buildKpiCard(
                          context,
                          roleConfig.kpi1Label,
                          '${events.length}',
                          Icons.event_note_rounded,
                          AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FadeInUp(
                        child: _buildKpiCard(
                          context,
                          roleConfig.kpi2Label,
                          '${consultedPetIds.length}',
                          Icons.medical_services_rounded,
                          AppColors.healthGreen,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FadeInRight(
                        child: _buildKpiCard(
                          context,
                          'RATING',
                          '4.9 ★',
                          Icons.star_rounded,
                          AppColors.accentAmber,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Quick Actions
                Row(
                  children: [
                    Expanded(
                      child: FadeInLeft(
                        child: PremiumCard(
                          onTap: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => const AddServiceRecordModal(),
                            );
                          },
                          useGlass: false,
                          borderRadius: 24,
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1AB680),
                              borderRadius: BorderRadius.circular(24),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFF1AB680,
                                  ).withValues(alpha: 0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.note_add_rounded,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'NEW EHR LOG',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.0,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FadeInRight(
                        child: PremiumCard(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const ClientListScreen(),
                            ),
                          ),
                          opacity: 0.15,
                          borderRadius: 24,
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.people_alt_rounded,
                                  color: AppColors.primary,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'PATIENTS',
                                  style: TextStyle(
                                    color: isDark
                                        ? Colors.white
                                        : AppColors.primary,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1.0,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 36),

                // Scheduled Consultations
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      roleConfig.appointmentsTitle,
                      style: AppTypography.titleLarge.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${events.length} ACTIVE',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (events.isEmpty)
                  _buildEmptyState(context, 'No appointments booked yet.')
                else
                  ...events.map(
                    (evt) => FadeInUp(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: PremiumCard(
                          onTap: () => _showAppointmentDetailsModal(
                            context,
                            evt,
                            state,
                            isDark,
                          ),
                          opacity: 0.2,
                          borderRadius: 24,
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(
                                      alpha: 0.12,
                                    ),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.calendar_today_rounded,
                                    color: AppColors.primary,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              '${evt.petName} • ${evt.title}',
                                              style: AppTypography.titleMedium
                                                  .copyWith(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 15,
                                                  ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          _buildStatusBadge(evt.status),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${evt.fromTime} - ${evt.toTime}',
                                        style: AppTypography.bodyMedium
                                            .copyWith(
                                              fontWeight: FontWeight.w600,
                                              color: Colors.grey[500],
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  color: AppColors.textTertiary,
                                  size: 14,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),

                const SizedBox(height: 36),

                // Recent Case Logs & EHR
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      roleConfig.caseLogsTitle,
                      style: AppTypography.titleLarge.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      '${records.length} TOTAL',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (records.isEmpty)
                  _buildEmptyState(context, 'No medical logs recorded yet.')
                else
                  ...records.map(
                    (rec) => FadeInUp(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: PremiumCard(
                          opacity: 0.12,
                          borderRadius: 24,
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withValues(
                                          alpha: 0.15,
                                        ),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        rec.petName.toUpperCase(),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          color: AppColors.primary,
                                          letterSpacing: 1.0,
                                          fontSize: 10,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      rec.date,
                                      style: AppTypography.labelSmall.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: Colors.grey[500],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  rec.title,
                                  style: AppTypography.titleMedium.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  rec.diagnosis ?? rec.description,
                                  style: AppTypography.bodyMedium.copyWith(
                                    fontSize: 13,
                                    height: 1.4,
                                    color: isDark
                                        ? Colors.white70
                                        : Colors.black87,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 140),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context, String msg) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
      ),
      child: Center(
        child: Text(
          msg,
          style: AppTypography.bodyMedium.copyWith(color: Colors.grey[500]),
        ),
      ),
    );
  }

  Widget _buildKpiCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return PremiumCard(
      opacity: 0.2,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 18,
                color: isDark ? Colors.white : Colors.black87,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.8,
                color: Colors.grey[500],
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
