import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../auth/login_screen.dart';
import 'package:animate_do/animate_do.dart';
import 'add_service_record_modal.dart';
import 'client_list_screen.dart';

class VetDashboardScreen extends StatelessWidget {
  const VetDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppStateRepository state) => state.currentUser);
    final events = context.select((AppStateRepository state) => state.events);
    final records = context.select((AppStateRepository state) => state.serviceRecords);
    final state = context.read<AppStateRepository>();

    final size = MediaQuery.of(context).size;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Provider Portal'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.dangerRed),
            onPressed: () {
              state.logout();
              Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (r) => false);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              if (user != null) await state.syncFromFirebase(user);
            },
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, size.height * 0.1, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Welcome Header
                  FadeInDown(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hi, ${user?.name ?? 'Doctor'}', 
                          style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('Your clinic dashboard is ready', 
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Clinic KPI Cards
                  Row(
                    children: [
                      Expanded(child: FadeInLeft(child: _buildKpiCard(context, 'APPOINTMENTS', '${events.length}', Icons.event_note_rounded, AppColors.primary))),
                      const SizedBox(width: 12),
                      Expanded(child: FadeInUp(child: _buildKpiCard(context, 'PATIENTS', '${records.length}', Icons.medical_services_rounded, AppColors.healthGreen))),
                      const SizedBox(width: 12),
                      Expanded(child: FadeInRight(child: _buildKpiCard(context, 'RATING', '4.9 ★', Icons.star_rounded, AppColors.accentAmber))),
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
                            borderRadius: 20,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(20)),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.note_add_rounded, color: Colors.white, size: 20),
                                  const SizedBox(width: 10),
                                  Text('NEW LOG', style: AppTypography.labelSmall.copyWith(color: Colors.white, fontWeight: FontWeight.w700, letterSpacing: 1)),
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
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ClientListScreen())),
                            opacity: 0.15,
                            borderRadius: 20,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.people_alt_rounded, color: AppColors.primary, size: 20),
                                  const SizedBox(width: 10),
                                  Text('PATIENTS', style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, letterSpacing: 1)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 48),

                  // Today's Schedule
                  Text('Scheduled Consultations', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  const SizedBox(height: 20),
                  if (events.isEmpty)
                    _buildEmptyState(context, 'No appointments booked yet.')
                  else
                    ...events.map((evt) => FadeInUp(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: PremiumCard(
                              opacity: 0.2,
                              borderRadius: 24,
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), shape: BoxShape.circle),
                                      child: const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 20),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('${evt.petName} • ${evt.title}', 
                                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, fontSize: 16)),
                                          Text('${evt.fromTime} - ${evt.toTime}', 
                                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, fontSize: 13)),
                                        ],
                                      ),
                                    ),
                                    const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textTertiary, size: 14),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        )),

                  const SizedBox(height: 48),

                  // Recent Consultations
                  Text('Recent Case Logs', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  const SizedBox(height: 20),
                  if (records.isEmpty)
                    _buildEmptyState(context, 'No medical logs recorded.')
                  else
                    ...records.map((rec) => FadeInUp(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: PremiumCard(
                              opacity: 0.1,
                              borderRadius: 24,
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(rec.petName.toUpperCase(), 
                                          style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary, letterSpacing: 1)),
                                        Text(rec.date, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700)),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(rec.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, fontSize: 16)),
                                    const SizedBox(height: 8),
                                    Text(rec.diagnosis ?? rec.description, 
                                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 14, height: 1.5),
                                      maxLines: 2, overflow: TextOverflow.ellipsis),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, String msg) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withOpacity(0.4),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Theme.of(context).colorScheme.outlineVariant.withOpacity(0.5)),
      ),
      child: Center(child: Text(msg, style: Theme.of(context).textTheme.bodyMedium)),
    );
  }

  Widget _buildKpiCard(BuildContext context, String title, String value, IconData icon, Color color) {
    return PremiumCard(
      opacity: 0.2,
      borderRadius: 20,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(height: 12),
            Text(value, 
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 16),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(title, 
              style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 8, fontWeight: FontWeight.w700, letterSpacing: 0.5),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}
