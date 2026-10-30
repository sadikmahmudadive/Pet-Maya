import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/other_animal_model.dart';
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

  /// Opens the scanner for an animal that is not the user's pet (for example "Scan again" from the profile).
  final OtherAnimalModel? initialOtherAnimal;

  /// Opens in "Not my pet" mode for a new animal.
  final bool startAsNotMine;
  const AiHealthScannerScreen({
    super.key,
    this.initialPet,
    this.initialOtherAnimal,
    this.startAsNotMine = false,
  });
  @override
  State<AiHealthScannerScreen> createState() => _AiHealthScannerScreenState();
}

class _AiHealthScannerScreenState extends State<AiHealthScannerScreen> {
  final _issueController = TextEditingController();
  PetModel? _selectedPet;

  // "Not my pet" mode: a stray, a neighbour's or a friend's animal. Saved separately from Pet Family.
  bool _notMine = false;
  OtherAnimalModel? _selectedOther; // null = a new animal
  String _otherType = 'Dog';
  final _otherName = TextEditingController();
  final _otherBreed = TextEditingController();
  final _otherNote = TextEditingController();
  bool _isSaving = false;

  bool _isLoading = false;
  String? _diagnosisResult;
  File? _selectedImageFile;
  final String _selectedSampleImage = 'assets/images/Pet_2.jpg';

  @override
  void initState() {
    super.initState();
    final pets = context.read<AppStateRepository>().pets;
    if (widget.initialOtherAnimal != null || widget.startAsNotMine) {
      _notMine = true;
      _selectedOther = widget.initialOtherAnimal;
    } else {
      _selectedPet = widget.initialPet ?? (pets.isNotEmpty ? pets.first : null);
      // Someone with no pets of their own can still use the scanner, for any animal.
      _notMine = _selectedPet == null;
    }
  }

