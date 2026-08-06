import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';
import 'vet_details_screen.dart';

class FavoriteVetsScreen extends StatelessWidget {
  const FavoriteVetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppStateRepository repo) => repo.currentUser);
    final allVets = context.select((AppStateRepository repo) => repo.vets);
    
    final favoriteVets = allVets.where((v) => 
      user?.favoriteVetIds.contains(v.id) ?? false).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Favorites'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: favoriteVets.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(color: AppColors.dangerRed.withOpacity(0.05), shape: BoxShape.circle),
                    child: Icon(Icons.favorite_border_rounded, size: 64, color: AppColors.dangerRed.withOpacity(0.2)),
                  ),
                  const SizedBox(height: 24),
                  Text('No favorites yet', style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text('Providers you bookmark will appear here', style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: 200,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('EXPLORE CARE'),
                    ),
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
              itemCount: favoriteVets.length,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context, index) {
                final vet = favoriteVets[index];
                return FadeInUp(
                  delay: Duration(milliseconds: 50 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: PremiumCard(
                      opacity: 0.25,
                      borderRadius: 28,
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VetDetailsScreen(vet: vet))),
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
                                child: vet.photoUrl != null 
                                  ? Image.network(vet.photoUrl!, width: 60, height: 60, fit: BoxFit.cover)
                                  : Container(width: 60, height: 60, color: AppColors.primaryLight, child: const Icon(Icons.medical_services, color: AppColors.primary)),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(vet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, fontSize: 16)),
                                  Text(vet.tag.toUpperCase(), 
                                    style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 9, letterSpacing: 0.5)),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 14),
                                      const SizedBox(width: 4),
                                      Text('${vet.rating}', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700)),
                                      Text(' (${vet.reviewsCount})', style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary, fontWeight: FontWeight.w600)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.favorite_rounded, color: AppColors.dangerRed, size: 22),
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
