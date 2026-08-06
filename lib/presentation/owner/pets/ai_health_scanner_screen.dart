import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class AiHealthScannerScreen extends StatefulWidget {
  final PetModel? initialPet;

  const AiHealthScannerScreen({super.key, this.initialPet});

  @override
  State<AiHealthScannerScreen> createState() => _AiHealthScannerScreenState();
}

class _AiHealthScannerScreenState extends State<AiHealthScannerScreen> {
  final _issueController = TextEditingController(text: 'Mild redness and scratching behind left ear for 2 days.');
  PetModel? _selectedPet;
  bool _isLoading = false;
  String? _diagnosisResult;
  String _selectedSampleImage = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop';

  @override
  void initState() {
    super.initState();
    final pets = context.read<AppStateRepository>().pets;
    _selectedPet = widget.initialPet ?? (pets.isNotEmpty ? pets.first : null);
  }

  void _runDiagnostic() async {
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
    );

    if (mounted) {
      setState(() {
        _isLoading = false;
        _diagnosisResult = result;
      });
    }
  }

  void _saveToMedicalRecords() {
    if (_selectedPet == null || _diagnosisResult == null) return;
    final repo = context.read<AppStateRepository>();
    repo.saveAiDiagnosisToPetRecord(
      petId: _selectedPet!.petID,
      petName: _selectedPet!.name,
      title: 'AI Health Assessment (${DateTime.now().toString().substring(0, 10)})',
      diagnosis: _diagnosisResult!,
      suggestion: 'Check with local veterinarian if symptoms persist after 48 hours.',
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Diagnosis saved to ${_selectedPet!.name}\'s Medical History! ✅'),
        backgroundColor: AppColors.healthGreen,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<AppStateRepository>().pets;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('AI Health Scanner'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Upload "Drop-Zone"
            FadeInDown(
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedSampleImage = _selectedSampleImage.contains('548767797')
                        ? 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop'
                        : 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop';
                  });
                },
                child: PremiumCard(
                  opacity: 0.4,
                  borderRadius: 32,
                  child: Container(
                    height: 260,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(32),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(32),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Image.network(
                            _selectedSampleImage,
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                            color: _isLoading ? Colors.black.withOpacity(0.4) : null,
                            colorBlendMode: _isLoading ? BlendMode.darken : null,
                          ),
                          if (_isLoading) ...[
                            const CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                            const _ScanningBeam(),
                          ]
                          else if (_diagnosisResult == null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.8),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.add_a_photo_rounded, color: AppColors.primary, size: 20),
                                  const SizedBox(width: 10),
                                  Text('Change Sample Photo', 
                                    style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w600, color: AppColors.primary)),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
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
                    opacity: 0.15,
                    borderRadius: 20,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<PetModel>(
                          value: _selectedPet,
                          isExpanded: true,
                          icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
                          style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          hint: const Text('Who are we scanning?'),
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
                  const SizedBox(height: 24),

                  Text('DESCRIBE ISSUE', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 12),
                  PremiumCard(
                    opacity: 0.15,
                    borderRadius: 20,
                    child: TextField(
                      controller: _issueController,
                      maxLines: 4,
                      style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, height: 1.5),
                      decoration: InputDecoration(
                        hintText: 'e.g. Redness, unusual itching...',
                        hintStyle: TextStyle(color: AppColors.textTertiary.withOpacity(0.5)),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),

            FadeInUp(
              delay: const Duration(milliseconds: 400),
              child: SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _runDiagnostic,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                      : const Text('RUN AI DIAGNOSTIC', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                ),
              ),
            ),
            const SizedBox(height: 40),

            if (_diagnosisResult != null) ...[
              FadeInUp(
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
                              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                              child: const Icon(Icons.analytics_rounded, color: AppColors.primary, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Text('Report', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700)),
                            const Spacer(),
                            _buildTonalChip(
                              _diagnosisResult!.toLowerCase().contains('urgent') ? 'High Risk' : 'Standard',
                              _diagnosisResult!.toLowerCase().contains('urgent') ? AppColors.dangerRed : AppColors.healthGreen,
                            ),
                          ],
                        ),
                        const Divider(height: 48),
                        Text(
                          'PRIMARY FINDINGS',
                          style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary, fontWeight: FontWeight.w700, letterSpacing: 0.8, fontSize: 9),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _diagnosisResult!,
                          style: AppTypography.bodyMedium.copyWith(color: AppColors.textPrimary, height: 1.7, fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 40),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: _saveToMedicalRecords,
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(color: AppColors.primary.withOpacity(0.5)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                ),
                                child: const Text('SAVE RECORD', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () {},
                                style: ElevatedButton.styleFrom(
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                ),
                                child: const Text('FIND VET', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 60),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTonalChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        label.toUpperCase(),
        style: AppTypography.labelSmall.copyWith(color: color, fontWeight: FontWeight.w700, fontSize: 9, letterSpacing: 0.5),
      ),
    );
  }
}

class _ScanningBeam extends StatefulWidget {
  const _ScanningBeam();

  @override
  State<_ScanningBeam> createState() => _ScanningBeamState();
}

class _ScanningBeamState extends State<_ScanningBeam> with SingleTickerProviderStateMixin {
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
                  color: Colors.cyanAccent.withOpacity(0.8),
                  blurRadius: 10,
                  spreadRadius: 2,
                ),
              ],
              gradient: const LinearGradient(
                colors: [Colors.transparent, Colors.cyanAccent, Colors.transparent],
              ),
            ),
          ),
        );
      },
    );
  }
}
