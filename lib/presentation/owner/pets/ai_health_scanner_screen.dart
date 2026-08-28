import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/services/connectivity_service.dart';
import '../../common_widgets/premium_toast.dart';
import '../../common_widgets/formatted_ai_report.dart';
import '../services/pet_services_screen.dart';

class AiHealthScannerScreen extends StatefulWidget {
  final PetModel? initialPet;
  const AiHealthScannerScreen({super.key, this.initialPet});
  @override
  State<AiHealthScannerScreen> createState() => _AiHealthScannerScreenState();
}

class _AiHealthScannerScreenState extends State<AiHealthScannerScreen> {
  final _issueController = TextEditingController(
    text: 'Mild redness and scratching behind left ear for 2 days.',
  );
  PetModel? _selectedPet;
  bool _isLoading = false;
  String? _diagnosisResult;
  File? _selectedImageFile;
  final String _selectedSampleImage = 'assets/images/Pet_2.jpg';

  @override
  void initState() {
    super.initState();
    final pets = context.read<AppStateRepository>().pets;
    _selectedPet = widget.initialPet ?? (pets.isNotEmpty ? pets.first : null);
  }

  @override
  void dispose() {
    _issueController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
    );
    if (pickedFile != null) {
      setState(() {
        _selectedImageFile = File(pickedFile.path);
        _diagnosisResult = null;
      });
    }
  }

  void _runDiagnostic() async {
    final isOnline = await ConnectivityService().isConnected();
    if (!isOnline) {
      if (mounted) {
        context.read<AppStateRepository>().showToast(
          'AI Scanner requires an active internet connection 🌐',
          type: ToastType.error,
        );
      }
      return;
    }
    if (_selectedPet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a pet first')),
      );
      return;
    }
    setState(() {
      _isLoading = true;
      _diagnosisResult = null;
    });
    final repo = context.read<AppStateRepository>();
    final result = await repo.runAiHealthDiagnosis(
      petName: _selectedPet!.name,
      prompt: _issueController.text.trim(),
      imageFile: _selectedImageFile,
    );
    if (mounted) {
      setState(() {
        _isLoading = false;
        _diagnosisResult = result;
      });
    }
  }

  void _saveToMedicalRecords() async {
    if (_selectedPet == null || _diagnosisResult == null) return;
    final repo = context.read<AppStateRepository>();

    HapticFeedback.mediumImpact();

    try {
      await repo.saveAiDiagnosisToPetRecord(
        petId: _selectedPet!.petID,
        petName: _selectedPet!.name,
        title:
            'AI Health Assessment (${DateTime.now().toString().substring(0, 10)})',
        diagnosis: _diagnosisResult!,
        suggestion:
            'Check with local veterinarian if symptoms persist after 48 hours.',
      );

      if (mounted) {
        repo.showToast(
          'Diagnosis saved to ${_selectedPet!.name}\'s Medical History! ✅',
          context: context,
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        repo.showToast(
          'Failed to save record: $e',
          type: ToastType.error,
          context: context,
        );
      }
    }
  }

  void _findVet() {
    HapticFeedback.lightImpact();
    // Redirect to the Pet Services list
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PetServicesScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<AppStateRepository>().pets;
    final orientation = MediaQuery.of(context).orientation;
    final isLandscape = orientation == Orientation.landscape;
    return GlassScaffold(
      appBar: AppBar(
        title: const Text('AI Health Scanner'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: isLandscape
            ? _buildLandscapeLayout(pets)
            : _buildPortraitLayout(pets),
      ),
    );
  }

  Widget _buildPortraitLayout(List<PetModel> pets) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildImagePicker(),
        const SizedBox(height: 32),
        _buildPetSelector(pets),
        const SizedBox(height: 24),
        _buildIssueDescription(),
        const SizedBox(height: 40),
        _buildRunButton(),
        const SizedBox(height: 40),
        if (_diagnosisResult != null) _buildResultSection(),
      ],
    );
  }

  Widget _buildLandscapeLayout(List<PetModel> pets) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 5,
          child: Column(
            children: [
              _buildImagePicker(),
              const SizedBox(height: 24),
              _buildRunButton(),
            ],
          ),
        ),
        const SizedBox(width: 32),
        Expanded(
          flex: 5,
          child: Column(
            children: [
              _buildPetSelector(pets),
              const SizedBox(height: 24),
              _buildIssueDescription(),
              const SizedBox(height: 24),
              if (_diagnosisResult != null) _buildResultSection(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildImagePicker() {
    return FadeInDown(
      child: PremiumCard(
        opacity: 0.4,
        borderRadius: 32,
        child: GestureDetector(
          onTap: _pickImage,
          behavior: HitTestBehavior.opaque,
          child: Container(
            height: 260,
            width: double.infinity,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(32)),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(32),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (_selectedImageFile != null)
                    Image.file(
                      _selectedImageFile!,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      color: _isLoading
                          ? Colors.black.withValues(alpha: 0.4)
                          : null,
                      colorBlendMode: _isLoading ? BlendMode.darken : null,
                    )
                  else
                    Image.asset(
                      _selectedSampleImage,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                      color: _isLoading
                          ? Colors.black.withValues(alpha: 0.4)
                          : null,
                      colorBlendMode: _isLoading ? BlendMode.darken : null,
                    ),
                  if (_isLoading) ...[
                    const CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 3,
                    ),
                    const _ScanningBeam(),
                  ] else if (_diagnosisResult == null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.8),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.add_a_photo_rounded,
                            color: AppColors.primary,
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _selectedImageFile == null
                                ? 'Add Pet Photo'
                                : 'Change Photo',
                            style: AppTypography.labelSmall.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPetSelector(List<PetModel> pets) {
    return FadeInUp(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SELECT PET',
            style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppColors.textTertiary,
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 12),
          PremiumCard(
            opacity: 0.15,
            borderRadius: 20,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<PetModel>(
                  value: _selectedPet,
                  isExpanded: true,
                  icon: const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: AppColors.primary,
                  ),
                  style: AppTypography.bodyLarge.copyWith(
                    fontWeight: FontWeight.w700,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? Colors.white
                        : AppColors.textPrimary,
                  ),
                  dropdownColor: Theme.of(context).brightness == Brightness.dark
                      ? const Color(0xFF1A1A1A)
                      : Colors.white,
                  hint: Text(
                    'Who are we scanning?',
                    style: TextStyle(color: Theme.of(context).hintColor),
                  ),
                  items: pets.map((pet) {
                    return DropdownMenuItem(
                      value: pet,
                      child: Text('${pet.name} (${pet.breed})'),
                    );
                  }).toList(),
                  onChanged: (pet) => setState(() => _selectedPet = pet),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIssueDescription() {
    return FadeInUp(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'DESCRIBE ISSUE',
            style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppColors.textTertiary,
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 12),
          PremiumCard(
            opacity: 0.15,
            borderRadius: 20,
            child: TextField(
              controller: _issueController,
              maxLines: 4,
              style: AppTypography.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
                height: 1.5,
                color: Theme.of(context).brightness == Brightness.dark
                    ? Colors.white
                    : AppColors.textPrimary,
              ),
              decoration: InputDecoration(
                hintText: 'e.g. Redness, unusual itching...',
                hintStyle: TextStyle(
                  color: Theme.of(context).hintColor.withValues(alpha: 0.5),
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(20),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRunButton() {
    return FadeInUp(
      delay: const Duration(milliseconds: 400),
      child: SizedBox(
        width: double.infinity,
        height: 64,
        child: ElevatedButton(
          onPressed: _isLoading ? null : _runDiagnostic,
          style: ElevatedButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          child: _isLoading
              ? const CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                )
              : const Text(
                  'RUN AI DIAGNOSTIC',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
        ),
      ),
    );
  }

  Widget _buildResultSection() {
    return FadeInUp(
      child: PremiumCard(
        opacity: 0.25,
        borderRadius: 32,
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.auto_awesome_rounded,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Expert Assessment',
                      style: AppTypography.titleLarge.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  _TonalChip(
                    label: _diagnosisResult!.toLowerCase().contains('emergency')
                        ? 'Urgent'
                        : 'Advisory',
                    color: _diagnosisResult!.toLowerCase().contains('emergency')
                        ? AppColors.dangerRed
                        : AppColors.primary,
                  ),
                ],
              ),
              const Divider(height: 48),
              FormattedAiReport(text: _diagnosisResult!),
              const SizedBox(height: 32),
              const _ExpertDisclaimer(),
              const SizedBox(height: 40),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _saveToMedicalRecords,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.5),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text(
                        'SAVE RECORD',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _findVet,
                      style: ElevatedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text(
                        'FIND VET',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TonalChip extends StatelessWidget {
  final String label;
  final Color color;
  const _TonalChip({required this.label, required this.color});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        label.toUpperCase(),
        style: AppTypography.labelSmall.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
          fontSize: 9,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _ScanningBeam extends StatefulWidget {
  const _ScanningBeam();
  @override
  State<_ScanningBeam> createState() => _ScanningBeamState();
}

class _ScanningBeamState extends State<_ScanningBeam>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
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
        return Positioned(
          top: 220 * _controller.value,
          left: 0,
          right: 0,
          child: Container(
            height: 4,
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: Colors.cyanAccent.withValues(alpha: 0.8),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
              gradient: const LinearGradient(
                colors: [
                  Colors.transparent,
                  Colors.cyanAccent,
                  Colors.transparent,
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _ExpertDisclaimer extends StatelessWidget {
  const _ExpertDisclaimer();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.accentAmber.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.accentAmber.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: AppColors.accentAmber,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'This AI assessment is for guidance only. Please consult a professional vet for a definitive diagnosis.',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.accentAmber.withValues(alpha: 0.8),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
