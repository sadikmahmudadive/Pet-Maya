import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/event_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'add_event_modal.dart';
import 'events_history_screen.dart';
import 'package:animate_do/animate_do.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _viewDate = DateTime.now();
  DateTime _selectedDate = DateTime.now();
  String _activeCategory = 'All';
  final List<String> _categories = ['All', 'Vet Visit', 'Vaccination', 'Grooming', 'Medication', 'Feeding', 'Birthday'];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    
    // Filter events based on selected date AND category
    final events = state.events.where((e) {
      final isSameDay = e.date.year == _selectedDate.year && 
                        e.date.month == _selectedDate.month && 
                        e.date.day == _selectedDate.day;
      if (!isSameDay) return false;
      if (_activeCategory != 'All' && e.category != _activeCategory) {
          // Special case for 'Vet Appointment' vs 'Vet Visit' if needed, but categories should match model
          if (!(_activeCategory == 'Vet Visit' && e.category == 'Vet Appointment')) return false;
      }
      return true;
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Care Calendar'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded, color: AppColors.primary),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EventsHistoryScreen())),
          ),
          const SizedBox(width: 8),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showEventModal(context, initialDate: _selectedDate),
        label: const Text('SCHEDULE CARE', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8, fontSize: 12)),
        icon: const Icon(Icons.add_rounded, size: 20),
        backgroundColor: AppColors.primary,
        elevation: 10,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              final user = state.currentUser;
              if (user != null) await state.syncFromFirebase(user);
            },
          ),
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 100),
                // Dynamic Calendar Grid
                FadeInDown(child: _buildDynamicCalendar(state.events)),
                
                // Category Quick Filters
                const SizedBox(height: 24),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: _categories.map((cat) => _buildFilterChip(cat)).toList(),
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
          
          // Events for the selected day
          events.isEmpty
              ? SliverFillRemaining(child: _buildEmptyEvents())
              : SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => FadeInUp(
                        delay: Duration(milliseconds: 50 * index),
                        child: _buildEventCard(events[index], state),
                      ),
                      childCount: events.length,
                    ),
                  ),
                ),
          const SliverToBoxAdapter(child: SizedBox(height: 120)),
        ],
      ),
    );
  }

  Widget _buildDynamicCalendar(List<EventModel> allEvents) {
    final monthStr = DateFormat('MMMM yyyy').format(_viewDate);
    
    // Logic for 42 cells (7x6 grid)
    final firstDayOfMonth = DateTime(_viewDate.year, _viewDate.month, 1);
    final daysBefore = firstDayOfMonth.weekday - 1; // M=1
    final startDate = firstDayOfMonth.subtract(Duration(days: daysBefore));

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: PremiumCard(
        opacity: 0.3,
        borderRadius: 32,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(monthStr, style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
                  Row(
                    children: [
                      _buildNavBtn(Icons.chevron_left_rounded, () {
                        setState(() => _viewDate = DateTime(_viewDate.year, _viewDate.month - 1));
                      }),
                      const SizedBox(width: 12),
                      _buildNavBtn(Icons.chevron_right_rounded, () {
                        setState(() => _viewDate = DateTime(_viewDate.year, _viewDate.month + 1));
                      }),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => Expanded(
                  child: Center(child: Text(day, style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w800, color: AppColors.primary.withOpacity(0.5))))
                )).toList(),
              ),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, mainAxisSpacing: 8, crossAxisSpacing: 8),
                itemCount: 42,
                itemBuilder: (context, index) {
                  final date = startDate.add(Duration(days: index));
                  final isCurrentMonth = date.month == _viewDate.month;
                  final isSelected = date.year == _selectedDate.year && date.month == _selectedDate.month && date.day == _selectedDate.day;
                  final isToday = date.year == DateTime.now().year && date.month == DateTime.now().month && date.day == DateTime.now().day;
                  
                  final hasEvents = allEvents.any((e) => e.date.year == date.year && e.date.month == date.month && e.date.day == date.day);

                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _selectedDate = date;
                        _viewDate = date;
                      });
                    },
                    child: Container(
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : (isToday ? AppColors.primary.withOpacity(0.1) : Colors.transparent),
                        shape: BoxShape.circle,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '${date.day}',
                            style: TextStyle(
                              color: isSelected 
                                  ? Colors.white 
                                  : (isCurrentMonth ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurface.withOpacity(0.2)),
                              fontWeight: (isSelected || isToday) ? FontWeight.w800 : FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                          if (hasEvents && !isSelected)
                            Container(
                              margin: const EdgeInsets.only(top: 2),
                              width: 4,
                              height: 4,
                              decoration: const BoxDecoration(color: AppColors.accentAmber, shape: BoxShape.circle),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.08),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _activeCategory == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: PremiumCard(
        onTap: () => setState(() => _activeCategory = label),
        opacity: isSelected ? 0.4 : 0.1,
        borderRadius: 20,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
              fontSize: 11,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEventCard(EventModel event, AppStateRepository state) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: PremiumCard(
        onTap: () => _showEventModal(context, event: event),
        opacity: event.isCompleted ? 0.1 : 0.25,
        borderRadius: 28,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _getCategoryColor(event.category).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(_getCategoryIcon(event.category), color: _getCategoryColor(event.category), size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      event.title, 
                      style: AppTypography.titleMedium.copyWith(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        decoration: event.isCompleted ? TextDecoration.lineThrough : null,
                        color: event.isCompleted ? Theme.of(context).colorScheme.outline : Theme.of(context).colorScheme.onSurface,
                      )
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${event.petName} • ${event.fromTime}', 
                      style: AppTypography.bodyMedium.copyWith(
                        fontSize: 13, 
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      )
                    ),
                  ],
                ),
              ),
              if (event.category != 'Birthday')
              Transform.scale(
                scale: 1.2,
                child: Checkbox(
                  value: event.isCompleted,
                  activeColor: AppColors.healthGreen,
                  checkColor: Colors.white,
                  shape: const CircleBorder(),
                  side: BorderSide(color: Theme.of(context).dividerColor, width: 2),
                  onChanged: (val) {
                    HapticFeedback.mediumImpact();
                    state.toggleEventCompletion(event.id);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyEvents() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_available_rounded, size: 60, color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.2)),
          const SizedBox(height: 12),
          Text('No activities scheduled for this day', style: AppTypography.titleMedium),
        ],
      ),
    );
  }

  void _showEventModal(BuildContext context, {EventModel? event, DateTime? initialDate}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddEventModal(event: event, initialDate: initialDate),
    );
  }

  Color _getCategoryColor(String cat) {
    if (cat.contains('Vaccination')) return AppColors.healthGreen;
    if (cat.contains('Vet')) return AppColors.primary;
    if (cat.contains('Medication')) return AppColors.dangerRed;
    if (cat.contains('Birthday')) return AppColors.secondary;
    return AppColors.accentAmber;
  }

  IconData _getCategoryIcon(String cat) {
    if (cat.contains('Vaccination')) return Icons.vaccines_rounded;
    if (cat.contains('Vet')) return Icons.medical_services_rounded;
    if (cat.contains('Medication')) return Icons.medication_rounded;
    if (cat.contains('Birthday')) return Icons.cake_rounded;
    return Icons.pets_rounded;
  }
}
