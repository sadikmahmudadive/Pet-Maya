import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/event_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/location_picker_screen.dart';
import 'package:animate_do/animate_do.dart';

class BookingScreen extends StatefulWidget {
  final VetModel vet;

  const BookingScreen({super.key, required this.vet});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  PetModel? _selectedPet;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String _selectedTimeSlot = '10:30 AM';
  String _selectedLocation = 'Select Clinic Location';
  final _reasonController = TextEditingController(text: 'Routine comprehensive health checkup');

  final List<String> _slots = [
    '09:00 AM',
    '10:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM',
  ];

  @override
  void initState() {
    super.initState();
    final pets = context.read<AppStateRepository>().pets;
    if (pets.isNotEmpty) _selectedPet = pets.first;
  }

  void _confirmBooking() {
    if (_selectedPet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your pet')),
      );
      return;
    }

    final repo = context.read<AppStateRepository>();
    final event = EventModel(
      id: 'apt_${const Uuid().v4().substring(0, 6)}',
      userId: repo.currentUser?.uid ?? 'user_1',
      title: '${widget.vet.tag}: ${widget.vet.name}',
      category: widget.vet.tag == 'Veterinarian' ? 'Vet Visit' : widget.vet.tag,
      note: 'Reason: ${_reasonController.text.trim()}',
      petName: _selectedPet!.name,
      petId: _selectedPet!.petID,
      providerId: widget.vet.id,
      date: _selectedDate,
      fromTime: _selectedTimeSlot,
      toTime: '${_selectedTimeSlot.split(':')[0]}:45 ${_selectedTimeSlot.split(' ')[1]}',
      isReminderEnabled: true,
    );

    repo.addEvent(event);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.healthGreenLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppColors.healthGreen, size: 48),
            ),
            const SizedBox(height: 16),
            Text('Appointment Booked!', style: AppTypography.headlineMedium),
            const SizedBox(height: 8),
            Text(
              'Your appointment with ${widget.vet.name} for ${_selectedPet!.name} on ${_selectedDate.day}/${_selectedDate.month} at $_selectedTimeSlot has been scheduled.',
              textAlign: TextAlign.center,
              style: AppTypography.bodyMedium,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context); // dialog
                  Navigator.pop(context); // booking
                  Navigator.pop(context); // details
                },
                child: const Text('Done'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<AppStateRepository>().pets;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('Book ${widget.vet.tag}'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Provider Brief Header
            FadeInDown(
              child: PremiumCard(
                opacity: 0.2,
                borderRadius: 28,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: CircleAvatar(
                          radius: 32,
                          backgroundColor: AppColors.primaryLight,
                          backgroundImage: widget.vet.photoUrl != null ? NetworkImage(widget.vet.photoUrl!) : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.vet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, fontSize: 16)),
                            Text(widget.vet.qualification, style: AppTypography.bodyMedium.copyWith(fontSize: 12, color: AppColors.textSecondary)),
                            const SizedBox(height: 4),
                            Text(widget.vet.price, style: AppTypography.labelSmall.copyWith(color: AppColors.healthGreen, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),

            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SELECT PET', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 12),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 20,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<PetModel>(
                          value: _selectedPet,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
                          style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          items: pets.map((p) => DropdownMenuItem(value: p, child: Text('${p.name} (${p.breed})'))).toList(),
                          onChanged: (p) => setState(() => _selectedPet = p),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Text('APPOINTMENT DATE', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 12),
                  PremiumCard(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 60)),
                      );
                      if (picked != null) setState(() => _selectedDate = picked);
                    },
                    opacity: 0.1,
                    borderRadius: 20,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 20),
                          const SizedBox(width: 16),
                          Text(DateFormat('EEEE, MMM d, yyyy').format(_selectedDate), 
                            style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
                          const Spacer(),
                          const Icon(Icons.edit_calendar_rounded, color: AppColors.textTertiary, size: 18),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Text('CLINIC LOCATION', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 12),
                  PremiumCard(
                    onTap: () async {
                      final address = await Navigator.push(context, MaterialPageRoute(builder: (_) => const LocationPickerScreen()));
                      if (address != null) setState(() => _selectedLocation = address);
                    },
                    opacity: 0.1,
                    borderRadius: 20,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          const Icon(Icons.map_rounded, color: AppColors.primary, size: 20),
                          const SizedBox(width: 16),
                          Expanded(child: Text(_selectedLocation, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis)),
                          const Icon(Icons.keyboard_arrow_right_rounded, color: AppColors.textTertiary, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Text('AVAILABLE TIME SLOTS', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _slots.map((slot) {
                      final isSelected = _selectedTimeSlot == slot;
                      return _buildTimeChip(slot, isSelected);
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  Text('REASON FOR VISIT', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 12),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 20,
                    child: TextField(
                      controller: _reasonController,
                      maxLines: 3,
                      style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, height: 1.5),
                      decoration: InputDecoration(
                        hintText: 'Describe issue or requirements...',
                        hintStyle: TextStyle(color: AppColors.textTertiary.withOpacity(0.5)),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildTimeChip(String label, bool isSelected) {
    return PremiumCard(
      onTap: () => setState(() => _selectedTimeSlot = label),
      opacity: isSelected ? 0.4 : 0.1,
      borderRadius: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        child: Text(
          label,
          style: AppTypography.labelSmall.copyWith(
            color: isSelected ? AppColors.primary : AppColors.textSecondary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 40, offset: const Offset(0, -10))],
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: ElevatedButton(
            onPressed: () {
              HapticFeedback.heavyImpact();
              _confirmBooking();
            },
            style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
            child: const Text('CONFIRM BOOKING', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
          ),
        ),
      ),
    );
  }
}
