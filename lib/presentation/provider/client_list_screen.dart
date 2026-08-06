import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../owner/pets/pet_details_screen.dart';
import 'add_service_record_modal.dart';

class ClientListScreen extends StatelessWidget {
  const ClientListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pets = context.select((AppStateRepository state) => state.pets);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Patient Directory', style: TextStyle(fontWeight: FontWeight.w800)),
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
                opacity: 0.2,
                borderRadius: 28,
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetDetailsScreen(petId: pet.petID))),
                child: Padding(
                  padding: const EdgeInsets.all(18),
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
                            width: 64,
                            height: 64,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(pet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 18)),
                            const SizedBox(height: 2),
                            Text('${pet.breed} • ${pet.gender}', 
                              style: TextStyle(color: isDark ? Colors.white70 : Colors.black54, fontWeight: FontWeight.w600, fontSize: 13)),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                              child: Text('ID: ${pet.petID.toUpperCase()}', 
                                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.5)),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: const BoxDecoration(color: Color(0xFF006684), shape: BoxShape.circle),
                          child: const Icon(Icons.note_add_rounded, color: Colors.white, size: 18),
                        ),
                        onPressed: () {
                          HapticFeedback.mediumImpact();
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => AddServiceRecordModal(initialPet: pet),
                          );
                        },
                      ),
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
