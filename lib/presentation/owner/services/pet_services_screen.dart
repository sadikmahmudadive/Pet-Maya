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
import '../../common_widgets/skeleton_loader.dart';
import 'package:animate_do/animate_do.dart';
import 'booking_screen.dart';
import 'favorite_vets_screen.dart';
import 'vet_details_screen.dart';

class PetServicesScreen extends StatefulWidget {
  const PetServicesScreen({super.key});

  @override
  State<PetServicesScreen> createState() => _PetServicesScreenState();
}

class _PetServicesScreenState extends State<PetServicesScreen> {
  String _selectedCategory = 'ALL';
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  bool _onlyNearby = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final allVets = state.vets;
    final user = state.currentUser;
    final favoriteIds = user?.favoriteVetIds ?? [];
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final vets = allVets.where((v) {
      final matchesCategory = _selectedCategory == 'ALL' || v.tag.toUpperCase() == _selectedCategory;
      final q = _searchQuery.toLowerCase();
      final matchesSearch = q.isEmpty ||
          v.name.toLowerCase().contains(q) ||
          v.qualification.toLowerCase().contains(q) ||
          v.tag.toLowerCase().contains(q) ||
          v.bio.toLowerCase().contains(q);
      
      final bool isClose = v.distance.contains('km') && (double.tryParse(v.distance.split(' ')[0]) ?? 5.0) < 2.0;
      final matchesNearby = !_onlyNearby || isClose;

      return matchesCategory && matchesSearch && matchesNearby;
    }).toList();

