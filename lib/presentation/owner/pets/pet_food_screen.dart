import 'package:flutter/material.dart';
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

  @override
  Widget build(BuildContext context) {
    final pet = context.select((AppStateRepository repo) => 
      repo.pets.firstWhere((p) => p.petID == widget.petId));
    
    return GlassScaffold(
      appBar: AppBar(
        title: Text('${pet.name}\'s Nutrition'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Diet Summary
            FadeInUp(
              child: PremiumCard(
                opacity: 0.3,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.restaurant_rounded, color: AppColors.primary, size: 28),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('CURRENT DIET', style: AppTypography.labelSmall.copyWith(
                                  fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 0.8
                                )),
                                const SizedBox(height: 4),
                                Text(pet.currentFoodName ?? 'Not configured', 
                                  style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 20)),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit_note_rounded, size: 24, color: AppColors.primary),
                            onPressed: () => _showEditDietDialog(context, pet),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _buildNutritionProgress(pet),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Feeding Schedule
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Feeding Schedule', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700)),
                  IconButton(
                    icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary, size: 28),
                    onPressed: () => _showAddTimeDialog(context, pet),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (pet.feedingTimes.isEmpty)
              Padding(
                padding: const EdgeInsets.all(20),
                child: Center(
                  child: Text('No feeding times added yet.', 
                    style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
                ),
              )
            else
              ...pet.feedingTimes.map((time) => FadeInLeft(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: PremiumCard(
                    opacity: 0.1,
                    borderRadius: 20,
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.05),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.access_time_filled_rounded, color: AppColors.primary, size: 20),
                      ),
                      title: Text(time, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700)),
                      trailing: IconButton(
                        icon: const Icon(Icons.remove_circle_outline_rounded, color: AppColors.dangerRed, size: 20),
                        onPressed: () => _removeFeedingTime(context, pet, time),
                      ),
                    ),
                  ),
                ),
              )),
            
            const SizedBox(height: 40),
            
            // Quick Action: Feed Now
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: PremiumCard(
                useGlass: false,
                onTap: () => _feedPetNow(context, pet),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.healthGreen, Color(0xFF43A047)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.healthGreen.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.pets_rounded, color: Colors.white),
                      const SizedBox(width: 12),
                      Text(
                        'FEED ${pet.name.toUpperCase()} NOW',
                        style: AppTypography.titleMedium.copyWith(
                          color: Colors.white, fontWeight: FontWeight.w700, letterSpacing: 0.8
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Center(
              child: Text(
                pet.lastFedTime != null 
                  ? 'Last fed today at ${pet.lastFedTime}' 
                  : 'Hasn\'t been fed today yet',
                style: AppTypography.bodyMedium.copyWith(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildNutritionProgress(PetModel pet) {
    // Simulated intake for demo
    double progress = pet.hungerStatus == 'Full' ? 1.0 : 0.6;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Daily Goal: ${pet.dailyCalorieGoal} kcal', 
              style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
            Text('${(progress * 100).toInt()}%', 
              style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary)),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 12,
            backgroundColor: AppColors.primary.withOpacity(0.05),
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
          ),
        ),
      ],
    );
  }

  void _showEditDietDialog(BuildContext context, PetModel pet) {
    _foodNameController.text = pet.currentFoodName ?? '';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Diet'),
        content: TextField(
          controller: _foodNameController,
          decoration: const InputDecoration(labelText: 'Food Name'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              context.read<AppStateRepository>().updatePetNutrition(
                petId: pet.petID,
                currentFoodName: _foodNameController.text,
              );
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showAddTimeDialog(BuildContext context, PetModel pet) async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time != null && mounted) {
      final formattedTime = time.format(context);
      final newTimes = List<String>.from(pet.feedingTimes)..add(formattedTime);
      newTimes.sort();
      context.read<AppStateRepository>().updatePetNutrition(
        petId: pet.petID,
        feedingTimes: newTimes,
      );
    }
  }

  void _removeFeedingTime(BuildContext context, PetModel pet, String time) {
    final newTimes = List<String>.from(pet.feedingTimes)..remove(time);
    context.read<AppStateRepository>().updatePetNutrition(
      petId: pet.petID,
      feedingTimes: newTimes,
    );
  }

  void _feedPetNow(BuildContext context, PetModel pet) {
    final now = DateFormat('hh:mm a').format(DateTime.now());
    context.read<AppStateRepository>().updatePetNutrition(
      petId: pet.petID,
      hungerStatus: 'Full',
      lastFedTime: now,
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Yum! ${pet.name} has been fed.')),
    );
  }
}
