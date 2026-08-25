import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/event_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/empty_state.dart';
import 'add_event_modal.dart';
import 'events_history_screen.dart';

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
    
    final events = state.events.where((e) {
      final isSameDay = e.date.year == _selectedDate.year && 
                        e.date.month == _selectedDate.month && 
                        e.date.day == _selectedDate.day;
      if (!isSameDay) return false;
      if (_activeCategory != 'All' && e.category != _activeCategory) {
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
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 100),
                FadeInDown(child: _buildDynamicCalendar(state.events)),
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
          
          events.isEmpty
              ? SliverFillRemaining(
                  child: const EmptyState(
                    icon: Icons.event_available_rounded,
                    title: 'No activities',
                    message: 'Nothing scheduled for this day',
                  ),
                )
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
    final firstDayOfMonth = DateTime(_viewDate.year, _viewDate.month, 1);
    final daysBefore = firstDayOfMonth.weekday - 1;
    final startDate = firstDayOfMonth.subtract(Duration(days: daysBefore));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: PremiumCard(
        opacity: isDark ? 0.2 : 0.4,
        borderRadius: 36,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(monthStr, 
                        style: AppTypography.titleLarge.copyWith(
                          fontWeight: FontWeight.w900, 
                          fontSize: 24,
                          letterSpacing: -0.5
                        )),
                      const SizedBox(height: 4),
                      Text('Your pet\'s health schedule', 
                        style: TextStyle(
                          fontSize: 12, 
                          fontWeight: FontWeight.w600, 
                          color: isDark ? Colors.white38 : Colors.black38
                        )),
                    ],
                  ),
                  Row(
                    children: [
                      _buildNavBtn(Icons.arrow_back_ios_new_rounded, () {
                        setState(() => _viewDate = DateTime(_viewDate.year, _viewDate.month - 1));
                      }),
                      const SizedBox(width: 14),
                      _buildNavBtn(Icons.arrow_forward_ios_rounded, () {
                        setState(() => _viewDate = DateTime(_viewDate.year, _viewDate.month + 1));
                      }),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => Expanded(
                  child: Center(
                    child: Text(day, 
                      style: AppTypography.labelSmall.copyWith(
                        fontWeight: FontWeight.w900, 
                        color: AppColors.primary.withValues(alpha: 0.6),
                        fontSize: 11
                      ))
                  )
                )).toList(),
              ),
              const SizedBox(height: 2),
              GridView.builder(
                padding: EdgeInsets.zero,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 7, 
                  mainAxisSpacing: 6, 
                  crossAxisSpacing: 6,
                  childAspectRatio: 1.2,
                ),
                itemCount: 42,
                itemBuilder: (context, index) {
                  final date = startDate.add(Duration(days: index));
                  final isCurrentMonth = date.month == _viewDate.month;
                  final isSelected = date.year == _selectedDate.year && date.month == _selectedDate.month && date.day == _selectedDate.day;
                  final isToday = date.year == DateTime.now().year && date.month == DateTime.now().month && date.day == DateTime.now().day;
                  
                  final eventsOnDate = allEvents.where((e) => e.date.year == date.year && e.date.month == date.month && e.date.day == date.day).toList();

                  return GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() {
                        _selectedDate = date;
                        _viewDate = date;
                      });
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected 
                          ? AppColors.primary 
                          : (isToday ? AppColors.primary.withValues(alpha: 0.15) : Colors.transparent),
                        borderRadius: BorderRadius.circular(14),
                        border: isToday && !isSelected 
                          ? Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5)
                          : null,
                        boxShadow: isSelected ? [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4)
                          )
                        ] : null,
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Text(
                            '${date.day}',
                            style: TextStyle(
                              color: isSelected 
                                  ? Colors.white 
                                  : (isCurrentMonth 
                                      ? (isDark ? Colors.white70 : Colors.black87)
                                      : (isDark ? Colors.white10 : Colors.black12)),
                              fontWeight: (isSelected || isToday) ? FontWeight.w900 : FontWeight.w700,
                              fontSize: isSelected ? 15 : 13.5,
                            ),
                          ),
                          if (eventsOnDate.isNotEmpty)
                            Positioned(
                              bottom: 3,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: eventsOnDate.take(3).map((e) => Container(
                                  margin: const EdgeInsets.symmetric(horizontal: 1),
                                  width: 3.5,
                                  height: 3.5,
                                  decoration: BoxDecoration(
                                    color: isSelected ? Colors.white : _getCategoryColor(e.category),
                                    shape: BoxShape.circle
                                  ),
                                )).toList(),
                              ),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: AppColors.primary, size: 18),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _activeCategory == label;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: PremiumCard(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _activeCategory = label);
        },
        opacity: isSelected ? 0.4 : 0.05,
        borderRadius: 24,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          decoration: BoxDecoration(
            border: isSelected ? Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5) : null,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: isSelected 
                ? AppColors.primary 
                : (isDark ? Colors.white54 : Colors.black45),
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
              fontSize: 12,
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
                  color: _getCategoryColor(event.category).withValues(alpha: 0.1),
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
    return const EmptyState(
      icon: Icons.event_available_rounded,
      title: 'No activities',
      message: 'No activities scheduled for this day',
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