    return GlassScaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverAppBar(
            title: const Text('Veterinary & Care', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
            backgroundColor: Colors.transparent,
            elevation: 0,
            floating: true,
            actions: [
              Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.favorite_rounded, color: AppColors.dangerRed),
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoriteVetsScreen())),
                  ),
                  if (favoriteIds.isNotEmpty)
                    Positioned(
                      top: 10,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                        child: Text(
                          '${favoriteIds.length}',
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 8),
            ],
          ),
          CupertinoSliverRefreshControl(
            refreshIndicatorExtent: 80,
            refreshTriggerPullDistance: 120,
            builder: (context, refreshState, pulledExtent, refreshTriggerPullDistance, refreshIndicatorExtent) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.only(top: 16),
                  child: TailWaggingLoader(size: 350, useBottomPosition: true),
                ),
              );
            },
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              if (user != null) await state.syncFromFirebase(user);
            },
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  // Search Bar
                  FadeInDown(
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0x33FFFFFF) : Colors.white.withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val.trim()),
                        style: TextStyle(fontWeight: FontWeight.w600, color: isDark ? Colors.white : Colors.black87),
                        decoration: InputDecoration(
                          hintText: 'Search doctor, specialty, clinic...',
                          hintStyle: TextStyle(color: Colors.grey[500], fontSize: 14),
                          prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded, size: 18),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Emergency 24/7 Triage Card
                  FadeInDown(
                    delay: const Duration(milliseconds: 100),
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            const Color(0xFFEF4444).withValues(alpha: isDark ? 0.25 : 0.12),
                            AppColors.primary.withValues(alpha: isDark ? 0.20 : 0.08),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.3), width: 1.2),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.emergency_rounded, color: Color(0xFFEF4444), size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  '24/7 Emergency Care',
                                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, letterSpacing: -0.2),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Instant tele-triage & walk-in clinician access.',
                                  style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.black87),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.heavyImpact();
                              if (allVets.isNotEmpty) {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(vet: allVets.first)));
                              }
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEF4444),
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFEF4444).withValues(alpha: 0.35),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Text(
                                'Triage Now',
                                style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Category Selector & Nearby Toggle
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Categories',
                        style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w900, fontSize: 18),
                      ),
                      GestureDetector(
                        onTap: () {
                          HapticFeedback.selectionClick();
                          setState(() => _onlyNearby = !_onlyNearby);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: _onlyNearby ? AppColors.primary : AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.near_me_rounded,
                                size: 13,
                                color: _onlyNearby ? Colors.white : AppColors.primary,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                'Nearby (<2km)',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: _onlyNearby ? Colors.white : AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  FadeInUp(child: _buildCategoryGrid(allVets)),
                  const SizedBox(height: 32),

                  // Results Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Available Specialists',
                        style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w900, fontSize: 20),
                      ),
                      Text(
                        '${vets.length} FOUND',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                ],
              ),
            ),
          ),
          state.isLoading && vets.isEmpty
              ? SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => const Padding(
                        padding: EdgeInsets.only(bottom: 16),
                        child: SkeletonLoader(width: double.infinity, height: 160, borderRadius: 28),
                      ),
                      childCount: 4,
                    ),
                  ),
                )
              : vets.isEmpty
                  ? const SliverFillRemaining(
                      child: EmptyState(
                        icon: Icons.medical_services_outlined,
                        title: 'No specialists found',
                        message: 'Try adjusting your search query or category filter.',
                      ),
                    )
                  : SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) => _buildVetCard(context, vets[index], favoriteIds.contains(vets[index].id)),
                          childCount: vets.length,
                        ),
                      ),
                    ),
          const SliverToBoxAdapter(child: SizedBox(height: 160)),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid(List<VetModel> allVets) {
    int countFor(String cat) {
      if (cat == 'ALL') return allVets.length;
      return allVets.where((v) => v.tag.toUpperCase() == cat).length;
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          _buildCategoryItem(Icons.grid_view_rounded, 'All', AppColors.primary, 'ALL', countFor('ALL')),
          const SizedBox(width: 10),
          _buildCategoryItem(Icons.medical_services_rounded, 'Vets', AppColors.primary, 'VETERINARIAN', countFor('VETERINARIAN')),
          const SizedBox(width: 10),
          _buildCategoryItem(Icons.content_cut_rounded, 'Grooming', AppColors.healthGreen, 'GROOMING', countFor('GROOMING')),
          const SizedBox(width: 10),
          _buildCategoryItem(Icons.hotel_rounded, 'Boarding', AppColors.accentAmber, 'BOARDING', countFor('BOARDING')),
          const SizedBox(width: 10),
          _buildCategoryItem(Icons.pets_rounded, 'Training', AppColors.tertiary, 'TRAINING', countFor('TRAINING')),
        ],
      ),
    );
  }

  Widget _buildCategoryItem(IconData icon, String label, Color color, String category, int count) {
    final isSelected = _selectedCategory == category;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selectedCategory = category);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? color
              : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.7)),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? color : Colors.transparent,
            width: 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.35),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : color,
              size: 18,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                fontSize: 13,
                color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87),
              ),
            ),
            if (count > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.white.withValues(alpha: 0.25) : color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$count',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    color: isSelected ? Colors.white : color,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildVetCard(BuildContext context, VetModel vet, bool isFavorite) {
    final state = context.read<AppStateRepository>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bool isVeryClose = vet.distance.contains('km') && (double.tryParse(vet.distance.split(' ')[0]) ?? 5.0) < 2.0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: PremiumCard(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VetDetailsScreen(vet: vet))),
        opacity: isVeryClose ? 0.28 : 0.18,
        borderRadius: 28,
        borderSide: isVeryClose ? BorderSide(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5) : null,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stack(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.4), width: 2),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(32),
                          child: Image.network(
                            (vet.photoUrl != null && vet.photoUrl!.isNotEmpty)
                                ? vet.photoUrl!
                                : 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop',
                            width: 68,
                            height: 68,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Container(
                              width: 68,
                              height: 68,
                              color: AppColors.primary.withValues(alpha: 0.1),
                              child: const Icon(Icons.person_rounded, color: AppColors.primary),
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: const Color(0xFF22C55E),
                            shape: BoxShape.circle,
                            border: Border.all(color: isDark ? const Color(0xFF1E293B) : Colors.white, width: 2),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                vet.name,
                                style: AppTypography.titleMedium.copyWith(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 17,
                                  letterSpacing: -0.3,
                                ),
                              ),
                            ),
                            IconButton(
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              icon: Icon(
                                isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                color: isFavorite ? AppColors.dangerRed : Colors.grey,
                                size: 22,
                              ),
                              onPressed: () {
                                HapticFeedback.lightImpact();
                                state.toggleFavoriteVet(vet.id);
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          vet.qualification,
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            StatusChip.verified(vet.isVerified),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.accentAmber.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 13),
                                  const SizedBox(width: 3),
                                  Text(
                                    '${vet.rating} (${vet.reviewsCount})',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      fontSize: 10,
                                      color: AppColors.accentAmber,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Bio / Specialization snippet
              if (vet.bio.isNotEmpty) ...[
                Text(
                  vet.bio,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.4,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 14),
              ],

              // Footer: Price, Distance & Action buttons
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.02),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          vet.price,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                            color: AppColors.healthGreen,
                          ),
                        ),
                        Row(
                          children: [
                            Icon(
                              Icons.location_on_rounded,
                              size: 12,
                              color: isVeryClose ? AppColors.healthGreen : AppColors.primary,
                            ),
                            const SizedBox(width: 2),
                            Text(
                              vet.distance,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: isVeryClose ? AppColors.healthGreen : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            Navigator.push(context, MaterialPageRoute(builder: (_) => VetDetailsScreen(vet: vet)));
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              'Profile',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.heavyImpact();
                            Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(vet: vet)));
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.35),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.calendar_today_rounded, size: 12, color: Colors.white),
                                SizedBox(width: 6),
                                Text(
                                  'Book',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ],
                            ),
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
