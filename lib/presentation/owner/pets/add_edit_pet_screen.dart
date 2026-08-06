import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'breed_finder_screen.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Pet' : 'Add Pets', style: const TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: const Color(0xFF006684),
        foregroundColor: Colors.white,
        elevation: 0,
        systemOverlayStyle: SystemUiOverlayStyle.light, // Forces white icons on dark teal
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text('Your Pets', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 100,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
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
                        Text(p.name, style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w800)),
                      ],
                    ),
                  );
                },
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: PremiumCard(
                opacity: 0.1,
                borderRadius: 36,
                backgroundColor: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFEDF4F8),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pet Details', style: TextStyle(color: const Color(0xFF006684), fontWeight: FontWeight.w800, fontSize: 13)),
                      const SizedBox(height: 32),

                      Center(
                        child: Stack(
                          children: [
                            CircleAvatar(
                              radius: 64,
                              backgroundColor: Colors.white,
                              backgroundImage: CachedNetworkImageProvider(_selectedImageUrl),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: GestureDetector(
                                onTap: () {},
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: const BoxDecoration(color: Color(0xFF006684), shape: BoxShape.circle),
                                  child: const Icon(Icons.edit_rounded, color: Colors.white, size: 18),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),

                      _buildPremiumInput('Pet Name', _nameController, icon: Icons.pets_rounded),
                      const SizedBox(height: 20),
                      
                      Row(
                        children: [
                          Expanded(child: _buildPremiumInput('Breed', _breedController)),
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

                      Row(
                        children: [
                          Expanded(child: _buildPremiumInput('Color', _colorController)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildPremiumInput('Sound', _soundController)),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(child: _buildPremiumInput('Height', _heightController, suffix: 'cm')),
                          const SizedBox(width: 12),
                          Expanded(child: _buildPremiumInput('Weight', _weightController, suffix: 'kg')),
                        ],
                      ),
                      const SizedBox(height: 24),

                      Text('Feeding Times', style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, letterSpacing: 0.5)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: _feedingTimes.map((t) => _buildTimeChip(t)).toList(),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(child: _buildActionButton(Icons.add, 'Add Time', _addTime)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildActionButton(Icons.auto_awesome_rounded, 'AI Suggest', _aiSuggest)),
                        ],
                      ),
                      const SizedBox(height: 24),

                      _buildPremiumInput('Bio', _bioController, maxLines: 3),
                      const SizedBox(height: 48),

                      SizedBox(
                        width: double.infinity,
                        height: 64,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _savePet,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF006684),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                          ),
                          child: _isSaving 
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(isEditing ? 'Update Pet' : 'Save Pet', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 0.5)),
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

  Widget _buildPremiumInput(String label, TextEditingController controller, {IconData? icon, String? suffix, int maxLines = 1}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, letterSpacing: 0.5)),
        ),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                if (icon != null) ...[Icon(icon, size: 20, color: AppColors.primary), const SizedBox(width: 12)],
                Expanded(
                  child: TextField(
                    controller: controller,
                    maxLines: maxLines,
                    style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      suffixText: suffix,
                      suffixStyle: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, letterSpacing: 0.5)),
        ),
        PremiumCard(
          opacity: 0.05,
          borderRadius: 16,
          backgroundColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey[200],
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            child: Text(value, style: TextStyle(color: isDark ? Colors.white54 : Colors.grey[600], fontWeight: FontWeight.w800, fontSize: 14)),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, letterSpacing: 0.5)),
        ),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _gender,
                isExpanded: true,
                dropdownColor: isDark ? const Color(0xFF1A1A1A) : Colors.white,
                style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w700),
                items: ['Male', 'Female'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                onChanged: (val) => setState(() => _gender = val!),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDatePicker() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text('DOB', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, letterSpacing: 0.5)),
        ),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 16,
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                const Icon(Icons.calendar_month_rounded, size: 20, color: AppColors.primary),
                const SizedBox(width: 12),
                Text(
                  _dob == null ? 'Select Date' : DateFormat('yyyy-MM-dd').format(_dob!),
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Row(
          children: [
            Icon(Icons.search_rounded, size: 20, color: Color(0xFF006684)),
            SizedBox(width: 8),
            Text('Scan', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF006684))),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeChip(String time) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFA8D5BA).withOpacity(0.4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2D8C69).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(time, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF2D8C69), fontSize: 12)),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => setState(() => _feedingTimes.remove(time)),
            child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF2D8C69)),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: const Color(0xFF006684)),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF006684), fontSize: 13)),
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
