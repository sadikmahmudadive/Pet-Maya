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
import '../../common_widgets/tail_wagging_loader.dart';
import 'package:animate_do/animate_do.dart';
import 'booking_screen.dart';
import 'favorite_vets_screen.dart';
import 'vet_details_screen.dart';

import '../../common_widgets/skeleton_loader.dart';

class PetServicesScreen extends StatefulWidget {
  const PetServicesScreen({super.key});

  @override
  State<PetServicesScreen> createState() => _PetServicesScreenState();
}

class _PetServicesScreenState extends State<PetServicesScreen> {
  String _selectedCategory = 'ALL';

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final allVets = state.vets;

    final vets = allVets.where((v) {
      if (_selectedCategory == 'ALL') return true;
      return v.tag.toUpperCase() == _selectedCategory;
    }).toList();

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
            refreshIndicatorExtent: 80,
            refreshTriggerPullDistance: 120,
            builder: (context, refreshState, pulledExtent, refreshTriggerPullDistance, refreshIndicatorExtent) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: const TailWaggingLoader(
                    size: 350,
                    useBottomPosition: true,
                  ),
                ),
              );
            },
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
          state.isLoading && vets.isEmpty
              ? SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: const SkeletonLoader(width: double.infinity, height: 120, borderRadius: 28),
                      ),
                      childCount: 4,
                    ),
                  ),
                )
              : vets.isEmpty
                  ? const SliverFillRemaining(
                      child: EmptyState(
                        icon: Icons.medical_services_outlined,
                        title: 'No providers found',
                        message: 'We couldn\'t find any care providers in your area at the moment.',
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      sliver: SliverGrid(
                        gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 500, // Two columns on tablet, one on mobile
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                          mainAxisExtent: 180, // Fixed height for service cards
                        ),
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
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildCategoryItem(Icons.grid_view_rounded, 'All', AppColors.primary, 'ALL'),
          const SizedBox(width: 12),
          _buildCategoryItem(Icons.medical_services, 'Vet', AppColors.primary, 'VETERINARIAN'),
          const SizedBox(width: 12),
          _buildCategoryItem(Icons.content_cut_rounded, 'Groom', AppColors.healthGreen, 'GROOMING'),
          const SizedBox(width: 12),
          _buildCategoryItem(Icons.hotel_rounded, 'Board', AppColors.accentAmber, 'BOARDING'),
          const SizedBox(width: 12),
          _buildCategoryItem(Icons.pets_rounded, 'Training', AppColors.tertiary, 'TRAINING'),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(IconData icon, String label, Color color, String category) {
    final isSelected = _selectedCategory == category;

    return Column(
      children: [
        PremiumCard(
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => _selectedCategory = category);
          },
          opacity: isSelected ? 0.4 : 0.1,
          borderRadius: 24,
          child: Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: color.withValues(alpha: isSelected ? 0.15 : 0.05),
              borderRadius: BorderRadius.circular(24),
              border: isSelected ? Border.all(color: color.withValues(alpha: 0.3), width: 1.5) : null,
            ),
            child: Icon(icon, color: isSelected ? color : color.withValues(alpha: 0.5), size: 30),
          ),
        ),
        const SizedBox(height: 12),
        Text(label, style: TextStyle(
          fontWeight: isSelected ? FontWeight.w900 : FontWeight.w800, 
          fontSize: 10, 
          letterSpacing: 0.5,
          color: isSelected ? AppColors.primary : Colors.grey,
        )),
      ],
    );
  }

  Widget _buildVetCard(BuildContext context, VetModel vet) {
    // Premium Discovery: Highlight 'Nearby' based on distance
    final bool isVeryClose = vet.distance.contains('km') && double.tryParse(vet.distance.split(' ')[0])! < 2.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: PremiumCard(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VetDetailsScreen(vet: vet))),
        opacity: isVeryClose ? 0.35 : 0.2, // Highlight closer ones
        borderRadius: 28,
        borderSide: isVeryClose ? BorderSide(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5) : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Stack(
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
                  if (isVeryClose)
                    Positioned(
                      bottom: 0, right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: AppColors.healthGreen, shape: BoxShape.circle),
                        child: const Icon(Icons.flash_on_rounded, color: Colors.white, size: 10),
                      ),
                    ),
                ],
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
                        Icon(Icons.near_me_rounded, color: isVeryClose ? AppColors.healthGreen : AppColors.primary, size: 14),
                        const SizedBox(width: 4),
                        Text(vet.distance, style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: isVeryClose ? AppColors.healthGreen : null)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(vet.price, style: AppTypography.titleMedium.copyWith(color: AppColors.healthGreen, fontSize: 14, fontWeight: FontWeight.w700)),
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.heavyImpact();
                            Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(vet: vet)));
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.primary, 
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))],
                            ),
                            child: const Text('Book Now', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5)),
                          ),
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