  @override
  void dispose() {
    _otherName.dispose();
    _otherBreed.dispose();
    _otherNote.dispose();
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
    final repo = context.read<AppStateRepository>();
    final isOnline = await ConnectivityService().isConnected();
    if (!isOnline) {
      if (mounted) {
        repo.showToast(
          'AI Scanner requires an active internet connection 🌐',
          type: ToastType.error,
          context: context,
        );
      }
      return;
    }
    if (!_notMine && _selectedPet == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a pet first')),
        );
      }
      return;
    }
    if (_issueController.text.trim().isEmpty && _selectedImageFile == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Describe the issue or add a photo first')),
        );
      }
      return;
    }
    setState(() {
      _isLoading = true;
      _diagnosisResult = null;
    });
    final other = _selectedOther;
    final result = _notMine
        ? await repo.runAiHealthDiagnosis(
            petName: _otherDisplayName,
            prompt: _issueController.text.trim(),
            imageFile: _selectedImageFile,
            isOwned: false,
            species: other?.type ?? _otherType,
            breed: other?.breed ?? _otherBreed.text,
            where: other?.note ?? _otherNote.text,
          )
        : await repo.runAiHealthDiagnosis(
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

  String get _otherDisplayName {
    final other = _selectedOther;
    if (other != null) return other.displayName;
    final name = _otherName.text.trim();
    return name.isNotEmpty ? name : 'Unnamed ${_otherType.toLowerCase()}';
  }

  void _setNotMine(bool value) {
    if (_notMine == value) return;
    HapticFeedback.selectionClick();
    setState(() {
      _notMine = value;
      // A report belongs to the animal it was made for, so it is not carried over to the other mode.
      _diagnosisResult = null;
    });
  }

  /// Saves the scan under "Not your pets" on the profile, creating the animal first when it is a new one.
  Future<void> _saveNotMyPet() async {
    if (_diagnosisResult == null || _isSaving) return;
    final repo = context.read<AppStateRepository>();
    HapticFeedback.mediumImpact();
    setState(() => _isSaving = true);
    final other = _selectedOther;
    final animal = await repo.saveNotMyPetScan(
      existing: other,
      type: _otherType,
      name: _otherName.text,
      breed: _otherBreed.text,
      note: _otherNote.text,
      photo: _selectedImageFile,
      issue: _issueController.text.trim(),
      diagnosis: _diagnosisResult!,
    );
    if (!mounted) return;
    setState(() => _isSaving = false);
    if (animal == null) {
      repo.showToast(
        repo.lastOtherAnimalError ?? 'Could not save this animal.',
        type: ToastType.error,
        context: context,
      );
      return;
    }
    repo.showToast(
      "Saved ${animal.displayName} under Not Your Pets ✅",
      context: context,
    );
    Navigator.pop(context);
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
    final others = context.watch<AppStateRepository>().otherAnimals;
    final orientation = MediaQuery.of(context).orientation;
    final isLandscape = orientation == Orientation.landscape;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final topPadding = MediaQuery.of(context).padding.top + kToolbarHeight + 8;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          'AI Health Scanner',
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w800,
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Stack(
        children: [
          // Chromatic liquid glass ambient glow orbs
          Positioned(
            top: 20,
            left: -40,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF7C4DFF).withValues(alpha: isDark ? 0.22 : 0.10),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 220,
            right: -40,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF00B4D8).withValues(alpha: isDark ? 0.20 : 0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: EdgeInsets.fromLTRB(20, topPadding, 20, 40),
            child: isLandscape
                ? _buildLandscapeLayout(pets, others)
                : _buildPortraitLayout(pets, others),
          ),
        ],
      ),
    );
  }

  Widget _buildPortraitLayout(List<PetModel> pets, List<OtherAnimalModel> others) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildImagePicker(),
        const SizedBox(height: 32),
        _buildSubjectSection(pets, others),
        const SizedBox(height: 24),
        _buildIssueDescription(),
        const SizedBox(height: 40),
        _buildRunButton(),
        const SizedBox(height: 40),
        if (_diagnosisResult != null) _buildResultSection(),
      ],
    );
  }

  Widget _buildLandscapeLayout(List<PetModel> pets, List<OtherAnimalModel> others) {
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
              _buildSubjectSection(pets, others),
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
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.35),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF7C4DFF).withValues(alpha: 0.20),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
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
                  // HUD corner reticles
                  _buildHudCorners(),
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
                                ? (_notMine ? 'Add Animal Photo' : 'Add Pet Photo')
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

  Widget _buildHudCorners() {
    return Positioned.fill(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            Align(alignment: Alignment.topLeft, child: _cornerReticle(0)),
            Align(alignment: Alignment.topRight, child: _cornerReticle(1)),
            Align(alignment: Alignment.bottomLeft, child: _cornerReticle(2)),
            Align(alignment: Alignment.bottomRight, child: _cornerReticle(3)),
          ],
        ),
      ),
    );
  }

  Widget _cornerReticle(int corner) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        border: Border(
          top: corner < 2 ? const BorderSide(color: Color(0xFF00E5FF), width: 2.5) : BorderSide.none,
          bottom: corner >= 2 ? const BorderSide(color: Color(0xFF00E5FF), width: 2.5) : BorderSide.none,
          left: (corner == 0 || corner == 2) ? const BorderSide(color: Color(0xFF00E5FF), width: 2.5) : BorderSide.none,
          right: (corner == 1 || corner == 3) ? const BorderSide(color: Color(0xFF00E5FF), width: 2.5) : BorderSide.none,
        ),
      ),
    );
  }

  /// "My pet" / "Not my pet" switch, then whichever animal chooser belongs to the mode.
  Widget _buildSubjectSection(List<PetModel> pets, List<OtherAnimalModel> others) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildOwnershipToggle(),
        const SizedBox(height: 20),
        if (_notMine) _buildOtherAnimalForm(others) else _buildPetSelector(pets),
      ],
    );
  }

  Widget _buildOwnershipToggle() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Widget option({
      required bool selected,
      required IconData icon,
      required String title,
      required String hint,
      required VoidCallback onTap,
    }) {
      final fg = selected
          ? Colors.white
          : (isDark ? Colors.white : AppColors.textPrimary);
      return Expanded(
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              children: [
                Icon(icon, size: 20, color: fg),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          color: fg,
                        ),
                      ),
                      Text(
                        hint,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: fg.withValues(alpha: 0.75),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return FadeInUp(
      child: PremiumCard(
        opacity: 0.15,
        borderRadius: 22,
        child: Padding(
          padding: const EdgeInsets.all(5),
          child: Row(
            children: [
              option(
                selected: !_notMine,
                icon: Icons.pets_rounded,
                title: 'My pet',
                hint: 'Saved to its records',
                onTap: () => _setNotMine(false),
              ),
              const SizedBox(width: 4),
              option(
                selected: _notMine,
                icon: Icons.travel_explore_rounded,
                title: 'Not my pet',
                hint: "Stray or someone else's",
                onTap: () => _setNotMine(true),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _otherField(TextEditingController controller, String hint, {int maxLength = 80}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return PremiumCard(
      opacity: 0.15,
      borderRadius: 20,
      child: TextField(
        controller: controller,
        maxLength: maxLength,
        textCapitalization: TextCapitalization.sentences,
        style: AppTypography.bodyMedium.copyWith(
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white : AppColors.textPrimary,
        ),
        decoration: InputDecoration(
          hintText: hint,
          counterText: '',
          hintStyle: TextStyle(color: Theme.of(context).hintColor.withValues(alpha: 0.5)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildOtherAnimalForm(List<OtherAnimalModel> saved) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final label = AppTypography.labelSmall.copyWith(
      fontWeight: FontWeight.w700,
      letterSpacing: 0.8,
      color: AppColors.textTertiary,
      fontSize: 10,
    );
    final selected = _selectedOther;
    return FadeInUp(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('WHICH ANIMAL?', style: label),
          const SizedBox(height: 12),
          if (saved.isNotEmpty) ...[
            PremiumCard(
              opacity: 0.15,
              borderRadius: 20,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: selected != null && saved.any((a) => a.id == selected.id) ? selected.id : 'new',
                    isExpanded: true,
                    icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
                    style: AppTypography.bodyLarge.copyWith(
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                    dropdownColor: isDark ? const Color(0xFF0D302D) : Colors.white,
                    items: [
                      const DropdownMenuItem(value: 'new', child: Text('A new animal')),
                      ...saved.map(
                        (a) => DropdownMenuItem(
                          value: a.id,
                          child: Text('${a.displayName} (${a.type})', overflow: TextOverflow.ellipsis),
                        ),
                      ),
                    ],
                    onChanged: (id) => setState(() {
                      _selectedOther = id == null || id == 'new' ? null : saved.firstWhere((a) => a.id == id);
                      _diagnosisResult = null;
                    }),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
          if (selected != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                '${selected.subtitle} · scanned ${selected.scanCount} time${selected.scanCount == 1 ? '' : 's'}'
                '${selected.note.trim().isEmpty ? '' : ' · ${selected.note.trim()}'}',
                style: AppTypography.bodySmall.copyWith(color: AppColors.textTertiary),
              ),
            )
          else ...[
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: OtherAnimalModel.types
                  .map(
                    (t) => ChoiceChip(
                      label: Text(t),
                      selected: _otherType == t,
                      onSelected: (_) => setState(() => _otherType = t),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 12),
            _otherField(_otherName, 'Name or nickname (optional)', maxLength: 60),
            const SizedBox(height: 12),
            _otherField(_otherBreed, 'Breed or what it looks like (optional)'),
            const SizedBox(height: 12),
            _otherField(_otherNote, 'Where did you see it? (optional)', maxLength: 200),
          ],
        ],
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
                      ? const Color(0xFF0D302D)
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
          if (pets.isEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 10, left: 4),
              child: Text(
                "You haven't added a pet yet. Switch to 'Not my pet' to scan any animal.",
                style: AppTypography.bodySmall.copyWith(color: AppColors.textTertiary),
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
                hintText: 'e.g. Mild redness and scratching behind left ear for 2 days.',
                hintStyle: AppTypography.bodyMedium.copyWith(
                  fontWeight: FontWeight.w400,
                  fontStyle: FontStyle.italic,
                  height: 1.5,
                  color: Theme.of(context).hintColor.withValues(alpha: 0.45),
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
              if (_notMine) ...[
                const SizedBox(height: 12),
                const _NotYourPetNote(),
              ],
              const SizedBox(height: 40),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _notMine
                          ? (_isSaving ? null : _saveNotMyPet)
                          : _saveToMedicalRecords,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: AppColors.primary.withValues(alpha: 0.5),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(
                              _notMine ? 'SAVE AS NOT MY PET' : 'SAVE RECORD',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
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

class _NotYourPetNote extends StatelessWidget {
  const _NotYourPetNote();
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.travel_explore_rounded, color: AppColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "This animal isn't yours. Saving it adds it under Not Your Pets on your profile, separate from your Pet Family. Keep your distance from an injured or frightened animal.",
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.primary.withValues(alpha: 0.9),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
