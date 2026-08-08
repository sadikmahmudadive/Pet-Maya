import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/vet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/status_chip.dart';
import '../../common_widgets/empty_state.dart';
import 'package:animate_do/animate_do.dart';
import 'favorite_vets_screen.dart';
import 'vet_details_screen.dart';

class PetServicesScreen extends StatelessWidget {
  const PetServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final vets = state.vets;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Care Services'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.favorite_rounded, color: AppColors.dangerRed),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoriteVetsScreen())),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              final user = state.currentUser;
              if (user != null) await state.syncFromFirebase(user);
            },
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 100, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FadeInDown(
                    child: Text('Find the best care for your best friend', 
                      style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, fontSize: 16)),
                  ),
                  const SizedBox(height: 32),
                  FadeInUp(child: _buildCategoryGrid()),
                  const SizedBox(height: 48),
                  FadeInUp(
                    delay: const Duration(milliseconds: 200),
                    child: Text('Verified Professionals', 
                      style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
          vets.isEmpty
              ? const SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.medical_services_outlined,
                    title: 'No providers found',
                    message: 'We couldn\'t find any care providers in your area at the moment.',
                  ),
                )
              : SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _buildVetCard(context, vets[index]),
                      childCount: vets.length,
                    ),
                  ),
                ),
          const SliverToBoxAdapter(child: SizedBox(height: 160)),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid() {
    return Wrap(
      alignment: WrapAlignment.spaceBetween,
      spacing: 12,
      runSpacing: 16,
      children: [
        _buildCategoryItem(Icons.medical_services, 'Vet', AppColors.primary),
        _buildCategoryItem(Icons.content_cut_rounded, 'Groom', AppColors.healthGreen),
        _buildCategoryItem(Icons.hotel_rounded, 'Board', AppColors.accentAmber),
        _buildCategoryItem(Icons.pets_rounded, 'Training', AppColors.tertiary),
      ],
    );
  }

  Widget _buildCategoryItem(IconData icon, String label, Color color) {
    return Column(
      children: [
        PremiumCard(
          opacity: 0.1,
          borderRadius: 24,
          child: Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: color.withOpacity(0.05),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Icon(icon, color: color, size: 30),
          ),
        ),
        const SizedBox(height: 12),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 10, letterSpacing: 0.5)),
      ],
    );
  }

  Widget _buildVetCard(BuildContext context, VetModel vet) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: PremiumCard(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VetDetailsScreen(vet: vet))),
        opacity: 0.2,
        borderRadius: 28,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Theme.of(context).cardColor, width: 2),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.network(
                    (vet.photoUrl != null && vet.photoUrl!.isNotEmpty)
                        ? vet.photoUrl!
                        : 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop',
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(vet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, fontSize: 16))),
                        StatusChip.verified(vet.isVerified),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(vet.qualification, style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 16),
                        const SizedBox(width: 4),
                        Text(vet.rating.toString(), style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700)),
                        const SizedBox(width: 12),
                        const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 14),
                        const SizedBox(width: 4),
                        Text(vet.distance, style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(vet.price, style: AppTypography.titleMedium.copyWith(color: AppColors.healthGreen, fontSize: 14, fontWeight: FontWeight.w700)),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
                          child: const Text('Book Now', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
