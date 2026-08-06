import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/service_record_model.dart';
import '../../data/models/pet_model.dart';

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

  @override
  void initState() {
    super.initState();
    final pets = context.read<AppStateRepository>().pets;
    _selectedPet = widget.initialPet ?? (pets.isNotEmpty ? pets.first : null);
  }

  void _saveRecord() {
    if (_selectedPet == null || _titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select pet and enter title')),
      );
      return;
    }

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

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Medical record appended to pet history! 🩺'), backgroundColor: AppColors.healthGreen),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<AppStateRepository>().pets;

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Add Patient Medical Record', style: AppTypography.headlineMedium.copyWith(fontSize: 18)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const Divider(height: 20),

            Text('Patient (Pet)', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.surfaceContainerLow,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<PetModel>(
                  value: _selectedPet,
                  isExpanded: true,
                  items: pets.map((p) => DropdownMenuItem(value: p, child: Text('${p.name} (${p.breed})'))).toList(),
                  onChanged: (p) => setState(() => _selectedPet = p),
                ),
              ),
            ),
            const SizedBox(height: 16),

            Text('Consultation Title', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            TextField(controller: _titleController, decoration: const InputDecoration(hintText: 'e.g. Skin Checkup & Ear Cleaning')),
            const SizedBox(height: 16),

            Text('Diagnosis & Clinical Findings', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            TextField(controller: _diagnosisController, maxLines: 3, decoration: const InputDecoration(hintText: 'Observed mild dermatitis, clear lungs...')),
            const SizedBox(height: 16),

            Text('Prescribed Treatment & Follow-up', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            TextField(controller: _prescriptionController, maxLines: 2, decoration: const InputDecoration(hintText: 'Hydrocortisone topical cream 2x daily for 5 days...')),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _saveRecord,
                child: const Text('Append to Pet Health Profile'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
