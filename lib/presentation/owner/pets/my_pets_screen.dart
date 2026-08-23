import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/status_chip.dart';
import '../../common_widgets/empty_state.dart';
import 'pet_details_screen.dart';
import 'add_edit_pet_screen.dart';

class MyPetsScreen extends StatelessWidget {
  const MyPetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pets = context.select((AppStateRepository state) => state.pets);

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Pet Family'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditPetScreen())),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
            sliver: pets.isEmpty
                ? SliverFillRemaining(
                    child: EmptyState(
                      icon: Icons.pets_rounded,
                      title: 'No pets added yet',
                      message: 'Start by creating a profile for your buddy!',
                      actionLabel: 'Add Pet Profile',
                      onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditPetScreen())),
                    ),
                  )
                : SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final pet = pets[index];
                        return FadeInUp(
                          delay: Duration(milliseconds: 100 * index),
                          child: _buildPetListItem(context, pet),
                        );
                      },
                      childCount: pets.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildPetListItem(BuildContext context, PetModel pet) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: PremiumCard(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetDetailsScreen(petId: pet.petID))),
        opacity: 0.3,
        borderRadius: 28,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Theme.of(context).cardColor, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(30),
                  child: pet.photoUrl != null && pet.photoUrl!.isNotEmpty
                      ? pet.photoUrl!.startsWith('assets')
                          ? Image.asset(
                              pet.photoUrl!,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                            )
                          : CachedNetworkImage(
                              imageUrl: pet.photoUrl!,
                              width: 50,
                              height: 50,
                              fit: BoxFit.cover,
                              placeholder: (c, u) => const CupertinoActivityIndicator(),
                              errorWidget: (c, u, e) => const Icon(Icons.pets, size: 20, color: Colors.grey),
                            )
                      : const Icon(Icons.pets, size: 20, color: Colors.grey),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pet.name, 
                      style: AppTypography.titleLarge.copyWith(fontSize: 18, fontWeight: FontWeight.w700),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      pet.breed, 
                      style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    StatusChip.health(pet.healthIndex),
                  ],
                ),
              ),
              Icon(Icons.arrow_forward_ios_rounded, color: Theme.of(context).iconTheme.color, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
