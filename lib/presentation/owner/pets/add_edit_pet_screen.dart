import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
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
  final _ageController = TextEditingController();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _colorController = TextEditingController();
  final _vaccinationController = TextEditingController();
  final _allergiesController = TextEditingController();
  final _foodNameController = TextEditingController();
  final _descriptionController = TextEditingController();

  String _gender = 'Male';
  String _selectedImageUrl = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop';

  @override
  void initState() {
    super.initState();
    if (widget.petToEdit != null) {
      final p = widget.petToEdit!;
      _nameController.text = p.name;
      _breedController.text = p.breed;
      _ageController.text = p.age;
      _weightController.text = p.weight;
      _heightController.text = p.height;
      _colorController.text = p.color;
      _vaccinationController.text = p.vaccinationDetails ?? '';
      _allergiesController.text = p.allergies ?? '';
      _foodNameController.text = p.currentFoodName ?? '';
      _descriptionController.text = p.description ?? '';
      _gender = p.gender;
      if (p.photoUrl != null) _selectedImageUrl = p.photoUrl!;
    }
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

    final repo = context.read<AppStateRepository>();
    final isEditing = widget.petToEdit != null;

    final pet = PetModel(
      petID: isEditing ? widget.petToEdit!.petID : 'pet_${const Uuid().v4().substring(0, 6)}',
      ownerID: repo.currentUser?.uid ?? 'owner_1',
      name: name,
      breed: breed,
      gender: _gender,
      age: _ageController.text.trim().isNotEmpty ? _ageController.text.trim() : '1 yr',
      dob: '2024-01-01',
      weight: _weightController.text.trim(),
      height: _heightController.text.trim(),
      color: _colorController.text.trim(),
      photoUrl: _selectedImageUrl,
      vaccinationDetails: _vaccinationController.text.trim(),
      allergies: _allergiesController.text.trim(),
      currentFoodName: _foodNameController.text.trim(),
      description: _descriptionController.text.trim(),
    );

    if (isEditing) {
      repo.updatePet(pet);
    } else {
      repo.addPet(pet);
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(isEditing ? 'Pet profile updated! 🎉' : 'Pet added successfully! 🐾'),
        backgroundColor: AppColors.healthGreen,
      ),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.petToEdit != null;
    final size = MediaQuery.of(context).size;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Profile' : 'Add New Pet'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(24, size.height * 0.12, 24, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pet Photo selector
            FadeInDown(
              child: Center(
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.2),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 64,
                        backgroundColor: AppColors.primaryLight.withOpacity(0.3),
                        backgroundImage: NetworkImage(_selectedImageUrl),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 4,
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),

            FadeInUp(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('BASIC INFORMATION', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary
                  )),
                  const SizedBox(height: 20),
                  _buildPremiumField(
                    controller: _nameController,
                    hintText: 'Pet Name (e.g. Milo)',
                    icon: Icons.pets_rounded,
                  ),
                  const SizedBox(height: 16),
                  _buildBreedField(),
                  const SizedBox(height: 24),

                  Text('DETAILS', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary
                  )),
                  const SizedBox(height: 20),
                  _buildGenderSelector(),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildPremiumField(
                          controller: _ageController,
                          hintText: 'Age (e.g. 2 yrs)',
                          icon: Icons.cake_rounded,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildPremiumField(
                          controller: _weightController,
                          hintText: 'Weight (e.g. 28kg)',
                          icon: Icons.monitor_weight_rounded,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildPremiumField(
                    controller: _colorController,
                    hintText: 'Color / Markings',
                    icon: Icons.palette_rounded,
                  ),
                  const SizedBox(height: 32),

                  Text('HEALTH & NUTRITION', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary
                  )),
                  const SizedBox(height: 20),
                  _buildPremiumField(
                    controller: _vaccinationController,
                    hintText: 'Vaccination History',
                    icon: Icons.verified_user_rounded,
                  ),
                  const SizedBox(height: 16),
                  _buildPremiumField(
                    controller: _allergiesController,
                    hintText: 'Known Allergies',
                    icon: Icons.warning_amber_rounded,
                  ),
                  const SizedBox(height: 16),
                  _buildPremiumField(
                    controller: _foodNameController,
                    hintText: 'Daily Diet / Favorite Food',
                    icon: Icons.restaurant_rounded,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 48),

            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _savePet,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: Text(
                    isEditing ? 'SAVE CHANGES' : 'CREATE PET PROFILE',
                    style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumField({
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
  }) {
    return PremiumCard(
      opacity: 0.15,
      borderRadius: 20,
      child: TextField(
        controller: controller,
        style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary.withOpacity(0.6)),
          prefixIcon: Icon(icon, color: AppColors.primary, size: 22),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        ),
      ),
    );
  }

  Widget _buildBreedField() {
    return Row(
      children: [
        Expanded(
          child: _buildPremiumField(
            controller: _breedController,
            hintText: 'Breed',
            icon: Icons.info_outline_rounded,
          ),
        ),
        const SizedBox(width: 12),
        PremiumCard(
          onTap: () async {
            final breed = await Navigator.push(context, MaterialPageRoute(builder: (_) => const BreedFinderScreen()));
            if (breed != null) setState(() => _breedController.text = breed);
          },
          useGlass: false,
          borderRadius: 20,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 28),
          ),
        ),
      ],
    );
  }

  Widget _buildGenderSelector() {
    return Row(
      children: [
        Expanded(child: _buildGenderCard('Male', Icons.male_rounded, AppColors.primary)),
        const SizedBox(width: 12),
        Expanded(child: _buildGenderCard('Female', Icons.female_rounded, AppColors.secondary)),
      ],
    );
  }

  Widget _buildGenderCard(String label, IconData icon, Color color) {
    final isSelected = _gender == label;
    return PremiumCard(
      onTap: () => setState(() => _gender = label),
      opacity: isSelected ? 0.3 : 0.1,
      borderRadius: 20,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: isSelected ? color : AppColors.textTertiary, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: AppTypography.titleMedium.copyWith(
                fontSize: 14, 
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? color : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
