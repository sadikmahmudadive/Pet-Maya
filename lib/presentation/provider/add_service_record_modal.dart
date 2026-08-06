import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/service_record_model.dart';
import '../../data/models/pet_model.dart';
import '../common_widgets/premium_card.dart';

class AddServiceRecordModal extends StatefulWidget {
  final PetModel? initialPet;

  const AddServiceRecordModal({super.key, this.initialPet});

  @override
  State<AddServiceRecordModal> createState() => _AddServiceRecordModalState();
}

class _AddServiceRecordModalState extends State<AddServiceRecordModal> {
  PetModel? _selectedPet;
  final _titleController = TextEditingController(text: 'Routine Health Consultation');
  final _diagnosisController = TextEditingController();
  final _prescriptionController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final pets = context.read<AppStateRepository>().pets;
    _selectedPet = widget.initialPet ?? (pets.isNotEmpty ? pets.first : null);
  }

  void _saveRecord() {
    if (_selectedPet == null || _titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select pet and enter title'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isSaving = true);
    final repo = context.read<AppStateRepository>();
    
    final record = ServiceRecordModel(
      recordId: 'rec_${const Uuid().v4().substring(0, 6)}',
      petId: _selectedPet!.petID,
      petName: _selectedPet!.name,
      providerId: repo.currentUser?.uid ?? 'vet_1',
      providerName: repo.currentUser?.name ?? 'Dr. Sarah Jenkins',
      providerRole: repo.currentUser?.role.displayName ?? 'Veterinarian',
      date: DateTime.now().toString().substring(0, 10),
      title: _titleController.text.trim(),
      description: _diagnosisController.text.trim(),
      diagnosis: _diagnosisController.text.trim(),
      suggestion: _prescriptionController.text.trim(),
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    repo.saveAiDiagnosisToPetRecord(
      petId: record.petId,
      petName: record.petName,
      title: record.title,
      diagnosis: record.diagnosis ?? '',
      suggestion: record.suggestion ?? '',
    );

    HapticFeedback.mediumImpact();
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Medical record saved successfully! 🩺'), backgroundColor: AppColors.healthGreen, behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<AppStateRepository>().pets;
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
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.2), borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 24),
            Text('Medical Log', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 24),

            _buildSectionLabel('Patient (Pet)'),
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
                    hint: const Text('Select Patient', style: TextStyle(fontSize: 14)),
                    dropdownColor: isDark ? const Color(0xFF1A1A1A) : Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),

            _buildPremiumField('Consultation Title', _titleController, hintText: 'e.g. Annual Vaccination'),
            const SizedBox(height: 20),

            _buildPremiumField('Clinical Findings', _diagnosisController, hintText: 'Diagnosis details...', maxLines: 3),
            const SizedBox(height: 20),

            _buildPremiumField('Prescribed Treatment', _prescriptionController, hintText: 'Medicines, diet etc.', maxLines: 2),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _saveRecord,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF006684), 
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('SAVE MEDICAL RECORD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14, letterSpacing: 0.5)),
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
        label.toUpperCase(),
        style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 0.5),
      ),
    );
  }

  Widget _buildPremiumField(String label, TextEditingController controller, {required String hintText, int maxLines = 1}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionLabel(label),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: controller,
              maxLines: maxLines,
              style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                hintText: hintText,
                border: InputBorder.none,
                hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white24 : Colors.grey),
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
