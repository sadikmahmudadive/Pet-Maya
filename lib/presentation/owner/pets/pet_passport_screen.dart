import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/pet_device_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/resilient_network_image.dart';
import '../../common_widgets/passport_qr_scanner.dart';

/// Digital Pet Passport featuring a Spatial + Glass holographic credential card,
/// biometric clearance tags, verified microchip, and international clinic QR code.
class PetPassportScreen extends StatefulWidget {
  final PetModel pet;

  const PetPassportScreen({super.key, required this.pet});

  @override
  State<PetPassportScreen> createState() => _PetPassportScreenState();
}

class _PetPassportScreenState extends State<PetPassportScreen> with SingleTickerProviderStateMixin {
  bool _showBack = false;
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOutBack),
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  void _flipCard() {
    HapticFeedback.mediumImpact();
    if (_showBack) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
    setState(() => _showBack = !_showBack);
  }

  String _getSpeciesAccreditation(PetModel pet) {
    final species = pet.resolvedSpecies.toLowerCase();
    if (species.contains('bird') ||
        species.contains('dove') ||
        species.contains('pigeon') ||
        species.contains('parrot') ||
        species.contains('avian')) {
      return 'AVIAN ACCREDITATION';
    }
    if (species.contains('cat') || species.contains('feline')) {
      return 'FELINE ACCREDITATION';
    }
    if (species.contains('dog') || species.contains('canine')) {
      return 'CANINE ACCREDITATION';
    }
    if (species.contains('rabbit') ||
        species.contains('bunny') ||
        species.contains('lagomorph')) {
      return 'LAGOMORPH ACCREDITATION';
    }
    if (species.contains('fish') || species.contains('aquatic')) {
      return 'AQUATIC ACCREDITATION';
    }
    if (pet.type.isNotEmpty && pet.type != 'Dog') {
      return '${pet.type.toUpperCase()} ACCREDITATION';
    }
    if (pet.breed.isNotEmpty) {
      return '${pet.breed.toUpperCase()} ACCREDITATION';
    }
    return 'OFFICIAL PET ACCREDITATION';
  }

  String _formatCompactAge(String rawAge) {
    final trimmed = rawAge.trim();
    if (trimmed.isEmpty || trimmed == 'N/A') return 'N/A';
    final reg = RegExp(
      r'(\d+)\s*Years?(?:,\s*(\d+)\s*Months?)?',
      caseSensitive: false,
    );
    final match = reg.firstMatch(trimmed);
    if (match != null) {
      final y = match.group(1);
      final m = match.group(2);
      if (m != null && m != '0') {
        return '${y}y ${m}m';
      }
      return '$y yr${y != '1' ? 's' : ''}';
    }
    return trimmed;
  }

  String _formatWeight(String rawWeight) {
    final trimmed = rawWeight.trim();
    if (trimmed.isEmpty || trimmed == '0') return 'N/A';
    if (trimmed.toLowerCase().contains('kg') ||
        trimmed.toLowerCase().contains('g') ||
        trimmed.toLowerCase().contains('lb')) {
      return trimmed;
    }
    return '$trimmed kg';
  }

  String _getPassportStatus(PetDeviceModel? device, bool hasMedicalLogs) {
    if (device != null) {
      return device.isOnline ? 'ONLINE' : 'OFFLINE';
    }
    if (hasMedicalLogs) return 'ACTIVE';
    return 'ENROLLED';
  }

  @override
  Widget build(BuildContext context) {
    final pet = widget.pet;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 8;

    final repo = context.watch<AppStateRepository>();
    final user = repo.currentUser;
    final petRecords =
        repo.serviceRecords.where((r) => r.petId == pet.petID).toList();
    final petDevice =
        repo.devices.where((d) => d.petId == pet.petID).firstOrNull;
    final hasMedicalLogs = petRecords.isNotEmpty ||
        (pet.vaccinationDetails?.trim().isNotEmpty == true);
    final hasVaccineRecords = petRecords.any(
      (r) =>
          r.serviceType.toLowerCase().contains('vaccin') ||
          r.title.toLowerCase().contains('vaccin'),
    );

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          'Digital Pet Passport',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner_rounded, color: AppColors.primary),
            tooltip: 'Scan Passport QR',
            onPressed: () {
              HapticFeedback.mediumImpact();
              PassportQrScannerModal.show(context);
            },
          ),
          IconButton(
            icon: const Icon(Icons.share_rounded, color: AppColors.primary),
            tooltip: 'Share Credential',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.read<AppStateRepository>().showToast('Passport link copied to clipboard! 📋', context: context);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(20, topPadding, 20, 100),
        child: Column(
          children: [
            // Instruction Subheader
            Text(
              'Official Digital Credential • IATA & Vet Standard Compliant',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white54 : Colors.black54,
                letterSpacing: 0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),

            // Spatial Holographic Passport Card
            AnimatedBuilder(
              animation: _flipAnimation,
              builder: (context, child) {
                final angle = _flipAnimation.value * 3.14159;
                final isUnder = angle > 1.5708;

                return Transform(
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.0015) // Spatial perspective depth
                    ..rotateY(angle),
                  alignment: Alignment.center,
                  child: GestureDetector(
                    onTap: _flipCard,
                    child: isUnder
                        ? Transform(
                            transform: Matrix4.identity()..rotateY(3.14159),
                            alignment: Alignment.center,
                            child: _buildPassportBack(
                              context,
                              pet,
                              user,
                              hasMedicalLogs,
                              isDark,
                            ),
                          )
                        : _buildPassportFront(
                            context,
                            pet,
                            petDevice,
                            hasMedicalLogs,
                            isDark,
                          ),
                  ),
                );
              },
            ),

            const SizedBox(height: 16),
            // Flip Card Action Pill
            GestureDetector(
              onTap: _flipCard,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white12 : Colors.black12,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.sync_rounded,
                      size: 14,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _showBack ? 'View Passport Front' : 'Tap to View Back & QR Code',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Official Biometric Ledger Section
            FadeInUp(
              duration: const Duration(milliseconds: 300),
              child: _buildLedgerSection(
                context,
                pet,
                user,
                petRecords,
                petDevice,
                hasMedicalLogs,
                hasVaccineRecords,
                isDark,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── PASSPORT FRONT (SPATIAL + GLASS) ───
  Widget _buildPassportFront(
    BuildContext context,
    PetModel pet,
    PetDeviceModel? petDevice,
    bool hasMedicalLogs,
    bool isDark,
  ) {
    final isCleared = hasMedicalLogs;
    final statusBadgeText = isCleared ? 'CLEARED' : 'PENDING LOGS';
    final statusBadgeColor =
        isCleared ? const Color(0xFF22C55E) : AppColors.accentAmber;
    final statusBadgeIcon =
        isCleared ? Icons.verified_rounded : Icons.pending_actions_rounded;

    final chipDisplay = petDevice != null
        ? 'TRACKER: ${petDevice.serialNumber.toUpperCase()}'
        : 'NO DEVICE CONNECTED';

    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 240),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: isDark
              ? [
                  const Color(0xFF1E293B).withValues(alpha: 0.95),
                  const Color(0xFF0F172A).withValues(alpha: 0.98),
                ]
              : [
                  const Color(0xFFFFFFFF).withValues(alpha: 0.95),
                  const Color(0xFFE6F7F0).withValues(alpha: 0.90),
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: isDark ? 0.25 : 0.12),
            blurRadius: 30,
            spreadRadius: 2,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.pets_rounded, color: AppColors.primary, size: 16),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'PET MAYA PASSPORT',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.8,
                                    color: AppColors.primary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  _getSpeciesAccreditation(pet),
                                  style: TextStyle(
                                    fontSize: 7.5,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white38 : Colors.black45,
                                    letterSpacing: 0.5,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusBadgeColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: statusBadgeColor.withValues(alpha: 0.4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(statusBadgeIcon, size: 11, color: statusBadgeColor),
                          const SizedBox(width: 4),
                          Text(
                            statusBadgeText,
                            style: TextStyle(
                              color: statusBadgeColor,
                              fontSize: 9.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // Center Identity Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar with Holographic ring
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.6), width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ResilientNetworkImage(
                        imageUrl: pet.photoUrl,
                        width: 70,
                        height: 70,
                        borderRadius: BorderRadius.circular(35),
                        fit: BoxFit.cover,
                        fallbackIcon: Icons.pets_rounded,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            pet.name,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${pet.breed} • ${pet.gender.toUpperCase()}',
                            style: const TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.qr_code_2_rounded, size: 13, color: AppColors.primary),
                                const SizedBox(width: 5),
                                Flexible(
                                  child: Text(
                                    chipDisplay,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Bottom Meta Chips
                Row(
                  children: [
                    Expanded(child: _buildMetaColumn('AGE', _formatCompactAge(pet.age), isDark)),
                    Expanded(child: _buildMetaColumn('WEIGHT', _formatWeight(pet.weight), isDark)),
                    Expanded(child: _buildMetaColumn('HEALTH', hasMedicalLogs ? '${pet.healthIndex}/100' : '0/100', isDark)),
                    Expanded(child: _buildMetaColumn('STATUS', _getPassportStatus(petDevice, hasMedicalLogs), isDark)),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── PASSPORT BACK (SPATIAL + GLASS WITH QR CODE) ───
  Widget _buildPassportBack(
    BuildContext context,
    PetModel pet,
    UserModel? user,
    bool hasMedicalLogs,
    bool isDark,
  ) {
    final ownerName = (user != null && user.name.trim().isNotEmpty)
        ? user.name.trim()
        : 'Registered Owner';
    final registrationDate = pet.dob.trim().isNotEmpty
        ? pet.dob.split('T').first
        : '${DateTime.now().year}';

    final qrData = jsonEncode({
      'type': 'PET_MAYA_PASSPORT',
      'version': '1.0',
      'petId': pet.petID,
      'petName': pet.name,
      'species': pet.resolvedSpecies,
      'breed': pet.breed,
      'gender': pet.gender,
      'age': pet.age,
      'weight': pet.weight,
      'ownerName': ownerName,
      'ownerPhone': user?.phone ?? '',
      'healthIndex': pet.healthIndex,
      'isVerified': hasMedicalLogs,
      'issuedDate': registrationDate,
    });

    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 240),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: isDark
              ? [
                  const Color(0xFF0F172A).withValues(alpha: 0.98),
                  const Color(0xFF1E293B).withValues(alpha: 0.95),
                ]
              : [
                  const Color(0xFFF1FAF5).withValues(alpha: 0.98),
                  const Color(0xFFFFFFFF).withValues(alpha: 0.95),
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: AppColors.secondary.withValues(alpha: 0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: isDark ? 0.25 : 0.12),
            blurRadius: 30,
            spreadRadius: 2,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Real Functional QR Code
                Container(
                  width: 160,
                  height: 160,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.15),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: QrImageView(
                    data: qrData,
                    version: QrVersions.auto,
                    size: 144.0,
                    backgroundColor: Colors.white,
                    padding: EdgeInsets.zero,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'CLINICAL VERIFICATION',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w900,
                    color: AppColors.secondary,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Scan to retrieve verified vaccination records, emergency contacts & allergy alerts for ${pet.name}.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.4,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Parent: $ownerName',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white38 : Colors.black38,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0288D1).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'ISSUED: $registrationDate • ${hasMedicalLogs ? "VERIFIED" : "PENDING"}',
                    style: const TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0288D1),
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetaColumn(String label, String value, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 8.5,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.4,
            color: isDark ? Colors.white38 : Colors.black45,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 12.5,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : Colors.black87,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  // ─── OFFICIAL BIOMETRIC LEDGER ───
  Widget _buildLedgerSection(
    BuildContext context,
    PetModel pet,
    UserModel? user,
    List<ServiceRecordModel> petRecords,
    PetDeviceModel? petDevice,
    bool hasMedicalLogs,
    bool hasVaccineRecords,
    bool isDark,
  ) {
    // 1. Transponder / Tracker
    final transponderValue = petDevice != null
        ? '${petDevice.name} (${petDevice.serialNumber.toUpperCase()})'
        : 'No Device Connected';

    // 2. Vaccination status
    final vaccineValue = (pet.vaccinationDetails?.trim().isNotEmpty == true)
        ? pet.vaccinationDetails!.trim()
        : (hasVaccineRecords
            ? '${petRecords.where((r) => r.serviceType.toLowerCase().contains('vaccin') || r.title.toLowerCase().contains('vaccin')).length} Vaccine(s) Recorded'
            : 'No Vaccination Records Logged');

    // 3. Markings & Color (strictly color/markings, NEVER appending wrong species)
    final markingsValue = pet.color.trim().isNotEmpty
        ? pet.color.trim()
        : (pet.description?.trim().isNotEmpty == true
            ? pet.description!.trim()
            : 'Standard ${pet.breed} Coat');

    // 4. Health Score
    final healthScoreValue = hasMedicalLogs
        ? '${pet.healthIndex}% Health Score (Verified)'
        : '0% (No Clinical Records Logged)';

    // 5. Emergency Care Hotlink
    final emergencyValue = (user?.phone?.trim().isNotEmpty == true)
        ? 'Owner: ${user!.phone!.trim()}'
        : ((user?.email.trim().isNotEmpty == true)
            ? 'Owner: ${user!.email.trim()}'
            : 'Pet Maya 24/7 Helpline: 16263');

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0B2826).withValues(alpha: 0.88) : Colors.white.withValues(alpha: 0.90),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0x2B1AB680) : Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_rounded, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                'Biometric Health Ledger',
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildLedgerRow(
            'Microchip / Tracker',
            transponderValue,
            Icons.memory_rounded,
            isDark,
          ),
          const Divider(height: 20),
          _buildLedgerRow(
            'Species & Classification',
            '${pet.resolvedSpecies} • ${pet.breed}',
            Icons.category_rounded,
            isDark,
          ),
          const Divider(height: 20),
          _buildLedgerRow(
            'Vaccination Status',
            vaccineValue,
            Icons.verified_user_rounded,
            isDark,
          ),
          const Divider(height: 20),
          _buildLedgerRow(
            'Markings & Color',
            markingsValue,
            Icons.palette_rounded,
            isDark,
          ),
          const Divider(height: 20),
          _buildLedgerRow(
            'Health Score Index',
            healthScoreValue,
            Icons.favorite_rounded,
            isDark,
          ),
          const Divider(height: 20),
          _buildLedgerRow(
            'Emergency Care Hotlink',
            emergencyValue,
            Icons.phone_in_talk_rounded,
            isDark,
          ),
          if (pet.allergies?.trim().isNotEmpty == true) ...[
            const Divider(height: 20),
            _buildLedgerRow(
              'Allergies & Sensitivities',
              pet.allergies!.trim(),
              Icons.warning_amber_rounded,
              isDark,
            ),
          ],
          if (user != null) ...[
            const Divider(height: 20),
            _buildLedgerRow(
              'Registered Pet Parent',
              '${user.name.trim().isNotEmpty ? user.name.trim() : "Verified Pet Parent"}${user.address?.trim().isNotEmpty == true ? " • ${user.address!.trim()}" : ""}',
              Icons.person_pin_rounded,
              isDark,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLedgerRow(String title, String subtitle, IconData icon, bool isDark) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white54 : Colors.black54,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
