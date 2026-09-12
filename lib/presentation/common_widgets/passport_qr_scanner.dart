import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:url_launcher/url_launcher.dart';
import 'premium_toast.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/pet_model.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/app_state_repository.dart';
import '../provider/add_service_record_modal.dart';
import 'resilient_network_image.dart';

/// Modal bottom sheet for scanning & verifying Pet Maya Passport QR codes.
/// Works for Pet Owners, Vets, Groomers, Boarding Providers, and Shelters.
class PassportQrScannerModal extends StatefulWidget {
  const PassportQrScannerModal({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const PassportQrScannerModal(),
    );
  }

  @override
  State<PassportQrScannerModal> createState() => _PassportQrScannerModalState();
}

class _PassportQrScannerModalState extends State<PassportQrScannerModal>
    with SingleTickerProviderStateMixin {
  late MobileScannerController _scannerController;
  late AnimationController _laserController;
  late Animation<double> _laserAnimation;

  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _scannerController = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
      torchEnabled: false,
    );
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _laserAnimation = Tween<double>(begin: 0.1, end: 0.9).animate(
      CurvedAnimation(parent: _laserController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _scannerController.dispose();
    _laserController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty || barcodes.first.rawValue == null) return;

    final String code = barcodes.first.rawValue!;

    if (!code.startsWith('PETMAYA:')) return;

    setState(() {
      _isProcessing = true;
    });

    HapticFeedback.heavyImpact();
    // Pause scanner to prevent multiple rapid triggers
    _scannerController.stop();

    final petId = code.replaceFirst('PETMAYA:', '').trim();
    await _handleDiscoveredPet(petId);
  }

  Future<void> _handleDiscoveredPet(String petId) async {
    final repo = context.read<AppStateRepository>();
    final currentUser = repo.currentUser;

    // Determine role logic
    final isProvider = currentUser != null &&
        (currentUser.role == UserRole.veterinarian ||
            currentUser.role == UserRole.grooming ||
            currentUser.role == UserRole.boarding ||
            currentUser.role == UserRole.shelter);

    // 1. Fetch pet profile (simulation / real fetch via repo if available)
    final matchedPet = repo.pets.where((p) => p.petID == petId).firstOrNull ??
        repo.allUsers.expand((u) => repo.pets).where((p) => p.petID == petId).firstOrNull;

    if (matchedPet == null) {
      if (mounted) {
        Navigator.pop(context);
        repo.showToast('Invalid or unregistered Pet Passport QR Code',
            type: ToastType.error, context: context);
      }
      return;
    }

    // 2. Fetch Owner Info
    final owner = repo.allUsers.where((u) => u.uid == matchedPet.ownerID).firstOrNull;

    // 3. Fetch Service Records & Tracker state
    final petRecords =
        repo.serviceRecords.where((r) => r.petId == matchedPet.petID).toList();
    final device = repo.devices.where((d) => d.petId == matchedPet.petID).firstOrNull;

    if (mounted) {
      // Close Scanner
      Navigator.pop(context);

      // Open Data Profile Sheet
      _showVerifiedCredentialDialog(
        context: context,
        pet: matchedPet,
        owner: owner,
        petRecordsCount: petRecords.length,
        deviceSerial: device?.serialNumber,
        isProvider: isProvider,
      );
    }
  }

  void _showVerifiedCredentialDialog({
    required BuildContext context,
    required PetModel pet,
    required UserModel? owner,
    required int petRecordsCount,
    required String? deviceSerial,
    required bool isProvider,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ownerPhone = owner?.phone?.trim() ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: EdgeInsets.fromLTRB(
            24,
            20,
            24,
            MediaQuery.of(context).viewInsets.bottom + 28,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
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

              // Verification Badge Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFF10B981).withValues(alpha: 0.4),
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.verified_rounded,
                      color: Color(0xFF10B981),
                      size: 16,
                    ),
                    SizedBox(width: 6),
                    Text(
                      'VERIFIED PASSPORT CREDENTIAL',
                      style: TextStyle(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF10B981),
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Pet Profile Header
              Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary, width: 2),
                    ),
                    child: ResilientNetworkImage(
                      imageUrl: pet.photoUrl,
                      width: 64,
                      height: 64,
                      borderRadius: BorderRadius.circular(32),
                      fit: BoxFit.cover,
                      fallbackIcon: Icons.pets_rounded,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          pet.name,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${pet.resolvedSpecies} • ${pet.breed} • ${pet.gender.toUpperCase()}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Weight: ${pet.weight} kg • Age: ${pet.age}',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? Colors.white60 : Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Details Grid Cards
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.05)
                      : Colors.black.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white12 : Colors.black12,
                  ),
                ),
                child: Column(
                  children: [
                    _buildDetailRow(
                      Icons.person_pin_rounded,
                      'Registered Parent',
                      owner?.name ?? 'Verified Pet Owner',
                      isDark,
                    ),
                    const Divider(height: 18),
                    _buildDetailRow(
                      Icons.phone_rounded,
                      'Emergency Contact',
                      ownerPhone.isNotEmpty ? ownerPhone : 'Pet Maya Support: 16263',
                      isDark,
                    ),
                    const Divider(height: 18),
                    _buildDetailRow(
                      Icons.memory_rounded,
                      'Microchip Transponder',
                      deviceSerial != null
                          ? 'CONNECTED: $deviceSerial'
                          : 'No Hardware Device Connected',
                      isDark,
                    ),
                    const Divider(height: 18),
                    _buildDetailRow(
                      Icons.medical_services_rounded,
                      'Clinical Logs',
                      '$petRecordsCount Record(s) Logged • ${pet.healthIndex}% Health Score',
                      isDark,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons
              Row(
                children: [
                  if (ownerPhone.isNotEmpty)
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF10B981),
                          side: const BorderSide(color: Color(0xFF10B981)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () {
                          launchUrl(Uri.parse('tel:$ownerPhone'));
                        },
                        icon: const Icon(Icons.call_rounded, size: 18),
                        label: const Text(
                          'Call Owner',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                  if (ownerPhone.isNotEmpty) const SizedBox(width: 12),
                  if (isProvider)
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1AB680),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => AddServiceRecordModal(initialPet: pet),
                          );
                        },
                        icon: const Icon(Icons.note_add_rounded, size: 18),
                        label: const Text(
                          'Add EHR Log',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(
    IconData icon,
    String label,
    String value,
    bool isDark,
  ) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white54 : Colors.black54,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final repo = context.watch<AppStateRepository>();
    final pets = repo.pets;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
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

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Scan Passport QR Code',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Align the Pet Maya Passport QR code within the frame to verify credential & clinical history.',
            style: TextStyle(
              fontSize: 12,
              color: isDark ? Colors.white60 : Colors.black54,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // Scanner Viewfinder
          Expanded(
            child: Stack(
              alignment: Alignment.center,
              children: [
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1FAF5),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(28),
                    child: Stack(
                      children: [
                        // Live Camera Feed
                        MobileScanner(
                          controller: _scannerController,
                          onDetect: _onDetect,
                        ),
                        
                        // Viewfinder grid lines
                        Center(
                          child: Container(
                            width: 220,
                            height: 220,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: AppColors.primary,
                                width: 2.5,
                              ),
                            ),
                            child: Stack(
                              children: [
                                AnimatedBuilder(
                                  animation: _laserAnimation,
                                  builder: (context, child) {
                                    return Positioned(
                                      top: 220 * _laserAnimation.value,
                                      left: 8,
                                      right: 8,
                                      child: Container(
                                        height: 3,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF10B981),
                                          borderRadius: BorderRadius.circular(2),
                                          boxShadow: const [
                                            BoxShadow(
                                              color: Color(0xFF10B981),
                                              blurRadius: 10,
                                              spreadRadius: 2,
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
                      ],
                    ),
                  ),
                ),

                Positioned(
                  bottom: 20,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.65),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.camera_alt_rounded, size: 14, color: Colors.white),
                        SizedBox(width: 8),
                        Text(
                          'Optical Scanner Active',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Tap to verify enrolled pets directly
          Text(
            'OR SELECT ENROLLED PET TO VERIFY PASSPORT',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white54 : Colors.black54,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 12),

          if (pets.isEmpty)
            const Text(
              'No pets registered in directory',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            )
          else
            SizedBox(
              height: 48,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: pets.length,
                separatorBuilder: (_, __) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final pet = pets[index];
                  return ChoiceChip(
                    label: Text(pet.name),
                    avatar: CircleAvatar(
                      backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                      child: Text(
                        pet.name.substring(0, 1).toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    selected: false,
                    onSelected: (_) {
                      setState(() => _isProcessing = false);
                      _handleDiscoveredPet(pet.petID);
                    },
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
