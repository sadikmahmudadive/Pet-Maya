import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'booking_screen.dart';
import 'reviews_screen.dart';

class VetDetailsScreen extends StatefulWidget {
  final VetModel vet;

  const VetDetailsScreen({super.key, required this.vet});

  @override
  State<VetDetailsScreen> createState() => _VetDetailsScreenState();
}

class _VetDetailsScreenState extends State<VetDetailsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppStateRepository>().loadReviews(widget.vet.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppStateRepository repo) => repo.currentUser);
    final repo = context.watch<AppStateRepository>();
    
    // Smart Sync: Find the latest version of this vet in the repository to ensure live ratings/distances
    final currentVet = repo.vets.firstWhere((v) => v.id == widget.vet.id, orElse: () => widget.vet);
    
    final isFavorite = user?.favoriteVetIds.contains(currentVet.id) ?? false;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calculate dynamic rating distributions
    final reviews = repo.reviews;
    final total = reviews.length;
    
    // Self-Healing Data: If the database aggregate (rating/count) doesn't match the actual reviews, 
    // we correct the main Vet document in the background.
    if (total > 0 && (currentVet.reviewsCount != total)) {
       final sum = reviews.fold(0.0, (s, r) => s + r.rating);
       final trueAvg = double.parse((sum / total).toStringAsFixed(1));
       
       // background update to fix the "hardcoded" look on Home Screen
       WidgetsBinding.instance.addPostFrameCallback((_) {
         repo.updateVetAggregate(currentVet.id, trueAvg, total);
       });
    }

    int exc = 0, good = 0, avg = 0, poor = 0;
    for (var r in reviews) {
      if (r.rating >= 4.5) {
        exc++;
      } else if (r.rating >= 3.5) {
        good++;
      } else if (r.rating >= 2.5) {
        avg++;
      } else {
        poor++;
      }
    }

    return GlassScaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            elevation: 0,
            systemOverlayStyle: SystemUiOverlayStyle.light, // Always white icons on image header
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : Colors.black87),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Icon(
                  isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: isFavorite ? AppColors.dangerRed : (isDark ? Colors.white70 : Colors.black54),
                ),
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  context.read<AppStateRepository>().toggleFavoriteVet(currentVet.id);
                },
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  currentVet.photoUrl != null
                      ? CachedNetworkImage(
                          imageUrl: currentVet.photoUrl!,
                          fit: BoxFit.cover,
                          placeholder: (c, u) => const Center(child: CupertinoActivityIndicator()),
                          errorWidget: (c, u, e) => Container(color: AppColors.primaryLight, child: const Icon(Icons.person, size: 50, color: AppColors.primary)),
                        )
                      : Container(color: AppColors.primaryLight),
                  // Top Gradient for Status Bar
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: const Alignment(0, -0.4),
                        colors: [
                          Colors.black.withValues(alpha: isDark ? 0.5 : 0.3),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                  // Bottom Blend
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.center,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withValues(alpha: 0.6)],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 40,
                    left: 24,
                    right: 24,
                    child: FadeInUp(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                            child: Text(currentVet.tag.toUpperCase(), 
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
                          ),
                          const SizedBox(height: 12),
                          Text(currentVet.name, 
                            style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(currentVet.qualification, 
                    style: AppTypography.titleLarge.copyWith(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 18)),
                  const SizedBox(height: 32),

                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReviewsScreen(targetId: currentVet.id, targetName: currentVet.name))),
                          child: Builder(builder: (context) {
                            // Truth Logic: Calculate real rating from loaded reviews if they exist
                            double displayRating = currentVet.rating;
                            if (total > 0) {
                              final sum = reviews.fold(0.0, (s, r) => s + r.rating);
                              displayRating = double.parse((sum / total).toStringAsFixed(1));
                            }
                            
                            return _buildStatTile(
                              context, 
                              Icons.star_rounded, 
                              AppColors.accentAmber, 
                              displayRating == 0 ? 'N/A' : '$displayRating', 
                              'REVIEWS'
                            );
                          }),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatTile(context, Icons.location_on_rounded, AppColors.primary, currentVet.distance, 'DISTANCE')),
                      const SizedBox(width: 12),
                      Expanded(child: _buildStatTile(context, Icons.work_history_rounded, AppColors.secondary, currentVet.experience, 'EXPERIENCE')),
                    ],
                  ),
                  const SizedBox(height: 40),

                  _buildSectionHeader('Professional Bio'),
                  const SizedBox(height: 12),
                  Text(currentVet.bio, 
                    style: AppTypography.bodyLarge.copyWith(height: 1.7, color: isDark ? Colors.white70 : Colors.black87, fontWeight: FontWeight.w500)),
                  
                  const SizedBox(height: 40),

                  _buildSectionHeader('Clinical Hours'),
                  const SizedBox(height: 16),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 24,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
                            child: const Icon(Icons.access_time_filled_rounded, color: AppColors.primary, size: 20),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Weekly Schedule', 
                                  style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w800, color: Colors.grey[500])),
                                const SizedBox(height: 4),
                                Text(currentVet.businessHours, 
                                  style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w800)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),

                  _buildSectionHeader('Client Satisfaction'),
                  const SizedBox(height: 20),
                  _buildRatingBar(context, 'Excellent', total == 0 ? 0 : exc / total, '$exc'),
                  _buildRatingBar(context, 'Good', total == 0 ? 0 : good / total, '$good'),
                  _buildRatingBar(context, 'Average', total == 0 ? 0 : avg / total, '$avg'),
                  _buildRatingBar(context, 'Fair/Poor', total == 0 ? 0 : poor / total, '$poor'),
                  
                  const SizedBox(height: 32),
                  
                  // New Direct Review Button
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReviewsScreen(targetId: currentVet.id, targetName: currentVet.name))),
                      icon: const Icon(Icons.rate_review_rounded, size: 18),
                      label: const Text('RATE & REVIEW THIS PROVIDER', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.5)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                        foregroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
      bottomNavigationBar: _buildBottomBar(context, currentVet),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title.toUpperCase(), 
      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: AppColors.primary, letterSpacing: 1.5));
  }

  Widget _buildStatTile(BuildContext context, IconData icon, Color color, String value, String label) {
    return PremiumCard(
      opacity: 0.15,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            const SizedBox(height: 2),
            Text(label, 
              style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: Colors.grey[500], letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  Widget _buildRatingBar(BuildContext context, String label, double ratio, String count) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(width: 70, child: Text(label, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, color: Colors.grey))),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: ratio,
                minHeight: 8,
                backgroundColor: Colors.grey.withValues(alpha: 0.1),
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Text(count, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, VetModel currentVet) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 40, offset: const Offset(0, -10))],
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: ElevatedButton(
            onPressed: () {
              HapticFeedback.heavyImpact();
              Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(vet: currentVet)));
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1AB680),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: Text('SCHEDULE APPOINTMENT • ${currentVet.price.toUpperCase()}', 
              style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.8, fontSize: 12)),
          ),
        ),
      ),
    );
  }
}
