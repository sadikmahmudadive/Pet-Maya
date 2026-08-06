import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/event_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class EventsHistoryScreen extends StatefulWidget {
  const EventsHistoryScreen({super.key});

  @override
  State<EventsHistoryScreen> createState() => _EventsHistoryScreenState();
}

class _EventsHistoryScreenState extends State<EventsHistoryScreen> {
  String? _selectedPetId;
  String _selectedCategory = 'All';
  final List<String> _categories = ['All', 'Vet Visit', 'Vaccination', 'Grooming', 'Medication', 'Feeding', 'Birthday'];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final allEvents = state.events;
    final pets = state.pets;

    // Apply filters
    final filteredEvents = allEvents.where((e) {
      final petMatch = _selectedPetId == null || e.petId == _selectedPetId;
      final categoryMatch = _selectedCategory == 'All' || e.category == _selectedCategory;
      return petMatch && categoryMatch;
    }).toList();
    
    // Sort events by date descending (Newest first)
    final sortedEvents = List<EventModel>.from(filteredEvents)..sort((a, b) => b.date.compareTo(a.date));

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Activity History'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          // Filter Section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('FILTER BY PET', style: AppTypography.labelSmall.copyWith(
                  fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.outline, fontSize: 10
                )),
                const SizedBox(height: 12),
                _buildHorizontalScroll(
                  children: [
                    _buildChip('All Pets', _selectedPetId == null, () => setState(() => _selectedPetId = null)),
                    ...pets.map((pet) => _buildChip(
                      pet.name, 
                      _selectedPetId == pet.petID, 
                      () => setState(() => _selectedPetId = pet.petID)
                    )),
                  ],
                ),
                const SizedBox(height: 20),
                Text('FILTER BY CATEGORY', style: AppTypography.labelSmall.copyWith(
                  fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.outline, fontSize: 10
                )),
                const SizedBox(height: 12),
                _buildHorizontalScroll(
                  children: _categories.map((cat) => _buildChip(
                    cat, 
                    _selectedCategory == cat, 
                    () => setState(() => _selectedCategory = cat)
                  )).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Expanded(
            child: sortedEvents.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.event_busy_rounded, size: 64, color: Theme.of(context).colorScheme.outline.withOpacity(0.3)),
                        const SizedBox(height: 16),
                        Text('No activities found matching filters.', style: AppTypography.bodyMedium),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: () async {
                      HapticFeedback.mediumImpact();
                      final user = state.currentUser;
                      if (user != null) await state.syncFromFirebase(user);
                    },
                    child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                        itemCount: sortedEvents.length,
                        itemBuilder: (context, index) {
                          final event = sortedEvents[index];
                          final dateStr = DateFormat('EEEE, MMM d, yyyy').format(event.date);

                          return FadeInUp(
                            delay: Duration(milliseconds: 30 * index),
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: PremiumCard(
                                opacity: event.isCompleted ? 0.1 : 0.25,
                                borderRadius: 24,
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                                  leading: Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: _getCategoryColor(event.category).withOpacity(0.1),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(_getCategoryIcon(event.category), 
                                      color: _getCategoryColor(event.category), size: 22),
                                  ),
                                  title: Text(event.title, style: AppTypography.titleMedium.copyWith(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 15,
                                    decoration: event.isCompleted ? TextDecoration.lineThrough : null,
                                    color: event.isCompleted ? Theme.of(context).colorScheme.outline : Theme.of(context).colorScheme.onSurface,
                                  )),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const SizedBox(height: 4),
                                      Text('${event.petName} • ${event.fromTime}', 
                                        style: AppTypography.bodyMedium.copyWith(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                      const SizedBox(height: 2),
                                      Text(dateStr, 
                                        style: AppTypography.bodyMedium.copyWith(fontSize: 11, fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.outline)),
                                    ],
                                  ),
                                  trailing: event.category == 'Birthday' 
                                    ? const Icon(Icons.star_rounded, color: AppColors.accentAmber)
                                    : IconButton(
                                        icon: Icon(event.isCompleted ? Icons.check_circle_rounded : Icons.circle_outlined, 
                                          color: event.isCompleted ? AppColors.healthGreen : Theme.of(context).dividerColor),
                                        onPressed: () {
                                          HapticFeedback.mediumImpact();
                                          state.toggleEventCompletion(event.id);
                                        },
                                      ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildHorizontalScroll({required List<Widget> children}) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(children: children),
    );
  }

  Widget _buildChip(String label, bool isSelected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: PremiumCard(
        onTap: onTap,
        opacity: isSelected ? 0.4 : 0.1,
        borderRadius: 16,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w800,
              fontSize: 10,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category) {
      case 'Vaccination': return AppColors.healthGreen;
      case 'Vet Visit': return AppColors.primary;
      case 'Medication': return AppColors.dangerRed;
      case 'Birthday': return AppColors.secondary;
      default: return AppColors.accentAmber;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'Vaccination': return Icons.vaccines_rounded;
      case 'Vet Visit': return Icons.medical_services_rounded;
      case 'Medication': return Icons.medication_rounded;
      case 'Birthday': return Icons.cake_rounded;
      default: return Icons.event_note_rounded;
    }
  }
}
