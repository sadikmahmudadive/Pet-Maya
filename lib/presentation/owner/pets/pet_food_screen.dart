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

  final List<String> _foodTypes = [
    'Dry Food',
    'Wet Food',
    'Raw Food',
    'Mixed',
    'Prescription Diet',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pet = context.read<AppStateRepository>().pets.firstWhere(
        (p) => p.petID == widget.petId,
      );
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
        const SnackBar(
          content: Text('Diet details saved! ✨'),
          backgroundColor: AppColors.healthGreen,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _addMeal() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time != null && mounted) {
      final pet = context.read<AppStateRepository>().pets.firstWhere(
        (p) => p.petID == widget.petId,
      );
      final formattedTime =
          '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
      final newTimes = List<String>.from(pet.feedingTimes)..add(formattedTime);
      newTimes.sort();
      context.read<AppStateRepository>().updatePetNutrition(
        petId: widget.petId,
        feedingTimes: newTimes,
      );
    }
  }

  void _removeMeal(String time) {
    final pet = context.read<AppStateRepository>().pets.firstWhere(
      (p) => p.petID == widget.petId,
    );
    final newTimes = List<String>.from(pet.feedingTimes)..remove(time);
    context.read<AppStateRepository>().updatePetNutrition(
      petId: widget.petId,
      feedingTimes: newTimes,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pet = context.watch<AppStateRepository>().pets.firstWhere(
      (p) => p.petID == widget.petId,
    );

    return GlassScaffold(
      // Keep content below the app bar so it never scrolls under the title/status bar.
      extendBodyBehindAppBar: false,
      appBar: AppBar(
        title: Text(
          '${pet.name}\'s Nutrition',
          style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeInDown(
              child: _buildSection(
                'Current Diet',
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldLabel('Food Name / Brand'),
                    TextField(
                      controller: _foodNameController,
                      style: _fieldTextStyle(),
                      decoration: _fieldDecoration('e.g., Royal Canin'),
                    ),
                    const SizedBox(height: 20),
                    _buildFieldLabel('Food Type'),
                    DropdownButtonFormField<String>(
                      // Re-key once the saved value loads (initialValue is read once).
                      key: ValueKey(_selectedFoodType),
                      initialValue: _foodTypes.contains(_selectedFoodType)
                          ? _selectedFoodType
                          : null,
                      isExpanded: true,
                      icon: const Icon(Icons.keyboard_arrow_down_rounded),
                      borderRadius: BorderRadius.circular(_fieldRadius),
                      dropdownColor: _isDark
                          ? AppColors.surfaceContainerDark
                          : AppColors.surface,
                      style: _fieldTextStyle(),
                      decoration: _fieldDecoration('Select type'),
                      items: _foodTypes
                          .map(
                            (t) => DropdownMenuItem(value: t, child: Text(t)),
                          )
                          .toList(),
                      onChanged: (val) =>
                          setState(() => _selectedFoodType = val),
                    ),
                    const SizedBox(height: 24),
                    _buildPrimaryButton(
                      label: 'Save Diet Details',
                      icon: Icons.check_rounded,
                      loading: _isSaving,
                      onPressed: _isSaving ? null : _saveDietDetails,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: _buildSection(
                'Meal Schedule',
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ...pet.feedingTimes.map(
                      (time) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _buildMealChip(time),
                      ),
                    ),
                    if (pet.feedingTimes.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        child: Center(
                          child: Text(
                            'No meals scheduled',
                            style: AppTypography.bodyMedium.copyWith(
                              color: _mutedColor,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionButton(
                            Icons.add_rounded,
                            'Add Time',
                            _addMeal,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildActionButton(
                            Icons.auto_awesome_rounded,
                            'AI Suggest',
                            _aiSuggest,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: _buildSection(
                'AI Nutritional Recommendation',
                Column(
                  children: [
                    _buildPrimaryButton(
                      label: 'Ask AI Expert',
                      icon: Icons.auto_awesome_rounded,
                      onPressed: _runAiRecommendation,
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Tap above to get a professional dietary plan based on your pet\'s profile.',
                      textAlign: TextAlign.center,
                      style: AppTypography.bodySmall.copyWith(
                        color: _mutedColor,
                        height: 1.4,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 60),
          ],
        ),
      ),
    );
  }

  // ── Shared styling: every block on this screen uses these ──────────

  static const double _cardRadius = 28;
  static const double _fieldRadius = 16;

  bool get _isDark => Theme.of(context).brightness == Brightness.dark;

  Color get _mutedColor =>
      _isDark ? AppColors.textSecondaryDark : AppColors.textSecondary;

  Widget _buildSection(String title, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4),
          child: Text(
            title,
            style: AppTypography.titleLarge.copyWith(
              fontWeight: FontWeight.w800,
              color: _isDark
                  ? AppColors.textPrimaryDark
                  : AppColors.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 12),
        PremiumCard(
          opacity: 0.1,
          borderRadius: _cardRadius,
          child: Padding(padding: const EdgeInsets.all(20), child: child),
        ),
      ],
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontWeight: FontWeight.w800,
          color: _mutedColor,
          fontSize: 10.5,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  TextStyle _fieldTextStyle() => TextStyle(
    fontWeight: FontWeight.w700,
    color: _isDark ? Colors.white : Colors.black87,
    fontSize: 15,
  );

  InputDecoration _fieldDecoration(String hint) {
    OutlineInputBorder border(Color color, [double width = 1]) =>
        OutlineInputBorder(
          borderRadius: BorderRadius.circular(_fieldRadius),
          borderSide: BorderSide(color: color, width: width),
        );
    final idle = _isDark ? AppColors.borderDark : AppColors.borderLight;
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: _isDark ? Colors.white38 : Colors.grey[400],
      ),
      filled: true,
      fillColor: _isDark
          ? Colors.white.withValues(alpha: 0.05)
          : Colors.white.withValues(alpha: 0.8),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 18),
      border: border(idle),
      enabledBorder: border(idle),
      focusedBorder: border(AppColors.primary, 1.5),
    );
  }

  Widget _buildPrimaryButton({
    required String label,
    required IconData icon,
    required VoidCallback? onPressed,
    bool loading = false,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(_fieldRadius),
          ),
          elevation: 0,
        ),
        icon: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              )
            : Icon(icon, color: Colors.white, size: 20),
        label: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: 15,
            letterSpacing: 0.3,
          ),
        ),
      ),
    );
  }

  Widget _buildMealChip(String time) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 6, 4, 6),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: _isDark ? 0.14 : 0.1),
        borderRadius: BorderRadius.circular(_fieldRadius),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.schedule_rounded,
            size: 18,
            color: _isDark ? AppColors.primary : AppColors.primaryDark,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              time,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: _isDark ? AppColors.primary : AppColors.primaryDark,
                fontSize: 13,
                height: 1.35,
              ),
            ),
          ),
          IconButton(
            onPressed: () => _removeMeal(time),
            tooltip: 'Remove',
            visualDensity: VisualDensity.compact,
            icon: Icon(
              Icons.close_rounded,
              size: 18,
              color: _isDark ? AppColors.primary : AppColors.primaryDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(IconData icon, String label, VoidCallback onTap) {
    return SizedBox(
      height: 48,
      child: OutlinedButton.icon(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          backgroundColor: AppColors.primary.withValues(alpha: 0.06),
          side: BorderSide(color: AppColors.primary.withValues(alpha: 0.35)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(_fieldRadius),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 8),
        ),
        icon: Icon(icon, size: 18),
        label: Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }

  void _aiSuggest() async {
    final repo = context.read<AppStateRepository>();
    final pet = repo.pets.firstWhere((p) => p.petID == widget.petId);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Consulting AI Nutritionist... 🪄'),
        behavior: SnackBarBehavior.floating,
      ),
    );
    try {
      final suggested = await repo.runAiNutritionSchedule(
        petName: pet.name,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight,
      );
      if (mounted) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            title: const Text('AI Suggested Schedule'),
            content: Text(
              'The AI suggests feeding times at: ${suggested.join(', ')}. Would you like to apply this?',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () {
                  repo.updatePetNutrition(
                    petId: widget.petId,
                    feedingTimes: suggested,
                  );
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
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Analyzing nutritional needs... 🧠'),
        behavior: SnackBarBehavior.floating,
      ),
    );

    try {
      final guide = await repo.runAiNutritionRecommendation(
        petName: pet.name,
        breed: pet.breed,
        age: pet.age,
        weight: pet.weight,
        currentDiet: pet.currentFoodName,
      );
      if (mounted) {
        _showExpertGuideSheet(context, pet.name, guide);
      }
    } catch (_) {}
  }

  void _showExpertGuideSheet(
    BuildContext context,
    String petName,
    Map<String, dynamic> guide,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _buildExpertGuideSheet(context, petName, guide),
    );
  }

  Widget _buildExpertGuideSheet(
    BuildContext context,
    String petName,
    Map<String, dynamic> guide,
  ) {
    final nutrients =
        (guide['nutrients'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];
    final recommendations =
        (guide['recommendations'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];
    final rawCalories = guide['calories']?.toString() ?? 'N/A';
    final caloriesStr =
        (rawCalories.toLowerCase().contains('kcal') ||
            rawCalories.toLowerCase().contains('cal') ||
            rawCalories == 'N/A')
        ? rawCalories
        : '$rawCalories kcal/day';

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
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(
                  Icons.auto_awesome_rounded,
                  color: AppColors.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Expert Nutrition Guide',
                      style: AppTypography.titleLarge.copyWith(
                        fontWeight: FontWeight.w900,
                        fontSize: 22,
                      ),
                    ),
                    Text(
                      'Tailored for $petName',
                      style: AppTypography.bodyMedium.copyWith(
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w700,
                      ),
                    ),
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
                  _buildGuideSection(
                    context,
                    'Daily Caloric Goal',
                    caloriesStr,
                    Icons.bolt_rounded,
                    const Color(0xFFD98C4F),
                  ),
                  const SizedBox(height: 32),
                  _buildSectionHeader('Essential Nutrients'),
                  const SizedBox(height: 16),
                  ...nutrients.map(
                    (n) => _buildBulletPoint(
                      n,
                      Icons.check_circle_outline_rounded,
                      AppColors.healthGreen,
                    ),
                  ),
                  const SizedBox(height: 32),
                  _buildSectionHeader('Expert Recommendations'),
                  const SizedBox(height: 16),
                  ...recommendations.map(
                    (r) => _buildBulletPoint(
                      r,
                      Icons.lightbulb_outline_rounded,
                      AppColors.accentAmber,
                    ),
                  ),
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
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1AB680),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
                child: const Text(
                  'Got it, thanks!',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: const TextStyle(
        fontWeight: FontWeight.w900,
        fontSize: 11,
        color: AppColors.primary,
        letterSpacing: 1.5,
      ),
    );
  }

  Widget _buildGuideSection(
    BuildContext context,
    String title,
    String content,
    IconData icon,
    Color color,
  ) {
    return PremiumCard(
      opacity: 0.1,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    content,
                    style: AppTypography.bodyMedium.copyWith(
                      color: Colors.grey[600],
                      height: 1.4,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
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
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                height: 1.5,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
