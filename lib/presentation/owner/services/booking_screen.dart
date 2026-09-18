import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/event_model.dart';
import '../../../data/models/notification_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:cached_network_image/cached_network_image.dart';

class BookingScreen extends StatefulWidget {
  final VetModel vet;

  const BookingScreen({super.key, required this.vet});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  PetModel? _selectedPet;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String _selectedTimeSlot = '10:00 AM';
  bool _isTeleconsult = false;
  final _reasonController = TextEditingController(text: 'Routine comprehensive health checkup');

  List<String> _generateDynamicTimeSlots(String businessHours) {
    int openHour = 9;
    int openMinute = 0;
    int closeHour = 20;
    int closeMinute = 0;

    try {
      final matches = RegExp(r'(\d{1,2}):(\d{2})\s*(AM|PM)', caseSensitive: false)
          .allMatches(businessHours)
          .toList();

      if (matches.length >= 2) {
        int h1 = int.parse(matches[0].group(1)!);
        int m1 = int.parse(matches[0].group(2)!);
        String p1 = matches[0].group(3)!.toUpperCase();
        if (p1 == 'PM' && h1 < 12) h1 += 12;
        if (p1 == 'AM' && h1 == 12) h1 = 0;
        openHour = h1;
        openMinute = m1;

        int h2 = int.parse(matches[1].group(1)!);
        int m2 = int.parse(matches[1].group(2)!);
        String p2 = matches[1].group(3)!.toUpperCase();
        if (p2 == 'PM' && h2 < 12) h2 += 12;
        if (p2 == 'AM' && h2 == 12) h2 = 0;
        closeHour = h2;
        closeMinute = m2;
      }
    } catch (e) {
      debugPrint('[BookingScreen] Error parsing business hours: $e');
    }

    final List<String> generatedSlots = [];
    int currentMinutes = openHour * 60 + openMinute;
    final endMinutes = closeHour * 60 + closeMinute;

    while (currentMinutes + 30 <= endMinutes) {
      final hour = currentMinutes ~/ 60;
      final minute = currentMinutes % 60;

      final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      final period = hour >= 12 ? 'PM' : 'AM';
      final minStr = minute.toString().padLeft(2, '0');

      generatedSlots.add('${displayHour.toString().padLeft(2, '0')}:$minStr $period');
      currentMinutes += 60; // 1-hour interval slots
    }

    if (generatedSlots.isEmpty) {
      return ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '06:00 PM'];
    }

