import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class PetFoodScreen extends StatefulWidget {
  final String petId;
  const PetFoodScreen({super.key, required this.petId});

  @override
  State<PetFoodScreen> createState() => _PetFoodScreenState();
}

class _PetFoodScreenState extends State<PetFoodScreen> {
  final _foodNameController = TextEditingController();
  String? _selectedFoodType;
  bool _isSaving = false;

  final List<String> _foodTypes = ['Dry Food', 'Wet Food', 'Raw Food', 'Mixed', 'Prescription Diet'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pet = context.read<AppStateRepository>().pets.firstWhere((p) => p.petID == widget.petId);
      setState(() {
        _foodNameController.text = pet.currentFoodName ?? '';
        _selectedFoodType = pet.foodType;
      });
    });
  }

  @override
  void dispose() {
    _foodNameController.dispose();
    super.dispose();
  }

  Future<void> _saveDietDetails() async {
    setState(() => _isSaving = true);
    await context.read<AppStateRepository>().updatePetNutrition(
      petId: widget.petId,
      currentFoodName: _foodNameController.text.trim(),
      foodType: _selectedFoodType,
    );
    if (mounted) {
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Diet details saved! ✨'), backgroundColor: AppColors.healthGreen),
      );
    }
  }

  void _addMeal() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time != null && mounted) {
      final pet = context.read<AppStateRepository>().pets.firstWhere((p) => p.petID == widget.petId);
      final formattedTime = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      final newTimes = List<String>.from(pet.feedingTimes)..add(formattedTime);
      newTimes.sort();
      context.read<AppStateRepository>().updatePetNutrition(
        petId: widget.petId,
        feedingTimes: newTimes,
      );
    }
  }

  void _removeMeal(String time) {
    final pet = context.read<AppStateRepository>().pets.firstWhere((p) => p.petID == widget.petId);
    final newTimes = List<String>.from(pet.feedingTimes)..remove(time);
    context.read<AppStateRepository>().updatePetNutrition(
      petId: widget.petId,
      feedingTimes: newTimes,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pet = context.watch<AppStateRepository>().pets.firstWhere((p) => p.petID == widget.petId);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('${pet.name}\'s Nutrition'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Current Diet Section
            FadeInDown(
              child: PremiumCard(
                opacity: 0.2,
                borderRadius: 28,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Current Diet', style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 20),
                      _buildTextField('Food Name / Brand', _foodNameController),
                      const SizedBox(height: 16),
                      _buildDropdownField('Food Type', _selectedFoodType, (val) => setState(() => _selectedFoodType = val)),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _saveDietDetails,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF006684),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                          child: _isSaving 
                            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Save Diet Details', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // 2. Meal Schedule Section
            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Text('Meal Schedule', style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(height: 16),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 28,
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 10,
                            runSpacing: 12,
                            children: pet.feedingTimes.map((time) => _buildMealChip(time)).toList(),
                          ),
                          if (pet.feedingTimes.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              child: Center(child: Text('No meals scheduled', style: TextStyle(color: Colors.grey[500]))),
                            ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(
                                child: _buildActionButton(
                                  icon: Icons.add,
                                  label: 'Add Meal',
                                  onTap: _addMeal,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _buildActionButton(
                                  icon: Icons.auto_awesome_rounded,
                                  label: 'AI Schedule',
                                  onTap: () async {
                                    final repo = context.read<AppStateRepository>();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Generating smart schedule... 🪄'), duration: Duration(seconds: 2)),
                                    );
                                    
                                    try {
                                      final suggestedTimes = await repo.runAiNutritionSchedule(
                                        petName: pet.name,
                                        breed: pet.breed,
                                        age: pet.age,
                                        weight: pet.weight,
                                      );
                                      
                                      if (mounted) {
                                        showDialog(
                                          context: context,
                                          builder: (ctx) => AlertDialog(
                                            title: const Text('AI Suggested Schedule'),
                                            content: Text('The AI suggests feeding times at: ${suggestedTimes.join(', ')}. Would you like to apply this?'),
                                            actions: [
                                              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                              TextButton(
                                                onPressed: () {
                                                  repo.updatePetNutrition(petId: pet.petID, feedingTimes: suggestedTimes);
                                                  Navigator.pop(ctx);
                                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Schedule updated! ✨')));
                                                }, 
                                                child: const Text('Apply'),
                                              ),
                                            ],
                                          ),
                                        );
                                      }
                                    } catch (e) {
                                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // 3. AI Nutritional Recommendation Section
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Text('AI Nutritional Recommendation', style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700)),
                  ),
                  const SizedBox(height: 16),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 28,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                final repo = context.read<AppStateRepository>();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Analyzing profile and generating guide... 🧠'), duration: Duration(seconds: 2)),
                                );
                                
                                try {
                                  final Map<String, dynamic> guide = await repo.runAiNutritionRecommendation(
                                    petName: pet.name,
                                    breed: pet.breed,
                                    age: pet.age,
                                    weight: pet.weight,
                                    currentDiet: pet.currentFoodName,
                                  );
                                  
                                  if (mounted) {
                                    showModalBottomSheet(
                                      context: context,
                                      isScrollControlled: true,
                                      backgroundColor: Colors.transparent,
                                      builder: (ctx) => _buildExpertGuideSheet(context, pet.name, guide),
                                    );
                                  }
                                } catch (e) {
                                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF006684),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              icon: const Icon(Icons.pets_rounded, color: Colors.white, size: 20),
                              label: const Text('Generate Expert Guide', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Tap above to get a professional dietary plan based on your pet\'s profile.',
                            textAlign: TextAlign.center,
                            style: AppTypography.bodySmall.copyWith(color: isDark ? Colors.white60 : Colors.grey[600], height: 1.4),
                          ),
                        ],
                      ),
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

  Widget _buildExpertGuideSheet(BuildContext context, String petName, Map<String, dynamic> guide) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final nutrients = List<String>.from(guide['nutrients'] ?? []);
    final recommendations = List<String>.from(guide['recommendations'] ?? []);

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withOpacity(0.2), borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 24),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                child: const Icon(Icons.auto_awesome_rounded, color: AppColors.primary, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Expert Nutrition Guide', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800, fontSize: 22)),
                    Text('Tailored for $petName', style: AppTypography.bodyMedium.copyWith(color: Colors.grey[500], fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Calories Card
                  _buildGuideSection(
                    context, 
                    'Daily Caloric Goal', 
                    guide['calories'] ?? 'Not specified', 
                    Icons.bolt_rounded, 
                    const Color(0xFFFFF4E8), 
                    const Color(0xFFD98C4F)
                  ),
                  const SizedBox(height: 24),

                  // 2. Nutrients
                  _buildSectionHeader('Essential Nutrients'),
                  const SizedBox(height: 12),
                  ...nutrients.map((n) => _buildBulletPoint(context, n, Icons.check_circle_outline_rounded, AppColors.healthGreen)),
                  const SizedBox(height: 32),

                  // 3. Expert Tips
                  _buildSectionHeader('Expert Recommendations'),
                  const SizedBox(height: 12),
                  ...recommendations.map((r) => _buildBulletPoint(context, r, Icons.lightbulb_outline_rounded, AppColors.accentAmber)),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF006684),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                child: const Text('GOT IT, THANKS!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: AppColors.primary, letterSpacing: 1.2));
  }

  Widget _buildGuideSection(BuildContext context, String title, String content, IconData icon, Color bgColor, Color iconColor) {
    return PremiumCard(
      opacity: 0.1,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(content, style: AppTypography.bodyMedium.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant, height: 1.4)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(BuildContext context, String text, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: AppTypography.bodyLarge.copyWith(height: 1.4, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Widget _buildTextField(String hint, TextEditingController controller) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          border: InputBorder.none,
          hintStyle: const TextStyle(fontSize: 14, color: Colors.grey),
        ),
      ),
    );
  }

  Widget _buildDropdownField(String hint, String? value, Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          hint: Text(hint, style: const TextStyle(fontSize: 14, color: Colors.grey)),
          items: _foodTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildMealChip(String time) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFA8D5BA).withOpacity(0.4), // Light green tint
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2D8C69).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(time, style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF2D8C69), fontSize: 13)),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => _removeMeal(time),
            child: const Icon(Icons.close_rounded, size: 16, color: Color(0xFF2D8C69)),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({required IconData icon, required String label, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE), // Light teal tint
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: const Color(0xFF006684)),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF006684), fontSize: 13)),
          ],
        ),
      ),
    );
  }
}
