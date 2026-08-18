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
import '../../common_widgets/premium_card.dart';

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
      final found = pets.where((p) => p.petID == widget.event!.petId).toList();
      _selectedPet = found.isNotEmpty ? found.first : (pets.isNotEmpty ? pets.first : null);
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

    repo.addEvent(event);

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.only(
        top: 20,
        left: 24,
        right: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
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
                  color: Colors.grey.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              isEdit ? 'Edit Event' : 'Add Event',
              style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 24),

            // Title Input
            _buildPremiumField(
              label: 'Title',
              controller: _titleController,
              hintText: 'e.g., Vaccination, Vet visit',
              icon: Icons.edit_calendar_rounded,
            ),
            const SizedBox(height: 20),

            // Select Pet
            _buildSectionLabel('Select Pet'),
            PremiumCard(
              opacity: 0.1,
              borderRadius: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<PetModel>(
                    value: _selectedPet,
                    isExpanded: true,
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
                    items: pets.map((p) => DropdownMenuItem(value: p, child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w700)))).toList(),
                    onChanged: (p) => setState(() => _selectedPet = p),
                    hint: const Text('No Pet Selected', style: TextStyle(fontSize: 14)),
                    dropdownColor: isDark ? const Color(0xFF1A1A1A) : Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Select Time
            _buildSectionLabel('Select Time'),
            PremiumCard(
              opacity: 0.1,
              borderRadius: 16,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildTimePicker('From', _fromTime, (t) => setState(() => _fromTime = t)),
                    const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    _buildTimePicker('To', _toTime, (t) => setState(() => _toTime = t)),
                  ],
                ),
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
                      backgroundColor: AppColors.primary.withValues(alpha: 0.05),
                      selectedColor: const Color(0xFFFFC145), 
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
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
            _buildPremiumField(
              label: 'Notes',
              controller: _noteController,
              hintText: 'Notes...',
              maxLines: 3,
            ),
            const SizedBox(height: 24),

            // Reminder Toggle
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Set Notification Reminder', style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700)),
                Switch(
                  value: _isReminderEnabled,
                  onChanged: (val) => setState(() => _isReminderEnabled = val),
                  activeThumbColor: AppColors.primary,
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
                  backgroundColor: const Color(0xFF1AB680), 
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(
                        isEdit ? 'Update Event' : 'Save Event',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label,
        style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, letterSpacing: 0.5),
      ),
    );
  }

  Widget _buildPremiumField({
    required String label,
    required TextEditingController controller,
    required String hintText,
    IconData? icon,
    int maxLines = 1,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionLabel(label),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08),
            ),
          ),
          child: Row(
            children: [
              if (icon != null) ...[Icon(icon, size: 20, color: AppColors.primary), const SizedBox(width: 12)],
              Expanded(
                child: TextField(
                  controller: controller,
                  maxLines: maxLines,
                  style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                  decoration: InputDecoration(
                    filled: false,
                    hintText: hintText,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white38 : Colors.grey),
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
          const SizedBox(height: 6),
          Text(
            time.format(context).split(' ')[0], 
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}