    return generatedSlots;
  }

  Future<void> _selectCustomTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: const TimeOfDay(hour: 10, minute: 0),
    );
    if (picked != null) {
      final hour = picked.hourOfPeriod == 0 ? 12 : picked.hourOfPeriod;
      final minute = picked.minute.toString().padLeft(2, '0');
      final period = picked.period == DayPeriod.am ? 'AM' : 'PM';
      final formatted = '${hour.toString().padLeft(2, '0')}:$minute $period';
      setState(() {
        _selectedTimeSlot = formatted;
      });
      HapticFeedback.selectionClick();
    }
  }

  @override
  void initState() {
    super.initState();
    final pets = context.read<AppStateRepository>().pets;
    if (pets.isNotEmpty) _selectedPet = pets.first;
  }

  void _confirmBooking() {
    if (_selectedPet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your pet'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    String calculatedToTime = '10:00 AM';
    try {
      final isPM = _selectedTimeSlot.toLowerCase().contains('pm');
      final isAM = _selectedTimeSlot.toLowerCase().contains('am');
      final clean = _selectedTimeSlot.replaceAll(RegExp(r'[^0-9:]'), '');
      final parts = clean.split(':');
      if (parts.isNotEmpty) {
        int hour = int.tryParse(parts[0]) ?? 9;
        int minute = parts.length > 1 ? (int.tryParse(parts[1]) ?? 0) : 0;
        minute += 45;
        if (minute >= 60) {
          minute -= 60;
          hour += 1;
        }
        String period = isPM ? 'PM' : (isAM ? 'AM' : '');
        if (hour >= 12 && isAM && hour != 12) period = 'PM';
        final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
        final minStr = minute.toString().padLeft(2, '0');
        calculatedToTime = period.isNotEmpty ? '${displayHour.toString().padLeft(2, '0')}:$minStr $period' : '${displayHour.toString().padLeft(2, '0')}:$minStr';
      }
    } catch (_) {}

    final repo = context.read<AppStateRepository>();
    final event = EventModel(
      id: 'apt_${const Uuid().v4().substring(0, 6)}',
      userId: repo.currentUser?.uid ?? 'user_1',
      title: '${widget.vet.tag}: ${widget.vet.name}',
      category: 'Vet Appointment', // Standardized category as requested
      note: 'Reason: ${_reasonController.text.trim()}',
      petName: _selectedPet!.name,
      petId: _selectedPet!.petID,
      providerId: widget.vet.id,
      date: _selectedDate,
      fromTime: _selectedTimeSlot,
      toTime: calculatedToTime,
      isReminderEnabled: true,
    );

    repo.addEvent(event);

    repo.addNotification(
      title: 'Appointment Scheduled! 📹',
      message:
          'Your video consultation with Dr. ${widget.vet.name} is scheduled for ${DateFormat('MMM d').format(_selectedDate)} at $_selectedTimeSlot. Live video call unlocks on appointment day!',
      type: NotificationType.social,
    );

    HapticFeedback.heavyImpact();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.healthGreen.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: const Icon(Icons.check_circle_rounded, color: AppColors.healthGreen, size: 54),
            ),
            const SizedBox(height: 24),
            Text('Booking Confirmed!', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Text(
              'Your appointment with ${widget.vet.name} on ${DateFormat('MMM d').format(_selectedDate)} at $_selectedTimeSlot is scheduled.',
              textAlign: TextAlign.center,
              style: AppTypography.bodyMedium.copyWith(color: Colors.grey[500], fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: () {
                  // Safely pop back to the dashboard, avoiding black screen from over-popping
                  Navigator.of(context).popUntil((route) => route.isFirst);
                },
                style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                child: const Text('DONE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('Book ${widget.vet.tag}', style: const TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + kToolbarHeight + 8, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeInDown(
              child: PremiumCard(
                opacity: 0.15,
                borderRadius: 28,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                        child: CircleAvatar(
                          radius: 32,
                          backgroundColor: AppColors.primaryLight,
                          backgroundImage: widget.vet.photoUrl != null
                              ? CachedNetworkImageProvider(widget.vet.photoUrl!)
                              : null,
                          onBackgroundImageError: (exception, stackTrace) {
                            debugPrint('[BookingScreen] Handled avatar load error: $exception');
                          },
                          child: widget.vet.photoUrl == null
                              ? const Icon(Icons.person_rounded, color: AppColors.primary, size: 30)
                              : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.vet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 16)),
                            Text(widget.vet.qualification, style: TextStyle(fontSize: 12, color: Colors.grey[500], fontWeight: FontWeight.w600)),
                            const SizedBox(height: 4),
                            Text(widget.vet.price, style: AppTypography.labelSmall.copyWith(color: AppColors.healthGreen, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
            const SizedBox(height: 20),

            // Consultation Mode Glass Segment
            FadeInDown(
              delay: const Duration(milliseconds: 60),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ui.ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.06),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _isTeleconsult = false);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: !_isTeleconsult
                                    ? AppColors.primary
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: !_isTeleconsult
                                    ? [
                                        BoxShadow(
                                          color: AppColors.primary.withValues(alpha: 0.35),
                                          blurRadius: 10,
                                          offset: const Offset(0, 3),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.local_hospital_rounded,
                                    size: 16,
                                    color: !_isTeleconsult ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Clinic Visit',
                                    style: TextStyle(
                                      color: !_isTeleconsult ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                                      fontWeight: FontWeight.w800,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.selectionClick();
                              setState(() => _isTeleconsult = true);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: _isTeleconsult
                                    ? const Color(0xFF00BFA5)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: _isTeleconsult
                                    ? [
                                        BoxShadow(
                                          color: const Color(0xFF00BFA5).withValues(alpha: 0.35),
                                          blurRadius: 10,
                                          offset: const Offset(0, 3),
                                        ),
                                      ]
                                    : null,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.videocam_rounded,
                                    size: 16,
                                    color: _isTeleconsult ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'HD Telehealth',
                                    style: TextStyle(
                                      color: _isTeleconsult ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
                                      fontWeight: FontWeight.w800,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Select Pet'),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<PetModel>(
                        value: _selectedPet,
                        isExpanded: true,
                        dropdownColor: isDark ? const Color(0xFF0D302D) : Colors.white,
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
                        style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87, fontSize: 14),
                        items: pets.map((p) => DropdownMenuItem(value: p, child: Text('${p.name} (${p.breed})'))).toList(),
                        onChanged: (p) => setState(() => _selectedPet = p),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  _buildSectionLabel('Appointment Date'),
                  const SizedBox(height: 8),
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
                    borderRadius: 16,
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_today_rounded, color: AppColors.primary, size: 20),
                          const SizedBox(width: 16),
                          Text(DateFormat('EEEE, MMM d, yyyy').format(_selectedDate), 
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                          const Spacer(),
                          const Icon(Icons.edit_calendar_rounded, color: AppColors.textTertiary, size: 18),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  _buildSectionLabel('Provider Practice Slots (${widget.vet.businessHours})'),
                  const SizedBox(height: 12),
                  Builder(
                    builder: (context) {
                      final dynamicSlots = _generateDynamicTimeSlots(widget.vet.businessHours);
                      return Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          ...dynamicSlots.map((slot) {
                            final isSelected = _selectedTimeSlot == slot;
                            return _buildTimeChip(slot, isSelected);
                          }),
                          // Custom Time Picker Chip
                          ActionChip(
                            avatar: const Icon(Icons.edit_calendar_rounded, size: 16, color: AppColors.primary),
                            label: Text('Custom Time (${_selectedTimeSlot})'),
                            onPressed: _selectCustomTime,
                            backgroundColor: isDark ? const Color(0xFF143D38) : Colors.grey[200],
                            side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                            labelStyle: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  _buildPremiumInput('Reason for Visit', _reasonController, hint: 'e.g. Regular checkup', maxLines: 3),
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

  Widget _buildSectionLabel(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(label.toUpperCase(), 
        style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 0.8)),
    );
  }

  Widget _buildPremiumInput(String label, TextEditingController controller, {String? hint, int maxLines = 1}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionLabel(label),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(18),
          ),
          child: TextField(
            controller: controller,
            maxLines: maxLines,
            style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
            decoration: InputDecoration(
              hintText: hint,
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white24 : Colors.grey),
              contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
              filled: false,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimeChip(String label, bool isSelected) {
    return PremiumCard(
      onTap: () => setState(() => _selectedTimeSlot = label),
      opacity: isSelected ? 0.4 : 0.05,
      borderRadius: 12,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppColors.primary : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 40, offset: const Offset(0, -10))],
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: ElevatedButton(
            onPressed: () {
              HapticFeedback.heavyImpact();
              _confirmBooking();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1AB680),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('CONFIRM BOOKING', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1.2, fontSize: 13)),
          ),
        ),
      ),
    );
  }
}
