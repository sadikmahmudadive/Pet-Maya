import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/floating_navbar.dart';
import '../auth/login_screen.dart';
import '../owner/community/community_feed_screen.dart';
import '../owner/home/user_profile_screen.dart';
import 'add_service_record_modal.dart';
import 'client_list_screen.dart';

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
              const VetConsoleHomeFragment(), // 0: Clinic Console
              const ClientListScreen(),       // 1: Patients Directory
              const CommunityFeedScreen(),    // 2: Clinical Community
              const UserProfileScreen(),      // 3: Doctor Profile & Rewards
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

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppStateRepository state) => state.currentUser);
    final events = context.select((AppStateRepository state) => state.events);
    final records = context.select((AppStateRepository state) => state.serviceRecords);
    final state = context.read<AppStateRepository>();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return CustomScrollView(
      physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
      slivers: [
        SliverAppBar(
          title: const Text('Clinic Practice Console', style: TextStyle(fontWeight: FontWeight.w800)),
          backgroundColor: Colors.transparent,
          elevation: 0,
          floating: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.logout_rounded, color: AppColors.dangerRed),
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
                          AppColors.primary.withValues(alpha: isDark ? 0.35 : 0.18),
                          AppColors.secondary.withValues(alpha: isDark ? 0.20 : 0.10),
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
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Text(
                                  '🩺 VETERINARY PRACTICE',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primary,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                'Hi, ${user?.name ?? 'Doctor'}',
                                style: AppTypography.headlineMedium.copyWith(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 24,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Your live practice queue & patient records are active.',
                                style: AppTypography.bodyMedium.copyWith(
                                  color: isDark ? Colors.white70 : Colors.black87,
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
                          child: const Icon(
                            Icons.local_hospital_rounded,
                            color: AppColors.primary,
                            size: 28,
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
                          'APPOINTMENTS',
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
                          'PATIENTS',
                          '${records.length}',
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
                                  color: const Color(0xFF1AB680).withValues(alpha: 0.3),
                                  blurRadius: 16,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.note_add_rounded, color: Colors.white, size: 20),
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
                            MaterialPageRoute(builder: (_) => const ClientListScreen()),
                          ),
                          opacity: 0.15,
                          borderRadius: 24,
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.people_alt_rounded, color: AppColors.primary, size: 20),
                                const SizedBox(width: 8),
                                Text(
                                  'PATIENTS',
                                  style: TextStyle(
                                    color: isDark ? Colors.white : AppColors.primary,
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
                      'Scheduled Consultations',
                      style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w900),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
                          opacity: 0.2,
                          borderRadius: 24,
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.12),
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
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${evt.petName} • ${evt.title}',
                                        style: AppTypography.titleMedium.copyWith(
                                          fontWeight: FontWeight.w800,
                                          fontSize: 15,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${evt.fromTime} - ${evt.toTime}',
                                        style: AppTypography.bodyMedium.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: Colors.grey[500],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
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

                // Recent Medical EHR Records
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Case Logs & EHR',
                      style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w900),
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
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withValues(alpha: 0.15),
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
                                    color: isDark ? Colors.white70 : Colors.black87,
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
