import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:animate_do/animate_do.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
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

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _selectedImageUrl = pickedFile.path;
      });
    }
  }

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
        const SnackBar(content: Text('Please enter pet name and breed'), behavior: SnackBarBehavior.floating),
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
        title: Text(isEditing ? 'Edit Profile' : 'Add New Pet', 
          style: GoogleFonts.fredoka(fontWeight: FontWeight.w700, fontSize: 20)),
        backgroundColor: Colors.transparent,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : Colors.black87, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 100), // Space for transparent app bar
            
            // ─── YOUR PETS SECTION ──────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text('Your Pets', 
                style: GoogleFonts.fredoka(
                  fontWeight: FontWeight.w600, 
                  fontSize: 18,
                  color: isDark ? Colors.white : Colors.black87
                )),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 110,
              child: pets.isEmpty 
              ? Center(child: Text('No pets found', style: TextStyle(color: Colors.grey[500])))
              : ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: pets.length,
                itemBuilder: (context, index) {
                  final p = pets[index];
                  final isCurrent = widget.petToEdit?.petID == p.petID;
                  return Padding(
                    padding: const EdgeInsets.only(right: 20),
                    child: Opacity(
                      opacity: isCurrent ? 1.0 : 0.4,
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isCurrent ? const Color(0xFF006684) : Colors.transparent, 
                                width: 2
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 28,
                              backgroundColor: AppColors.primary.withOpacity(0.08),
                              backgroundImage: p.photoUrl != null ? CachedNetworkImageProvider(p.photoUrl!) : null,
                              child: p.photoUrl == null ? const Icon(Icons.pets, color: AppColors.primary, size: 20) : null,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(p.name, 
                            style: TextStyle(
                              fontWeight: isCurrent ? FontWeight.w800 : FontWeight.w600, 
                              fontSize: 11,
                              color: isDark ? Colors.white : Colors.black87
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // ─── MAIN FORM SECTION (Removed outer card to fix "double border") ───
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('PET DETAILS', 
                    style: TextStyle(color: const Color(0xFF006684).withOpacity(0.7), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.5)),
                  const SizedBox(height: 32),

                  // Center Avatar Section
                  Center(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        GestureDetector(
                          onTap: _pickImage,
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: const BoxDecoration(color: Color(0xFFC5E1E9), shape: BoxShape.circle),
                            child: Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 4),
                                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
                              ),
                              child: CircleAvatar(
                                radius: 64,
                                backgroundColor: Colors.white,
                                backgroundImage: _selectedImageUrl.startsWith('http')
                                    ? CachedNetworkImageProvider(_selectedImageUrl) as ImageProvider
                                    : FileImage(File(_selectedImageUrl)),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              _pickImage();
                            },
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: const BoxDecoration(color: Color(0xFF006684), shape: BoxShape.circle),
                              child: const Icon(Icons.edit_rounded, color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),

                  _buildClinicalInput('Pet Name', _nameController, icon: Icons.pets_rounded, hint: 'e.g., Mini'),
                  const SizedBox(height: 24),
                  
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Expanded(child: _buildClinicalInput('Breed Type', _breedController, hint: 'e.g., Domestic Cat')),
                      const SizedBox(width: 14),
                      _buildScanAction(),
                    ],
                  ),
                  const SizedBox(height: 24),

                  Row(
                    children: [
                      Expanded(child: _buildClinicalDropdown('Gender')),
                      const SizedBox(width: 14),
                      Expanded(child: _buildClinicalDatePicker()),
                    ],
                  ),
                  const SizedBox(height: 24),

                  _buildReadOnlyClinical('Calculated Age', _calculateAge()),
                  const SizedBox(height: 24),

                  Row(
                    children: [
                      Expanded(child: _buildClinicalInput('Coat Color', _colorController, hint: 'Brown & white')),
                      const SizedBox(width: 14),
                      Expanded(child: _buildClinicalInput('Vocal Sound', _soundController, hint: 'Mini')),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: _buildClinicalInput('Height', _heightController, suffix: 'cm', hint: '10 inch')),
                      const SizedBox(width: 14),
                      Expanded(child: _buildClinicalInput('Weight', _weightController, suffix: 'kg', hint: '5kg')),
                    ],
                  ),
                  const SizedBox(height: 40),

                  Text('FEEDING SCHEDULE', 
                    style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1.5)),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _feedingTimes.map((t) => _buildClinicalTimeChip(t)).toList(),
                  ),
                  if (_feedingTimes.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text('No feeding routine established.', 
                        style: TextStyle(color: Colors.grey[500], fontSize: 13, fontWeight: FontWeight.w600, fontStyle: FontStyle.italic)),
                    ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Expanded(child: _buildActionButton(Icons.more_time_rounded, 'Add Time', _addTime)),
                      const SizedBox(width: 14),
                      Expanded(child: _buildActionButton(Icons.auto_awesome_rounded, 'AI Suggest', _aiSuggest)),
                    ],
                  ),
                  const SizedBox(height: 40),

                  _buildClinicalInput('Bio & Personality', _bioController, maxLines: 4, hint: 'Write a few words...'),
                  const SizedBox(height: 60),

                  SizedBox(
                    width: double.infinity,
                    height: 68,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _savePet,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF006684),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        elevation: 8,
                        shadowColor: const Color(0xFF006684).withOpacity(0.4),
                      ),
                      child: _isSaving 
                        ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 3)
                        : Text(isEditing ? 'UPDATE' : 'CREATE PROFILE',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildClinicalInput(String label, TextEditingController controller, {IconData? icon, String? suffix, int maxLines = 1, String? hint}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 10),
          child: Text(label.toUpperCase(), 
            style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white60 : Colors.black54, fontSize: 10, letterSpacing: 1.5)),
        ),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: isDark ? Colors.white24 : Colors.grey[400], fontSize: 14),
            prefixIcon: icon != null ? Icon(icon, size: 20, color: const Color(0xFF006684)) : null,
            suffixText: suffix,
            suffixStyle: TextStyle(color: const Color(0xFF006684).withOpacity(0.6), fontWeight: FontWeight.w800, fontSize: 12),
            filled: true,
            fillColor: isDark ? const Color(0xFF1A222D) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 22, horizontal: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.withOpacity(0.2), width: 1.5),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: BorderSide(color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.withOpacity(0.2), width: 1.5),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(20),
              borderSide: const BorderSide(color: Color(0xFF006684), width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildReadOnlyClinical(String label, String value) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 10),
          child: Text(label.toUpperCase(), 
            style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white60 : Colors.black54, fontSize: 10, letterSpacing: 1.5)),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF131921) : Colors.grey[100],
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.withOpacity(0.1), width: 1.5),
          ),
          child: Row(
            children: [
              const Icon(Icons.history_rounded, size: 20, color: Color(0xFF006684)),
              const SizedBox(width: 14),
              Text(value, style: TextStyle(color: isDark ? Colors.white70 : Colors.grey[600], fontWeight: FontWeight.w800, fontSize: 15)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildClinicalDropdown(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 10),
          child: Text(label.toUpperCase(), 
            style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white60 : Colors.black54, fontSize: 10, letterSpacing: 1.5)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1A222D) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.withOpacity(0.2), width: 1.5),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _gender,
              isExpanded: true,
              dropdownColor: isDark ? const Color(0xFF1A1A1A) : Colors.white,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF006684)),
              style: TextStyle(fontSize: 15, color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w700),
              items: ['Male', 'Female'].map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
              onChanged: (val) => setState(() => _gender = val!),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildClinicalDatePicker() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 10),
          child: Text('BIRTH DATE', 
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isDark ? Colors.white60 : Colors.black54, letterSpacing: 1.5)),
        ),
        GestureDetector(
          onTap: () async {
            HapticFeedback.selectionClick();
            final picked = await showDatePicker(
              context: context,
              initialDate: _dob ?? DateTime.now(),
              firstDate: DateTime(2000),
              lastDate: DateTime.now(),
            );
            if (picked != null) setState(() => _dob = picked);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A222D) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? Colors.white.withOpacity(0.1) : Colors.grey.withOpacity(0.2), width: 1.5),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_month_rounded, size: 20, color: Color(0xFF006684)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _dob == null ? 'Select' : DateFormat('yyyy-MM-dd').format(_dob!),
                    style: TextStyle(
                      fontSize: 14, 
                      fontWeight: FontWeight.w800, 
                      color: isDark ? Colors.white : Colors.black87,
                    ),
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

  Widget _buildScanAction() {
    return GestureDetector(
      onTap: () async {
        HapticFeedback.selectionClick();
        final breed = await Navigator.push(context, MaterialPageRoute(builder: (_) => const BreedFinderScreen()));
        if (breed != null) setState(() => _breedController.text = breed);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: const Color(0xFF006684).withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.auto_awesome_rounded, size: 18, color: Color(0xFF006684)),
            SizedBox(width: 10),
            Text('SCAN', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF006684), fontSize: 12, letterSpacing: 1.2)),
          ],
        ),
      ),
    );
  }

  Widget _buildClinicalTimeChip(String time) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFA8D5BA).withOpacity(0.4),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2D8C69).withOpacity(0.3), width: 1.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(time, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF2D8C69), fontSize: 13)),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: () {
              HapticFeedback.selectionClick();
              setState(() => _feedingTimes.remove(time));
            },
            child: const Icon(Icons.cancel_rounded, size: 18, color: Color(0xFF2D8C69)),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: const Color(0xFF006684)),
            const SizedBox(width: 10),
            Flexible(
              child: Text(
                label.toUpperCase(), 
                style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF006684), fontSize: 11, letterSpacing: 0.8),
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
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
            const SizedBox(width: 16),
            const Text('AI Optimization in progress...', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        behavior: SnackBarBehavior.floating,
      )
    );
    try {
      final suggested = await repo.runAiNutritionSchedule(
        petName: _nameController.text, breed: _breedController.text, 
        age: _calculateAge(), weight: _weightController.text
      );
      setState(() => _feedingTimes = suggested);
    } catch (_) {}
  }
}
