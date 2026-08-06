import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/status_chip.dart';
import '../../common_widgets/premium_card.dart';
import 'add_edit_pet_screen.dart';
import 'pet_food_screen.dart';
import 'pet_health_tracker_screen.dart';

class PetDetailsScreen extends StatelessWidget {
  final String petId;

  const PetDetailsScreen({super.key, required this.petId});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final pet = state.pets.firstWhere((p) => p.petID == petId, orElse: () => state.pets.first);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          // Parallax Header for Pet Profile
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new_rounded, color: Theme.of(context).colorScheme.onPrimary),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    pet.photoUrl ?? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800',
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.black26, Colors.transparent, Colors.black45],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: Icon(Icons.edit_rounded, color: Theme.of(context).colorScheme.onPrimary),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AddEditPetScreen(petToEdit: pet))),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Container(
              transform: Matrix4.translationValues(0, -30, 0),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(pet.name, style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 32, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 4),
                            Text(pet.breed, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                      StatusChip.health(pet.healthIndex),
                    ],
                  ),
                  const SizedBox(height: 32),
                  
                  // Stats Row
                  Row(
                    children: [
                      Expanded(child: _buildInfoCard(context, 'AGE', pet.age, Icons.cake_rounded, AppColors.primary)),
                      const SizedBox(width: 10),
                      Expanded(child: _buildInfoCard(context, 'WEIGHT', pet.weight, Icons.monitor_weight_rounded, AppColors.healthGreen)),
                      const SizedBox(width: 10),
                      Expanded(child: _buildInfoCard(context, 'GENDER', pet.gender, pet.gender == 'Male' ? Icons.male_rounded : Icons.female_rounded, AppColors.accentAmber)),
                    ],
                  ),
                  const SizedBox(height: 40),

                  Text('About ${pet.name}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  const SizedBox(height: 12),
                  Text(
                    pet.description ?? "No description available for this pet yet. Add some notes about their personality!",
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.7, fontSize: 15),
                  ),
                  const SizedBox(height: 40),

                  Text('Medical & Wellness', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  const SizedBox(height: 16),
                  _buildMedicalTile(
                    context,
                    'Health Records', 
                    'Vault of clinical history', 
                    Icons.health_and_safety_rounded,
                    AppColors.primary,
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetHealthTrackerScreen(petId: pet.petID))),
                  ),
                  _buildMedicalTile(
                    context,
                    'Diet & Nutrition', 
                    pet.currentFoodName ?? 'Not configured', 
                    Icons.restaurant_rounded,
                    AppColors.healthGreen,
                    () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetFoodScreen(petId: pet.petID))),
                  ),
                  
                  const SizedBox(height: 48),
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: OutlinedButton.icon(
                      onPressed: () {
                        context.read<AppStateRepository>().deletePet(pet.petID);
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.delete_outline_rounded, size: 20),
                      label: Text('REMOVE ${pet.name.toUpperCase()} PROFILE', style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.dangerRed,
                        side: const BorderSide(color: AppColors.dangerRed, width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withOpacity(0.15), width: 1.5),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(value, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _buildMedicalTile(BuildContext context, String title, String subtitle, IconData icon, Color color, VoidCallback? onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: PremiumCard(
        onTap: onTap,
        opacity: 0.1,
        borderRadius: 24,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 13)),
                  ],
                ),
              ),
              if (onTap != null)
                Icon(Icons.arrow_forward_ios_rounded, color: Theme.of(context).iconTheme.color?.withOpacity(0.4), size: 14),
            ],
          ),
        ),
      ),
    );
  }
}
