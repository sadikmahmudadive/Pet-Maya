import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';

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
      HapticFeedback.mediumImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Diet details saved! ✨'), backgroundColor: AppColors.healthGreen, behavior: SnackBarBehavior.floating),
      );
    }
  }

  void _addMeal() async {
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.now());
    if (time != null && mounted) {
      final pet = context.read<AppStateRepository>().pets.firstWhere((p) => p.petID == widget.petId);
      final formattedTime = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      final newTimes = List<String>.from(pet.feedingTimes)..add(formattedTime);
      newTimes.sort();
      context.read<AppStateRepository>().updatePetNutrition(petId: widget.petId, feedingTimes: newTimes);
    }
  }

  void _removeMeal(String time) {
    final pet = context.read<AppStateRepository>().pets.firstWhere((p) => p.petID == widget.petId);
    final newTimes = List<String>.from(pet.feedingTimes)..remove(time);
    context.read<AppStateRepository>().updatePetNutrition(petId: widget.petId, feedingTimes: newTimes);
  }

  @override
  Widget build(BuildContext context) {
    final pet = context.watch<AppStateRepository>().pets.firstWhere((p) => p.petID == widget.petId);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('${pet.name}\'s Nutrition', style: const TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeInDown(
              child: PremiumCard(
                opacity: 0.1,
                borderRadius: 32,
                backgroundColor: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFEDF4F8),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('CURRENT DIET', style: TextStyle(color: const Color(0xFF006684), fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.5)),
                      const SizedBox(height: 32),
                      _buildCleanInput('Food Name / Brand', _foodNameController, hint: 'e.g., Royal Canin'),
                      const SizedBox(height: 24),
                      _buildDropdownField('Food Type', _selectedFoodType, (val) => setState(() => _selectedFoodType = val)),
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        height: 60,
                        child: ElevatedButton(
                          onPressed: _isSaving ? null : _saveDietDetails,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF006684),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 8,
                            shadowColor: const Color(0xFF006684).withOpacity(0.4),
                          ),
                          child: _isSaving 
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('SAVE DIET DETAILS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),

            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Text('Meal Schedule', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 16),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 32,
                    backgroundColor: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFF9F5FB),
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
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              child: Center(child: Text('No meals scheduled', style: TextStyle(color: Colors.grey[500], fontWeight: FontWeight.w600))),
                            ),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(child: _buildActionButton(Icons.add_rounded, 'Add Time', _addMeal)),
                              const SizedBox(width: 12),
                              Expanded(child: _buildActionButton(Icons.auto_awesome_rounded, 'AI Suggest', _aiSuggest)),
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

            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 4),
                    child: Text('AI Nutritional Recommendation', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 16),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 32,
                    backgroundColor: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFEDF4F8),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          SizedBox(
                            width: double.infinity,
                            height: 60,
                            child: ElevatedButton.icon(
                              onPressed: _runAiRecommendation,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF006684),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              icon: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 20),
                              label: const Text('GENERATE EXPERT GUIDE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Tap above to get a professional dietary plan based on your pet\'s profile.',
                            textAlign: TextAlign.center,
                            style: AppTypography.bodySmall.copyWith(color: Colors.grey[500], height: 1.4, fontWeight: FontWeight.w600),
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

  Widget _buildCleanInput(String label, TextEditingController controller, {String? hint}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1.2)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: TextField(
            controller: controller,
            style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87, fontSize: 15),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white24 : Colors.grey[400]),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 18),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdownField(String label, String? value, Function(String?) onChanged) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1.2)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
            borderRadius: BorderRadius.circular(16),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: isDark ? const Color(0xFF1A1A1A) : Colors.white,
              hint: Text('Select Type', style: TextStyle(fontSize: 14, color: isDark ? Colors.white24 : Colors.grey[400])),
              items: _foodTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontWeight: FontWeight.w700)))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMealChip(String time) {
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
            onTap: () => _removeMeal(time),
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
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFD1E6EE),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: const Color(0xFF006684)),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label, 
                style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF006684), fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _aiSuggest() async {
    final repo = context.read<AppStateRepository>();
    final pet = repo.pets.firstWhere((p) => p.petID == widget.petId);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Consulting AI Nutritionist... 🪄'), behavior: SnackBarBehavior.floating));
    try {
      final suggested = await repo.runAiNutritionSchedule(petName: pet.name, breed: pet.breed, age: pet.age, weight: pet.weight);
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            title: const Text('AI Suggested Schedule'),
            content: Text('The AI suggests feeding times at: ${suggested.join(', ')}. Would you like to apply this?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () {
                  repo.updatePetNutrition(petId: widget.petId, feedingTimes: suggested);
                  Navigator.pop(ctx);
                }, 
                child: const Text('Apply'),
              ),
            ],
          ),
        );
      }
    } catch (_) {}
  }

  void _runAiRecommendation() async {
    final repo = context.read<AppStateRepository>();
    final pet = repo.pets.firstWhere((p) => p.petID == widget.petId);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Analyzing nutritional needs... 🧠'), behavior: SnackBarBehavior.floating));
    
    try {
      final guide = await repo.runAiNutritionRecommendation(petName: pet.name, breed: pet.breed, age: pet.age, weight: pet.weight, currentDiet: pet.currentFoodName);
      if (mounted) {
        _showExpertGuideSheet(context, pet.name, guide);
      }
    } catch (_) {}
  }

  void _showExpertGuideSheet(BuildContext context, String petName, Map<String, dynamic> guide) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildExpertGuideSheet(context, petName, guide),
    );
  }

  Widget _buildExpertGuideSheet(BuildContext context, String petName, Map<String, dynamic> guide) {
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
                    Text('Expert Nutrition Guide', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w900, fontSize: 22)),
                    Text('Tailored for $petName', style: AppTypography.bodyMedium.copyWith(color: Colors.grey[500], fontWeight: FontWeight.w700)),
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
                  _buildGuideSection(context, 'Daily Caloric Goal', guide['calories'] ?? 'N/A', Icons.bolt_rounded, const Color(0xFFD98C4F)),
                  const SizedBox(height: 32),
                  _buildSectionHeader('Essential Nutrients'),
                  const SizedBox(height: 16),
                  ...nutrients.map((n) => _buildBulletPoint(n, Icons.check_circle_outline_rounded, AppColors.healthGreen)),
                  const SizedBox(height: 32),
                  _buildSectionHeader('Expert Recommendations'),
                  const SizedBox(height: 16),
                  ...recommendations.map((r) => _buildBulletPoint(r, Icons.lightbulb_outline_rounded, AppColors.accentAmber)),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: SizedBox(
              width: double.infinity,
              height: 64,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF006684), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18))),
                child: const Text('GOT IT, THANKS!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: AppColors.primary, letterSpacing: 1.5));
  }

  Widget _buildGuideSection(BuildContext context, String title, String content, IconData icon, Color color) {
    return PremiumCard(
      opacity: 0.1,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(content, style: AppTypography.bodyMedium.copyWith(color: Colors.grey[600], height: 1.4, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBulletPoint(String text, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 16),
          Expanded(child: Text(text, style: const TextStyle(height: 1.5, fontWeight: FontWeight.w700, fontSize: 14))),
        ],
      ),
    );
  }
}
