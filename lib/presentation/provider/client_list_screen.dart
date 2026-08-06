import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../owner/pets/pet_details_screen.dart';
import 'package:animate_do/animate_do.dart';
import 'add_service_record_modal.dart';

class ClientListScreen extends StatelessWidget {
  const ClientListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pets = context.select((AppStateRepository state) => state.pets);

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Patient Directory'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
        physics: const BouncingScrollPhysics(),
        itemCount: pets.length,
        itemBuilder: (context, index) {
          final pet = pets[index];
          return FadeInUp(
            delay: Duration(milliseconds: 50 * index),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: PremiumCard(
                opacity: 0.15,
                borderRadius: 28,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetDetailsScreen(petId: pet.petID))),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: Image.network(
                            pet.photoUrl ?? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
                            width: 60,
                            height: 60,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(pet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, fontSize: 17)),
                            Text('${pet.breed} • ${pet.gender}', 
                              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
                            const SizedBox(height: 4),
                            Text('ID: ${pet.petID.toUpperCase()}', 
                              style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 9, letterSpacing: 0.5)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                          child: const Icon(Icons.note_add_rounded, color: AppColors.primary, size: 20),
                        ),
                        onPressed: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => AddServiceRecordModal(initialPet: pet),
                          );
                        },
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textTertiary, size: 14),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
