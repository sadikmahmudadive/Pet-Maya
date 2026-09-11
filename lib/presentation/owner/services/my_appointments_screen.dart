import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/event_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/bento_card.dart';
import '../../common_widgets/empty_state.dart';
import '../../common_widgets/status_chip.dart';
import 'pet_services_screen.dart';

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({super.key});

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  String _selectedFilter = 'UPCOMING'; // UPCOMING, COMPLETED, ALL

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final allEvents = state.events;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 8;

    // Filter appointments
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final appointments = allEvents.where((e) {
      final isAppointment = e.category.contains('Vet') ||
          e.category.contains('Appointment') ||
          e.category.contains('Grooming') ||
          e.category.contains('Checkup') ||
          e.category.contains('Vaccination');

      if (!isAppointment) return false;

      final isPast = e.isCompleted || e.date.isBefore(today);

      if (_selectedFilter == 'UPCOMING') return !isPast;
      if (_selectedFilter == 'COMPLETED') return isPast;
      return true;
    }).toList();

    // Sort: Upcoming (Soonest first), Completed (Newest first)
    appointments.sort((a, b) {
      if (_selectedFilter == 'UPCOMING') {
        return a.date.compareTo(b.date);
      }
      return b.date.compareTo(a.date);
    });

    final upcomingCount = allEvents.where((e) {
      final isPast = e.isCompleted || e.date.isBefore(today);
      return !isPast && (e.category.contains('Vet') || e.category.contains('Appointment') || e.category.contains('Grooming') || e.category.contains('Vaccination'));
    }).length;

    final completedCount = allEvents.where((e) {
      final isPast = e.isCompleted || e.date.isBefore(today);
      return isPast && (e.category.contains('Vet') || e.category.contains('Appointment') || e.category.contains('Grooming') || e.category.contains('Vaccination'));
    }).length;

    final isWide = MediaQuery.of(context).size.width > 600;

    final Widget mainSliver;
    if (appointments.isEmpty) {
      mainSliver = SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: EmptyState(
            icon: Icons.event_available_rounded,
            title: _selectedFilter == 'UPCOMING'
                ? 'No Upcoming Appointments'
                : 'No Past Appointments',
            message: _selectedFilter == 'UPCOMING'
                ? 'Book a consultation with verified veterinarians & specialists anytime.'
                : 'Your completed consultations and grooming logs will appear here.',
            actionLabel: 'Book Appointment',
            onAction: () {
              HapticFeedback.lightImpact();
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PetServicesScreen()),
              );
            },
          ),
        ),
      );
    } else if (isWide) {
      mainSliver = SliverGrid(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 1.6,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final event = appointments[index];
            return FadeInUp(
              delay: Duration(milliseconds: 60 * index),
              child: _buildAppointmentCard(context, event, state, isDark),
            );
          },
          childCount: appointments.length,
        ),
      );
    } else {
      mainSliver = SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final event = appointments[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: FadeInUp(
                delay: Duration(milliseconds: 60 * index),
                child: _buildAppointmentCard(context, event, state, isDark),
              ),
            );
          },
          childCount: appointments.length,
        ),
      );
    }

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          'My Appointments',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary),
            tooltip: 'Book New Appointment',
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PetServicesScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, topPadding, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ─── FILTER TABS ──────────────────────────────────────────────
                  Row(
                    children: [
                      _buildFilterTab('UPCOMING', 'Upcoming ($upcomingCount)', isDark),
                      const SizedBox(width: 10),
                      _buildFilterTab('COMPLETED', 'Completed ($completedCount)', isDark),
                      const SizedBox(width: 10),
                      _buildFilterTab('ALL', 'All', isDark),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ─── APPOINTMENTS LIST / GRID ─────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
            sliver: mainSliver,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(String key, String label, bool isDark) {
    final isSelected = _selectedFilter == key;
    return ChoiceChip(
      selected: isSelected,
      label: Text(label),
      onSelected: (val) {
        if (val) {
          HapticFeedback.selectionClick();
          setState(() => _selectedFilter = key);
        }
      },
      selectedColor: AppColors.primary,
      backgroundColor: isDark ? const Color(0xFF0D2826) : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      side: BorderSide(
        color: isSelected
            ? AppColors.primary
            : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.06)),
      ),
      labelStyle: GoogleFonts.plusJakartaSans(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
      ),
    );
  }

  Widget _buildAppointmentCard(
    BuildContext context,
    EventModel event,
    AppStateRepository state,
    bool isDark,
  ) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final isToday = event.date.year == today.year &&
        event.date.month == today.month &&
        event.date.day == today.day;
    final isPast = event.isCompleted || event.date.isBefore(today);

    final pet = state.pets.where((p) => p.petID == event.petId).firstOrNull;

    return BentoCard(
      borderRadius: 28,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Category Badge & Status Chip
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _getCategoryColor(event.category).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _getCategoryColor(event.category).withValues(alpha: 0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(_getCategoryIcon(event.category), size: 14, color: _getCategoryColor(event.category)),
                    const SizedBox(width: 6),
                    Text(
                      event.category.toUpperCase(),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: _getCategoryColor(event.category),
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
              ),
              if (isToday && !event.isCompleted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.3)),
                  ),
                  child: const Text(
                    'TODAY',
                    style: TextStyle(
                      color: Color(0xFF22C55E),
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                )
              else if (event.isCompleted)
                StatusChip.order('Completed')
              else
                StatusChip.order('Upcoming'),
            ],
          ),

          const SizedBox(height: 16),

          // Title & Note
          Text(
            event.note.isNotEmpty ? event.note : 'Consultation Appointment',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : AppColors.textPrimary,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),

          const SizedBox(height: 12),

          // Date & Time Row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0x66051E1C) : Colors.grey.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.04),
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.event_rounded, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    DateFormat('EEEE, MMM d, yyyy').format(event.date),
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white70 : Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.access_time_rounded, size: 16, color: AppColors.secondary),
                const SizedBox(width: 4),
                Text(
                  event.fromTime,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.secondary,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // Pet Tag Row
          Row(
            children: [
              Icon(Icons.pets_rounded, size: 14, color: isDark ? Colors.white54 : Colors.grey[600]),
              const SizedBox(width: 6),
              Text(
                'Pet: ',
                style: TextStyle(fontSize: 12, color: isDark ? Colors.white54 : Colors.grey[600]),
              ),
              Text(
                event.petName,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
              if (pet != null && pet.breed.isNotEmpty) ...[
                Text(
                  ' (${pet.breed})',
                  style: TextStyle(fontSize: 11, color: isDark ? Colors.white38 : Colors.grey[500]),
                ),
              ],
            ],
          ),

          const SizedBox(height: 16),

          // Action Buttons Row
          Row(
            children: [
              if (!isPast) ...[
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      final updated = event.copyWith(
                        isReminderEnabled: !event.isReminderEnabled,
                      );
                      state.updateEvent(updated);
                      HapticFeedback.lightImpact();
                      state.showToast(
                        updated.isReminderEnabled
                            ? 'Notification reminder set! 🔔'
                            : 'Reminder muted 🔕',
                        context: context,
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      side: BorderSide(
                        color: event.isReminderEnabled
                            ? AppColors.primary
                            : (isDark ? Colors.white24 : Colors.grey[400]!),
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: Icon(
                      event.isReminderEnabled ? Icons.notifications_active_rounded : Icons.notifications_off_outlined,
                      size: 16,
                    ),
                    label: Text(
                      event.isReminderEnabled ? 'Remind' : 'Muted',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final updated = event.copyWith(
                        isCompleted: true,
                        status: 'COMPLETED',
                      );
                      state.updateEvent(updated);
                      HapticFeedback.mediumImpact();
                      state.showToast('Appointment marked as Completed! ✅', context: context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.check_circle_outline_rounded, size: 16, color: Colors.white),
                    label: const Text(
                      'Complete',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
                    ),
                  ),
                ),
              ] else ...[
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const PetServicesScreen()),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.refresh_rounded, size: 16),
                    label: const Text('Re-book', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  IconData _getCategoryIcon(String cat) {
    if (cat.contains('Vaccination')) return Icons.vaccines_rounded;
    if (cat.contains('Vet') || cat.contains('Appointment')) return Icons.medical_services_rounded;
    if (cat.contains('Grooming')) return Icons.content_cut_rounded;
    return Icons.event_rounded;
  }

  Color _getCategoryColor(String cat) {
    if (cat.contains('Vaccination')) return AppColors.healthGreen;
    if (cat.contains('Vet') || cat.contains('Appointment')) return AppColors.primary;
    if (cat.contains('Grooming')) return AppColors.tertiary;
    return AppColors.accentAmber;
  }
}
