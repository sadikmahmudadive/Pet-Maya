import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/event_model.dart';
import '../../../data/models/pet_model.dart';

class AddEventModal extends StatefulWidget {
  final EventModel? event;
  final DateTime? initialDate;

  const AddEventModal({super.key, this.event, this.initialDate});

  @override
  State<AddEventModal> createState() => _AddEventModalState();
}

class _AddEventModalState extends State<AddEventModal> {
  late TextEditingController _titleController;
  late TextEditingController _noteController;
  late String _category;
  PetModel? _selectedPet;
  late DateTime _selectedDate;
  late TimeOfDay _fromTime;
  late TimeOfDay _toTime;
  late bool _isReminderEnabled;
  bool _isSaving = false;

  final List<String> _categories = [
    'Vet Appointment',
    'Vaccination',
    'Medication',
    'Grooming',
    'Feeding',
    'Birthday',
  ];

  @override
  void initState() {
    super.initState();
    final isEdit = widget.event != null;
    
    _titleController = TextEditingController(text: widget.event?.title ?? '');
    _noteController = TextEditingController(text: widget.event?.note ?? '');
    _category = widget.event?.category ?? 'Vet Appointment';
    _selectedDate = widget.event?.date ?? widget.initialDate ?? DateTime.now();
    _isReminderEnabled = widget.event?.isReminderEnabled ?? true;

    if (isEdit) {
      _fromTime = _parseTime(widget.event!.fromTime);
      _toTime = _parseTime(widget.event!.toTime);
    } else {
      _fromTime = const TimeOfDay(hour: 12, minute: 0);
      _toTime = const TimeOfDay(hour: 14, minute: 0);
    }

    final pets = context.read<AppStateRepository>().pets;
    if (isEdit) {
      _selectedPet = pets.firstWhere((p) => p.petID == widget.event!.petId, orElse: () => pets.first);
    } else if (pets.isNotEmpty) {
      _selectedPet = pets.first;
    }
  }

  TimeOfDay _parseTime(String timeStr) {
    try {
      final format = DateFormat.jm(); // 12:00 PM
      final dt = format.parse(timeStr);
      return TimeOfDay.fromDateTime(dt);
    } catch (_) {
      return const TimeOfDay(hour: 12, minute: 0);
    }
  }

  void _saveEvent() {
    final title = _titleController.text.trim();
    if (title.isEmpty || _selectedPet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter event title and choose a pet')),
      );
      return;
    }

    setState(() => _isSaving = true);

    final repo = context.read<AppStateRepository>();
    final isEdit = widget.event != null;

    final event = EventModel(
      id: widget.event?.id ?? 'evt_${const Uuid().v4().substring(0, 6)}',
      userId: repo.currentUser?.uid ?? 'user_1',
      title: title,
      category: _category,
      note: _noteController.text.trim(),
      petName: _selectedPet!.name,
      petId: _selectedPet!.petID,
      date: _selectedDate,
      fromTime: _fromTime.format(context),
      toTime: _toTime.format(context),
      isReminderEnabled: _isReminderEnabled,
      isCompleted: widget.event?.isCompleted ?? false,
    );

    if (isEdit) {
      repo.addEvent(event); // addEvent in this repo uses .set which handles update too
    } else {
      repo.addEvent(event);
    }

    HapticFeedback.mediumImpact();
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isEdit ? 'Event updated! ✨' : 'Event scheduled! 🔔'),
        backgroundColor: AppColors.healthGreen,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<AppStateRepository>().pets;
    final isEdit = widget.event != null;

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              isEdit ? 'Edit Event' : 'Add Event',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 24),

            // Title Input
            _buildSectionLabel('Title'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _titleController,
                decoration: const InputDecoration(
                  hintText: 'Title (e.g., Vaccination, Vet visit)',
                  border: InputBorder.none,
                  hintStyle: TextStyle(fontSize: 14, color: Colors.grey),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Select Pet
            _buildSectionLabel('Select Pet'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<PetModel>(
                  value: _selectedPet,
                  isExpanded: true,
                  items: pets.map((p) => DropdownMenuItem(value: p, child: Text(p.name))).toList(),
                  onChanged: (p) => setState(() => _selectedPet = p),
                  hint: const Text('No Pet Selected', style: TextStyle(fontSize: 14)),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Select Time
            _buildSectionLabel('Select Time'),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildTimePicker('From', _fromTime, (t) => setState(() => _fromTime = t)),
                  const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                  _buildTimePicker('To', _toTime, (t) => setState(() => _toTime = t)),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Category
            _buildSectionLabel('Category'),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: _categories.map((cat) {
                  final isSelected = _category == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      onSelected: (val) => setState(() => _category = cat),
                      backgroundColor: AppColors.primary.withOpacity(0.05),
                      selectedColor: const Color(0xFFFFC145), // Amber from image
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? Colors.white : Colors.black87,
                      ),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 20),

            // Notes
            _buildSectionLabel('Notes'),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _noteController,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Notes...',
                  border: InputBorder.none,
                  hintStyle: TextStyle(fontSize: 14, color: Colors.grey),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Reminder Toggle
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Set Notification Reminder', style: TextStyle(fontWeight: FontWeight.w600)),
                Switch(
                  value: _isReminderEnabled,
                  onChanged: (val) => setState(() => _isReminderEnabled = val),
                  activeColor: AppColors.primary,
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Save Button
            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _saveEvent,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF006684), // Dark teal from image
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        isEdit ? 'Update Event' : 'Save Event',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label,
        style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87),
      ),
    );
  }

  Widget _buildTimePicker(String label, TimeOfDay time, Function(TimeOfDay) onPicked) {
    return InkWell(
      onTap: () async {
        final picked = await showTimePicker(context: context, initialTime: time);
        if (picked != null) onPicked(picked);
      },
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(
            time.format(context).split(' ')[0], // 12:00 format
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}
