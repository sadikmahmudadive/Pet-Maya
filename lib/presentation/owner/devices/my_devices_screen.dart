import 'dart:async';
import 'dart:math';
import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/pet_device_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../home/pet_tracker_screen.dart';

/// Screen for managing smart tracking collars, Bluetooth beacons,
/// activity bands, and RFID/QR tags paired with the Pet Maya app.
class MyDevicesScreen extends StatefulWidget {
  const MyDevicesScreen({super.key});

  @override
  State<MyDevicesScreen> createState() => _MyDevicesScreenState();
}

class _MyDevicesScreenState extends State<MyDevicesScreen> {
  String? _ringingDeviceId;
  Timer? _ringingTimer;

  @override
  void dispose() {
    _ringingTimer?.cancel();
    super.dispose();
  }

  void _triggerRingDevice(PetDeviceModel device) {
    HapticFeedback.heavyImpact();
    setState(() => _ringingDeviceId = device.id);
    _ringingTimer?.cancel();
    _ringingTimer = Timer(const Duration(seconds: 8), () {
      if (mounted) setState(() => _ringingDeviceId = null);
    });

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark
                    ? const Color(0xFF1E2623)
                    : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 44,
                    height: 5,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.volume_up_rounded,
                      size: 40,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Beeping ${device.name}...',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Emitting 85dB acoustic chime to help you locate your pet nearby.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.dangerRed,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      onPressed: () {
                        HapticFeedback.mediumImpact();
                        _ringingTimer?.cancel();
                        setState(() => _ringingDeviceId = null);
                        Navigator.pop(ctx);
                      },
                      icon: const Icon(Icons.stop_circle_rounded),
                      label: const Text('Stop Siren', style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _openDeviceSettings(BuildContext context, PetDeviceModel device, AppStateRepository repo) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        String trackingMode = device.trackingMode;
        String? selectedPetId = device.petId;
        final nameController = TextEditingController(text: device.name);

        return StatefulBuilder(
          builder: (context, setSheetState) {
            final isDark = Theme.of(context).brightness == Brightness.dark;
            return Container(
              padding: EdgeInsets.fromLTRB(24, 20, 24, MediaQuery.of(context).viewInsets.bottom + 24),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E2623) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
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
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Device Settings',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Device Name field
                    const Text('Device Label', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameController,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: isDark ? Colors.white10 : Colors.grey.shade100,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Assigned Pet
                    const Text('Assigned Pet', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        ...repo.pets.map((p) {
                          final isSelected = selectedPetId == p.petID;
                          return ChoiceChip(
                            label: Text(p.name),
                            avatar: p.photoUrl != null
                                ? CircleAvatar(backgroundImage: NetworkImage(p.photoUrl!), radius: 10)
                                : const Icon(Icons.pets_rounded, size: 14),
                            selected: isSelected,
                            selectedColor: AppColors.primary,
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : null,
                              fontWeight: FontWeight.w700,
                            ),
                            onSelected: (selected) {
                              setSheetState(() => selectedPetId = selected ? p.petID : null);
                            },
                          );
                        }),
                        ChoiceChip(
                          label: const Text('Unassigned'),
                          selected: selectedPetId == null,
                          onSelected: (selected) {
                            setSheetState(() => selectedPetId = null);
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Tracking Mode
                    const Text('Telemetry Interval', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    ...['Real-Time (10s)', 'Balanced (5m)', 'Battery Saver (30m)'].map((mode) {
                      final isSelected = trackingMode == mode;
                      return InkWell(
                        onTap: () => setSheetState(() => trackingMode = mode),
                        borderRadius: BorderRadius.circular(14),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppColors.primary.withValues(alpha: 0.12)
                                : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : Colors.transparent,
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded,
                                color: isSelected ? AppColors.primary : Colors.grey,
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(mode, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                    const SizedBox(height: 2),
                                    Text(
                                      mode.contains('Real-Time')
                                          ? 'Best for outdoor walks and active tracking.'
                                          : mode.contains('Balanced')
                                              ? 'Standard profile with 3-day battery life.'
                                              : 'Extends collar battery life up to 14 days.',
                                      style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 24),

                    // Save Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: () async {
                          final pet = repo.pets.where((p) => p.petID == selectedPetId).firstOrNull;
                          final updated = device.copyWith(
                            name: nameController.text.trim().isEmpty ? device.name : nameController.text.trim(),
                            petId: selectedPetId,
                            petName: pet?.name,
                            trackingMode: trackingMode,
                          );
                          await repo.updateDevice(updated);
                          if (ctx.mounted) Navigator.pop(ctx);
                        },
                        child: const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Unpair Button
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.dangerRed,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: ctx,
                            builder: (dCtx) => AlertDialog(
                              title: const Text('Unpair Tracker?'),
                              content: Text('Are you sure you want to unpair "${device.name}"? Live tracking history will be kept.'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(dCtx, false), child: const Text('Cancel')),
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.dangerRed, foregroundColor: Colors.white),
                                  onPressed: () => Navigator.pop(dCtx, true),
                                  child: const Text('Unpair'),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            await repo.removeDevice(device.id);
                            if (ctx.mounted) Navigator.pop(ctx);
                          }
                        },
                        icon: const Icon(Icons.link_off_rounded, size: 18),
                        label: const Text('Unpair Tracker from Account', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showPairDeviceSheet(BuildContext context, AppStateRepository repo) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        int currentStep = 0; // 0: Select Type, 1: Scanning/Pairing, 2: Assign & Save
        String selectedType = 'gps_collar';
        String deviceName = 'Maya GPS Collar';
        String? targetPetId = repo.pets.isNotEmpty ? repo.pets.first.petID : null;
        String serialCode = 'PM-TRK-${Random().nextInt(8999) + 1000}';
        Timer? scanTimer;
        bool isScanDone = false;

        return StatefulBuilder(
          builder: (context, setSheetState) {
            final isDark = Theme.of(context).brightness == Brightness.dark;

            return Container(
              padding: EdgeInsets.fromLTRB(24, 20, 24, MediaQuery.of(context).viewInsets.bottom + 28),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E2623) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    if (currentStep == 0) ...[
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Pair New Device',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded),
                            onPressed: () => Navigator.pop(ctx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Select the PetMaya hardware category you wish to link.',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 20),

                      _buildTypeOption(
                        context: context,
                        typeKey: 'gps_collar',
                        title: 'PetMaya GPS Smart Collar',
                        subtitle: 'Real-time satellite GPS & 4G cellular positioning.',
                        icon: Icons.satellite_alt_rounded,
                        accentColor: AppColors.primary,
                        isSelected: selectedType == 'gps_collar',
                        onTap: () {
                          setSheetState(() {
                            selectedType = 'gps_collar';
                            deviceName = 'Maya GPS Collar';
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTypeOption(
                        context: context,
                        typeKey: 'ble_beacon',
                        title: 'Bluetooth Beacon Tag',
                        subtitle: 'Ultra-light proximity tag for indoor & yard monitoring.',
                        icon: Icons.bluetooth_audio_rounded,
                        accentColor: const Color(0xFF3B82F6),
                        isSelected: selectedType == 'ble_beacon',
                        onTap: () {
                          setSheetState(() {
                            selectedType = 'ble_beacon';
                            deviceName = 'Maya Smart Tag';
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTypeOption(
                        context: context,
                        typeKey: 'activity_tracker',
                        title: 'Vitality Health Band',
                        subtitle: 'Tracks daily activity, sleep cycles, and caloric burn.',
                        icon: Icons.monitor_heart_rounded,
                        accentColor: const Color(0xFFE91E63),
                        isSelected: selectedType == 'activity_tracker',
                        onTap: () {
                          setSheetState(() {
                            selectedType = 'activity_tracker';
                            deviceName = 'Maya Health Band';
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      _buildTypeOption(
                        context: context,
                        typeKey: 'qr_tag',
                        title: 'Smart NFC / QR Tag',
                        subtitle: 'Digital identity tag scannable by any smartphone.',
                        icon: Icons.qr_code_2_rounded,
                        accentColor: const Color(0xFFF59E0B),
                        isSelected: selectedType == 'qr_tag',
                        onTap: () {
                          setSheetState(() {
                            selectedType = 'qr_tag';
                            deviceName = 'Maya QR Tag';
                          });
                        },
                      ),
                      const SizedBox(height: 24),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          onPressed: () {
                            HapticFeedback.lightImpact();
                            setSheetState(() => currentStep = 1);
                            scanTimer?.cancel();
                            scanTimer = Timer(const Duration(milliseconds: 2200), () {
                              if (context.mounted) {
                                setSheetState(() => isScanDone = true);
                              }
                            });
                          },
                          child: const Text('Continue to Scan', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ] else if (currentStep == 1) ...[
                      // SCANNING RADAR
                      Center(
                        child: Column(
                          children: [
                            const SizedBox(height: 10),
                            Text(
                              isScanDone ? 'Device Discovered!' : 'Searching for Hardware...',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              isScanDone
                                  ? 'Found compatible PetMaya device ready to link.'
                                  : 'Ensure your tracker is turned on and close to your phone.',
                              textAlign: TextAlign.center,
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                            ),
                            const SizedBox(height: 32),

                            // Animated Radar Pulse Container
                            RadarPulseWidget(isScanDone: isScanDone),
                            const SizedBox(height: 32),

                            if (!isScanDone)
                              Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    'Listening on BLE & LTE...',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey.shade600),
                                  ),
                                ],
                              )
                            else
                              FadeInUp(
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: const BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.satellite_alt_rounded, color: Colors.white, size: 20),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'PetMaya ProTrack #$serialCode',
                                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              'Signal: -42 dBm (Excellent) • Battery: 94%',
                                              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Icon(Icons.check_circle, color: AppColors.primary, size: 22),
                                    ],
                                  ),
                                ),
                              ),

                            const SizedBox(height: 28),
                            if (isScanDone)
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  ),
                                  onPressed: () {
                                    HapticFeedback.lightImpact();
                                    setSheetState(() => currentStep = 2);
                                  },
                                  child: const Text('Pair This Tracker', style: TextStyle(fontWeight: FontWeight.w700)),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ] else ...[
                      // STEP 2: CONFIGURE & ASSIGN
                      Text(
                        'Device Setup',
                        style: GoogleFonts.plusJakartaSans(fontSize: 22, fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Assign this hardware to a pet in your family.',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                      ),
                      const SizedBox(height: 20),

                      const Text('Device Label', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 6),
                      TextFormField(
                        initialValue: deviceName,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: isDark ? Colors.white10 : Colors.grey.shade100,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                        ),
                        onChanged: (val) => deviceName = val,
                      ),
                      const SizedBox(height: 20),

                      const Text('Attach to Pet', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      if (repo.pets.isEmpty)
                        Text(
                          'No pets registered yet. You can still pair and link later.',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                        )
                      else
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: repo.pets.map((p) {
                            final isSelected = targetPetId == p.petID;
                            return ChoiceChip(
                              label: Text(p.name),
                              avatar: p.photoUrl != null
                                  ? CircleAvatar(backgroundImage: NetworkImage(p.photoUrl!), radius: 10)
                                  : const Icon(Icons.pets_rounded, size: 14),
                              selected: isSelected,
                              selectedColor: AppColors.primary,
                              labelStyle: TextStyle(
                                color: isSelected ? Colors.white : null,
                                fontWeight: FontWeight.w700,
                              ),
                              onSelected: (selected) {
                                setSheetState(() {
                                  targetPetId = selected ? p.petID : null;
                                  if (selected) {
                                    deviceName = '${p.name}\'s Tracker';
                                  }
                                });
                              },
                            );
                          }).toList(),
                        ),

                      const SizedBox(height: 28),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 15),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          onPressed: () async {
                            HapticFeedback.heavyImpact();
                            final pet = repo.pets.where((p) => p.petID == targetPetId).firstOrNull;
                            final newDevice = PetDeviceModel(
                              id: 'dev_${DateTime.now().millisecondsSinceEpoch}',
                              name: deviceName.trim().isEmpty ? 'Pet Tracker' : deviceName.trim(),
                              deviceType: selectedType,
                              modelNumber: 'PetMaya ProTrack Gen 2',
                              serialNumber: serialCode,
                              petId: targetPetId,
                              petName: pet?.name,
                              batteryLevel: 94,
                              isOnline: true,
                              signalStrength: 4,
                              trackingMode: 'Real-Time (10s)',
                              isSafeZone: true,
                              lastSync: DateTime.now(),
                              firmwareVersion: 'v2.4.1',
                              latitude: pet?.latitude ?? 23.8103,
                              longitude: pet?.longitude ?? 90.4125,
                            );

                            await repo.addDevice(newDevice);
                            if (ctx.mounted) Navigator.pop(ctx);
                          },
                          child: const Text('Complete Pairing & Save', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildTypeOption({
    required BuildContext context,
    required String typeKey,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color accentColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected
              ? accentColor.withValues(alpha: isDark ? 0.25 : 0.12)
              : (isDark ? Colors.white10 : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? accentColor : Colors.transparent,
            width: 1.8,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: accentColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 11.5, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? accentColor : Colors.grey.shade400,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: accentColor,
                          shape: BoxShape.circle,
                        ),
                      ),
                    )
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final repo = context.watch<AppStateRepository>();
    final devices = repo.devices;
    final onlineCount = devices.where((d) => d.isOnline).length;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('My Devices & Trackers', style: TextStyle(fontWeight: FontWeight.w800)),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Pair Device',
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 18),
            ),
            onPressed: () => _showPairDeviceSheet(context, repo),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        slivers: [
          // ─── HERO OVERVIEW BENTO ──────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                20,
                MediaQuery.of(context).padding.top + kToolbarHeight + 12,
                20,
                16,
              ),
              child: Column(
                children: [
                  _buildOverviewBento(context, devices, onlineCount, isDark),
                  const SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Connected Hardware (${devices.length})',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.3,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () => _showPairDeviceSheet(context, repo),
                        icon: const Icon(Icons.add_circle_outline_rounded, size: 16),
                        label: const Text('Add Tracker', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // ─── DEVICE CARDS LIST OR EMPTY STATE ─────────────────────────────
          if (devices.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: _buildEmptyState(context, repo),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final device = devices[index];
                    return FadeInUp(
                      delay: Duration(milliseconds: 60 * index),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: _buildDeviceCard(context, device, repo, isDark),
                      ),
                    );
                  },
                  childCount: devices.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOverviewBento(BuildContext context, List<PetDeviceModel> devices, int onlineCount, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary.withValues(alpha: isDark ? 0.35 : 0.15),
            const Color(0xFF3B82F6).withValues(alpha: isDark ? 0.25 : 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(26),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: isDark ? 0.3 : 0.2),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.sensors_rounded, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Hardware Telemetry',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                    Text(
                      '$onlineCount active tracker${onlineCount == 1 ? '' : 's'} linked & synced',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.healthGreen.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(color: AppColors.healthGreen, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      onlineCount > 0 ? 'ONLINE' : 'STANDBY',
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: AppColors.healthGreen,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // 3 Metric Pills
          Row(
            children: [
              Expanded(
                child: _buildBentoMetric(
                  label: 'Paired Trackers',
                  value: '${devices.length}',
                  icon: Icons.devices_other_rounded,
                  color: AppColors.primary,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildBentoMetric(
                  label: 'Safe Geofence',
                  value: '100% OK',
                  icon: Icons.shield_rounded,
                  color: AppColors.healthGreen,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildBentoMetric(
                  label: 'Avg Battery',
                  value: devices.isEmpty
                      ? 'N/A'
                      : '${(devices.map((d) => d.batteryLevel).reduce((a, b) => a + b) / devices.length).round()}%',
                  icon: Icons.battery_charging_full_rounded,
                  color: const Color(0xFFF59E0B),
                  isDark: isDark,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBentoMetric({
    required String label,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.black26 : Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 10.5, color: Colors.grey.shade500, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildDeviceCard(BuildContext context, PetDeviceModel device, AppStateRepository repo, bool isDark) {
    final isRinging = _ringingDeviceId == device.id;
    final pet = repo.pets.where((p) => p.petID == device.petId).firstOrNull;

    return PremiumCard(
      opacity: isDark ? 0.2 : 0.15,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Icon + Name + Serial + Options
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _getDeviceColor(device.deviceType).withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    _getDeviceIcon(device.deviceType),
                    color: _getDeviceColor(device.deviceType),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        device.name,
                        style: GoogleFonts.plusJakartaSans(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white12 : Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              device.serialNumber,
                              style: const TextStyle(fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.w700),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            device.typeDisplayName,
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.more_vert_rounded, size: 20),
                  onPressed: () => _openDeviceSettings(context, device, repo),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Pet Assignment Strip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Icon(Icons.pets_rounded, size: 16, color: AppColors.primary.withValues(alpha: 0.8)),
                  const SizedBox(width: 8),
                  Text(
                    'Worn by: ',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500),
                  ),
                  if (pet != null) ...[
                    if (pet.photoUrl != null)
                      CircleAvatar(backgroundImage: NetworkImage(pet.photoUrl!), radius: 10)
                    else
                      const SizedBox.shrink(),
                    const SizedBox(width: 6),
                    Text(
                      pet.name,
                      style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: AppColors.primary),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '(${pet.breed})',
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                    ),
                  ] else ...[
                    Text(
                      device.petName ?? 'Unassigned',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Colors.amber.shade700),
                    ),
                  ],
                  const Spacer(),
                  InkWell(
                    onTap: () => _openDeviceSettings(context, device, repo),
                    child: const Text(
                      'Change',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Telemetry Grid (Battery, Signal, Mode, Safe Zone)
            Row(
              children: [
                _buildTelemetryChip(
                  icon: device.batteryLevel > 20 ? Icons.battery_full_rounded : Icons.battery_alert_rounded,
                  color: device.batteryLevel > 50
                      ? AppColors.healthGreen
                      : (device.batteryLevel > 20 ? const Color(0xFFF59E0B) : AppColors.dangerRed),
                  label: '${device.batteryLevel}% Bat',
                ),
                const SizedBox(width: 8),
                _buildTelemetryChip(
                  icon: Icons.signal_cellular_alt_rounded,
                  color: const Color(0xFF3B82F6),
                  label: '${device.signalStrength}/4 Signal',
                ),
                const SizedBox(width: 8),
                _buildTelemetryChip(
                  icon: Icons.sync_rounded,
                  color: Colors.grey,
                  label: device.trackingMode.split(' ').first,
                ),
                const Spacer(),
                Text(
                  '2m ago',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Bottom CTA Buttons
            Row(
              children: [
                // 1. Locate on Map / Radar
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      final targetPet = pet ?? (repo.pets.isNotEmpty ? repo.pets.first : null);
                      if (targetPet != null) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => PetTrackerScreen(pet: targetPet)),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please add a pet first to enable radar map tracking.')),
                        );
                      }
                    },
                    icon: const Icon(Icons.near_me_rounded, size: 16),
                    label: const Text('Live Radar', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),

                // 2. Ring / Siren Collar
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: isRinging ? AppColors.dangerRed : null,
                      side: BorderSide(
                        color: isRinging ? AppColors.dangerRed : Colors.grey.withValues(alpha: 0.3),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () => _triggerRingDevice(device),
                    icon: Icon(
                      isRinging ? Icons.volume_up_rounded : Icons.notifications_active_outlined,
                      size: 16,
                      color: isRinging ? AppColors.dangerRed : null,
                    ),
                    label: Text(
                      isRinging ? 'Ringing...' : 'Chime / Siren',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTelemetryChip({required IconData icon, required Color color, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AppStateRepository repo) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const RadarPulseWidget(isScanDone: false),
            const SizedBox(height: 24),
            Text(
              'No Trackers Paired Yet',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 22,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Pair a PetMaya GPS collar, Bluetooth beacon, or smart activity tag to keep your pet safe and track their location in real time.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13.5,
                color: Colors.grey.shade600,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 15),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
              ),
              onPressed: () => _showPairDeviceSheet(context, repo),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Pair Your First Tracker', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getDeviceIcon(String type) {
    switch (type) {
      case 'ble_beacon':
        return Icons.bluetooth_audio_rounded;
      case 'activity_tracker':
        return Icons.monitor_heart_rounded;
      case 'qr_tag':
        return Icons.qr_code_2_rounded;
      case 'gps_collar':
      default:
        return Icons.satellite_alt_rounded;
    }
  }

  Color _getDeviceColor(String type) {
    switch (type) {
      case 'ble_beacon':
        return const Color(0xFF3B82F6);
      case 'activity_tracker':
        return const Color(0xFFE91E63);
      case 'qr_tag':
        return const Color(0xFFF59E0B);
      case 'gps_collar':
      default:
        return AppColors.primary;
    }
  }
}

/// Continuous animated radar pulse widget with expanding concentric ripple rings.
class RadarPulseWidget extends StatefulWidget {
  final bool isScanDone;
  const RadarPulseWidget({super.key, required this.isScanDone});

  @override
  State<RadarPulseWidget> createState() => _RadarPulseWidgetState();
}

class _RadarPulseWidgetState extends State<RadarPulseWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final progress = _controller.value;

        return SizedBox(
          width: 170,
          height: 170,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer Expanding Wave Ring 2
              _buildPulseRing(
                progress: (progress + 0.5) % 1.0,
                baseColor: AppColors.primary,
              ),
              // Outer Expanding Wave Ring 1
              _buildPulseRing(
                progress: progress,
                baseColor: AppColors.primary,
              ),
              // Inner Ambient Glow Circle
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(
                    alpha: widget.isScanDone ? 0.22 : 0.12,
                  ),
                ),
              ),
              // Core Center Action Circle
              AnimatedContainer(
                duration: const Duration(milliseconds: 350),
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(
                        alpha: widget.isScanDone ? 0.5 : 0.3,
                      ),
                      blurRadius: widget.isScanDone ? 20 : 12,
                      spreadRadius: widget.isScanDone ? 4 : 1,
                    ),
                  ],
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 300),
                  transitionBuilder: (child, anim) => ScaleTransition(scale: anim, child: child),
                  child: Icon(
                    widget.isScanDone
                        ? Icons.check_circle_rounded
                        : Icons.sensors_rounded,
                    key: ValueKey<bool>(widget.isScanDone),
                    color: Colors.white,
                    size: 32,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPulseRing({
    required double progress,
    required Color baseColor,
  }) {
    final size = 64.0 + (progress * 90.0);
    final opacity = (1.0 - progress).clamp(0.0, 1.0) * (widget.isScanDone ? 0.2 : 0.45);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: baseColor.withValues(alpha: opacity * 0.35),
        border: Border.all(
          color: baseColor.withValues(alpha: opacity),
          width: 2.2 * (1.0 - progress),
        ),
      ),
    );
  }
}
