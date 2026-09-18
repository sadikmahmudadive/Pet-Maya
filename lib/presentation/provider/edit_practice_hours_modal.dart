import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/vet_model.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/premium_toast.dart';

/// Modal bottom sheet for Doctors and Service Holders (Vets, Groomers, Boarding Resorts)
/// to set their consultation hours, visiting schedule, and consultation fees.
class EditPracticeHoursModal extends StatefulWidget {
  final VetModel vet;

  const EditPracticeHoursModal({
    super.key,
    required this.vet,
  });

  @override
  State<EditPracticeHoursModal> createState() => _EditPracticeHoursModalState();
}

class _EditPracticeHoursModalState extends State<EditPracticeHoursModal> {
  final List<String> _allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  final Set<String> _selectedDays = {'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'};

  TimeOfDay _openTime = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _closeTime = const TimeOfDay(hour: 20, minute: 0);

  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _qualificationController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  bool _isEmergencyAvailable = true;

  @override
  void initState() {
    super.initState();
    _priceController.text = widget.vet.price;
    _qualificationController.text = widget.vet.qualification;
    _phoneController.text = widget.vet.phone;
  }

  @override
  void dispose() {
    _priceController.dispose();
    _qualificationController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final hour = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return '${hour.toString().padLeft(2, '0')}:$minute $period';
  }

  String _generateScheduleString() {
    if (_selectedDays.isEmpty) return 'Closed';
    String daysStr = '';
    if (_selectedDays.contains('Mon') && _selectedDays.contains('Sat') && _selectedDays.length == 6 && !_selectedDays.contains('Sun')) {
      daysStr = 'Mon - Sat';
    } else if (_selectedDays.length == 7) {
      daysStr = 'Everyday (7 Days)';
    } else if (_selectedDays.contains('Mon') && _selectedDays.contains('Fri') && _selectedDays.length == 5) {
      daysStr = 'Mon - Fri';
    } else {
      daysStr = _selectedDays.join(', ');
    }
    return '$daysStr: ${_formatTimeOfDay(_openTime)} - ${_formatTimeOfDay(_closeTime)}';
  }

  Future<void> _selectTime(bool isOpen) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isOpen ? _openTime : _closeTime,
    );
    if (picked != null) {
      setState(() {
        if (isOpen) {
          _openTime = picked;
        } else {
          _closeTime = picked;
        }
      });
    }
  }

  void _savePracticeSchedule() async {
    final repo = context.read<AppStateRepository>();
    final scheduleStr = _generateScheduleString();
    final priceStr = _priceController.text.trim().isNotEmpty
        ? _priceController.text.trim()
        : '৳800/visit';

    final updatedVet = widget.vet.copyWith(
      businessHours: scheduleStr,
      price: priceStr,
      qualification: _qualificationController.text.trim().isNotEmpty
          ? _qualificationController.text.trim()
          : widget.vet.qualification,
      phone: _phoneController.text.trim().isNotEmpty
          ? _phoneController.text.trim()
          : widget.vet.phone,
    );

    HapticFeedback.heavyImpact();
    await repo.saveVetProfile(updatedVet);

    if (mounted) {
      Navigator.pop(context);
      repo.showToast(
        'Practice hours & consultation fees updated successfully! 🩺',
        type: ToastType.success,
        context: context,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.fromLTRB(
        24,
        20,
        24,
        MediaQuery.of(context).viewInsets.bottom + 28,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0D2826) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
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
            const SizedBox(height: 18),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Set Practice Hours & Fees',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Operating Days Selection
            const Text(
              'Operating Days',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _allDays.map((day) {
                final isSelected = _selectedDays.contains(day);
                return FilterChip(
                  label: Text(day),
                  selected: isSelected,
                  selectedColor: AppColors.primary,
                  backgroundColor: isDark ? const Color(0xFF143D38) : Colors.grey[100],
                  checkmarkColor: Colors.white,
                  side: BorderSide(
                    color: isSelected
                        ? AppColors.primary
                        : (isDark ? AppColors.primary.withValues(alpha: 0.25) : Colors.grey.shade300),
                  ),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    fontSize: 12,
                  ),
                  onSelected: (val) {
                    setState(() {
                      if (val) {
                        _selectedDays.add(day);
                      } else {
                        _selectedDays.remove(day);
                      }
                    });
                  },
                );
              }).toList(),
            ),

            const SizedBox(height: 20),

            // Opening & Closing Hours Picker
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => _selectTime(true),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF143D38) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? AppColors.primary.withValues(alpha: 0.25) : Colors.grey.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Opening Time', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.access_time_rounded, size: 16, color: AppColors.primary),
                              const SizedBox(width: 6),
                              Text(_formatTimeOfDay(_openTime), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: InkWell(
                    onTap: () => _selectTime(false),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF143D38) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? AppColors.primary.withValues(alpha: 0.25) : Colors.grey.shade300),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Closing Time', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.access_time_filled_rounded, size: 16, color: AppColors.primary),
                              const SizedBox(width: 6),
                              Text(_formatTimeOfDay(_closeTime), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Schedule String Preview Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _generateScheduleString(),
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Consultation Fee Input
            const Text(
              'Consultation / Visiting Fee',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _priceController,
              style: TextStyle(color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                hintText: 'e.g. ৳800/visit',
                prefixIcon: const Icon(Icons.payments_outlined, color: AppColors.primary),
                filled: true,
                fillColor: isDark ? const Color(0xFF143D38) : Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: isDark ? AppColors.primary.withValues(alpha: 0.25) : Colors.grey.shade300,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(
                    color: isDark ? AppColors.primary.withValues(alpha: 0.25) : Colors.grey.shade300,
                  ),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Quick Fee Chips
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['৳350/visit', '৳500/visit', '৳800/visit', '৳1000/visit', '৳1200/visit'].map((fee) {
                return ActionChip(
                  label: Text(fee),
                  onPressed: () {
                    setState(() => _priceController.text = fee);
                  },
                  backgroundColor: isDark ? const Color(0xFF143D38) : Colors.grey[100],
                  side: BorderSide(
                    color: isDark ? AppColors.primary.withValues(alpha: 0.3) : Colors.grey.shade300,
                  ),
                  labelStyle: TextStyle(
                    color: isDark ? Colors.white : Colors.black87,
                    fontWeight: FontWeight.w700,
                    fontSize: 11.5,
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 20),

            // Emergency On-Call Switch
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              activeColor: AppColors.primary,
              title: const Text('24/7 Emergency On-Call', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
              subtitle: const Text('Accept urgent emergency consultations outside normal hours', style: TextStyle(fontSize: 11, color: Colors.grey)),
              value: _isEmergencyAvailable,
              onChanged: (val) => setState(() => _isEmergencyAvailable = val),
            ),

            const SizedBox(height: 24),

            // Save Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _savePracticeSchedule,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text(
                  'SAVE SCHEDULE & FEES',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
