import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'breed_finder_screen.dart';
import 'package:animate_do/animate_do.dart';

class AddEditPetScreen extends StatefulWidget {
  final PetModel? petToEdit;

  const AddEditPetScreen({super.key, this.petToEdit});

  @override
  State<AddEditPetScreen> createState() => _AddEditPetScreenState();
}

class _AddEditPetScreenState extends State<AddEditPetScreen> {
  final _nameController = TextEditingController();
  final _breedController = TextEditingController();
  final _colorController = TextEditingController();
  final _soundController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();
  final _bioController = TextEditingController();

  DateTime? _dob;
  String _gender = 'Male';
  String _selectedImageUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop';
  List<String> _feedingTimes = [];
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.petToEdit != null) {
      final p = widget.petToEdit!;
      _nameController.text = p.name;
      _breedController.text = p.breed;
      _colorController.text = p.color;
      _soundController.text = p.sound;
      _heightController.text = p.height;
      _weightController.text = p.weight;
      _bioController.text = p.description ?? '';
      _gender = p.gender;
      _feedingTimes = List<String>.from(p.feedingTimes);
      if (p.dob.isNotEmpty) _dob = DateTime.tryParse(p.dob);
      if (p.photoUrl != null) _selectedImageUrl = p.photoUrl!;
    }
  }

  String _calculateAge() {
    if (_dob == null) return 'N/A';
    final now = DateTime.now();
    int years = now.year - _dob!.year;
    int months = now.month - _dob!.month;
    if (months < 0) {
      years--;
      months += 12;
    }
    return '$years Year${years != 1 ? 's' : ''}, $months Month${months != 1 ? 's' : ''}';
  }

  void _savePet() {
    final name = _nameController.text.trim();
    final breed = _breedController.text.trim();

    if (name.isEmpty || breed.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter pet name and breed')),
      );
      return;
    }

    setState(() => _isSaving = true);
    final repo = context.read<AppStateRepository>();
    final isEditing = widget.petToEdit != null;

    final pet = PetModel(
      petID: isEditing ? widget.petToEdit!.petID : 'pet_${const Uuid().v4().substring(0, 6)}',
      ownerID: repo.currentUser?.uid ?? 'owner_1',
      name: name,
      breed: breed,
      gender: _gender,
      age: _calculateAge(),
      dob: _dob?.toIso8601String() ?? '',
      color: _colorController.text.trim(),
      sound: _soundController.text.trim(),
      height: _heightController.text.trim(),
      weight: _weightController.text.trim(),
      photoUrl: _selectedImageUrl,
      description: _bioController.text.trim(),
      feedingTimes: _feedingTimes,
    );

    if (isEditing) {
      repo.updatePet(pet);
    } else {
      repo.addPet(pet);
    }

    HapticFeedback.mediumImpact();
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isEditing ? 'Pet profile updated! ✨' : 'Pet added successfully! 🐾'),
        backgroundColor: AppColors.healthGreen,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.petToEdit != null;
    final pets = context.watch<AppStateRepository>().pets;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Pet' : 'Add Pets', style: const TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF006684),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Horizontal Pet List
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text('Your Pets', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700)),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 100,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: pets.length,
                itemBuilder: (context, index) {
                  final p = pets[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: AppColors.primary.withOpacity(0.1),
                          backgroundImage: p.photoUrl != null ? CachedNetworkImageProvider(p.photoUrl!) : null,
                          child: p.photoUrl == null ? const Icon(Icons.pets) : null,
                        ),
                        const SizedBox(height: 8),
                        Text(p.name, style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700)),
                      ],
                    ),
                  );
                },
              ),
            ),

            // 2. Main Form Container
            Padding(
              padding: const EdgeInsets.all(16),
              child: PremiumCard(
                opacity: 0.1,
                borderRadius: 36,
                backgroundColor: const Color(0xFFEDF4F8),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pet Details', style: TextStyle(color: const Color(0xFF006684).withOpacity(0.7), fontWeight: FontWeight.w700)),
                      const SizedBox(height: 24),

                      // Profile Pic
                      Center(
                        child: Stack(
                          children: [
                            CircleAvatar(
                              radius: 60,
                              backgroundColor: Colors.white,
                              backgroundImage: CachedNetworkImageProvider(_selectedImageUrl),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: GestureDetector(
                                onTap: () {
                                  // Image picker logic
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: const BoxDecoration(color: Color(0xFF006684), shape: BoxShape.circle),
                                  child: const Icon(Icons.edit_rounded, color: Colors.white, size: 16),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Inputs
                      _buildOutlinedField('Pet Name', _nameController, icon: Icons.pets_rounded),
                      const SizedBox(height: 20),
                      
                      Row(
                        children: [
                          Expanded(child: _buildOutlinedField('Breed', _breedController)),
                          const SizedBox(width: 12),
                          _buildScanButton(),
                        ],
                      ),
                      const SizedBox(height: 20),

                      Row(
                        children: [
                          Expanded(child: _buildDropdown('Gender')),
                          const SizedBox(width: 12),
                          Expanded(child: _buildDatePicker()),
                        ],
                      ),
                      const SizedBox(height: 20),

                      _buildReadOnlyField('Calculated Age', _calculateAge()),
                      const SizedBox(height: 20),

                      // Grid inputs
                      Row(
                        children: [
                          Expanded(child: _buildOutlinedField('Color', _colorController)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildOutlinedField('Sound', _soundController)),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(child: _buildOutlinedField('Height', _heightController, suffix: 'cm')),
                          const SizedBox(width: 12),
                          Expanded(child: _buildOutlinedField('Weight', _weightController, suffix: 'kg')),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Feeding Times
                      Text('Feeding Times', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey[700])),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _feedingTimes.map((t) => _buildTimeChip(t)).toList(),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _buildActionButton(Icons.add, 'Add Time', _addTime)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildActionButton(Icons.check_circle_rounded, 'AI Suggest', _aiSuggest)),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Bio
                      _buildOutlinedField('Bio', _bioController, maxLines: 3),
                      const SizedBox(height: 40),

                      // Main Action Button
                      SizedBox(
                        width: double.infinity,
                        height: 64,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _savePet,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF006684),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                          child: _isSaving 
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(isEditing ? 'Update Pet' : 'Save Pet', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildOutlinedField(String label, TextEditingController controller, {IconData? icon, String? suffix, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 4),
          child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black54)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withOpacity(0.5)),
          ),
          child: Row(
            children: [
              if (icon != null) ...[Icon(icon, size: 20, color: Colors.grey), const SizedBox(width: 12)],
              Expanded(
                child: TextField(
                  controller: controller,
                  maxLines: maxLines,
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    suffixText: suffix,
                    suffixStyle: const TextStyle(color: Colors.grey),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 4),
          child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black54)),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withOpacity(0.3)),
          ),
          child: Text(value, style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _buildDropdown(String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 4),
          child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black54)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.withOpacity(0.5)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _gender,
              isExpanded: true,
              style: const TextStyle(fontSize: 13, color: Colors.black87, fontWeight: FontWeight.w600),
              items: ['Male', 'Female'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
              onChanged: (val) => setState(() => _gender = val!),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 4),
          child: Text('DOB', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black54)),
        ),
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _dob ?? DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime.now(),
            );
            if (picked != null) setState(() => _dob = picked);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.withOpacity(0.5)),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_month_rounded, size: 18, color: Colors.grey),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    _dob == null ? 'Select' : DateFormat('yyyy-MM-dd').format(_dob!),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildScanButton() {
    return GestureDetector(
      onTap: () async {
        final breed = await Navigator.push(context, MaterialPageRoute(builder: (_) => const BreedFinderScreen()));
        if (breed != null) setState(() => _breedController.text = breed);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search_rounded, size: 18, color: Color(0xFF006684)),
            SizedBox(width: 4),
            Text('Scan', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF006684), fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeChip(String time) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFA8D5BA).withOpacity(0.4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF2D8C69).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(time, style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF2D8C69), fontSize: 12)),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: () => setState(() => _feedingTimes.remove(time)),
            child: const Icon(Icons.close_rounded, size: 14, color: Color(0xFF2D8C69)),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: const Color(0xFF006684)),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label, 
                style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF006684), fontSize: 11),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _addTime() async {
    final t = await showTimePicker(context: context, initialTime: TimeOfDay.now());
    if (t != null) {
      final formatted = '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
      if (!_feedingTimes.contains(formatted)) {
        setState(() {
          _feedingTimes.add(formatted);
          _feedingTimes.sort();
        });
      }
    }
  }

  void _aiSuggest() async {
    final repo = context.read<AppStateRepository>();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Generating smart schedule... 🪄')));
    try {
      final suggested = await repo.runAiNutritionSchedule(
        petName: _nameController.text, breed: _breedController.text, 
        age: _calculateAge(), weight: _weightController.text
      );
      setState(() => _feedingTimes = suggested);
    } catch (_) {}
  }
}
