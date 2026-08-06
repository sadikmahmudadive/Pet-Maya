import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/vet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import 'package:provider/provider.dart';
import 'booking_screen.dart';
import 'reviews_screen.dart';

class VetDetailsScreen extends StatelessWidget {
  final VetModel vet;

  const VetDetailsScreen({super.key, required this.vet});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppStateRepository repo) => repo.currentUser);
    final repo = context.read<AppStateRepository>();
    final isFavorite = user?.favoriteVetIds.contains(vet.id) ?? false;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            actions: [
              IconButton(
                icon: Icon(
                  isFavorite ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: isFavorite ? AppColors.dangerRed : Theme.of(context).colorScheme.onPrimary,
                ),
                onPressed: () => repo.toggleFavoriteVet(vet.id),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  vet.photoUrl != null
                      ? Image.network(vet.photoUrl!, fit: BoxFit.cover)
                      : Container(color: AppColors.primaryLight),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.black.withOpacity(0.7)],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Container(
              transform: Matrix4.translationValues(0, -30, 0),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(vet.name, 
                              style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 4),
                            Text(vet.qualification, 
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          vet.tag.toUpperCase(),
                          style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 10, letterSpacing: 0.5),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Rating, distance, experience stats
                  Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ReviewsScreen(targetId: vet.id, targetName: vet.name))),
                          child: _buildStatTile(context, Icons.star_rounded, AppColors.accentAmber, '${vet.rating}', 'REVIEWS'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(child: _buildStatTile(context, Icons.location_on_rounded, AppColors.primary, vet.distance, 'DISTANCE')),
                      const SizedBox(width: 10),
                      Expanded(child: _buildStatTile(context, Icons.work_rounded, AppColors.secondary, vet.experience, 'EXPERIENCE')),
                    ],
                  ),
                  const SizedBox(height: 40),

                  Text('Professional Bio', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  const SizedBox(height: 12),
                  Text(vet.bio, style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.7, color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 15)),
                  const SizedBox(height: 40),

                  Text('Availability', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Theme.of(context).dividerColor),
                      boxShadow: [BoxShadow(color: Theme.of(context).shadowColor.withOpacity(0.02), blurRadius: 20, offset: const Offset(0, 10))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                          child: const Icon(Icons.access_time_filled_rounded, color: AppColors.primary, size: 20),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Clinic Hours', style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.outline)),
                              const SizedBox(height: 2),
                              Text(vet.businessHours, style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurface)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Ratings Breakdown
                  Text('Customer Satisfaction', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                  const SizedBox(height: 20),
                  _buildRatingBar(context, '5 Stars', 0.85, '120'),
                  _buildRatingBar(context, '4 Stars', 0.12, '18'),
                  _buildRatingBar(context, '3 Stars', 0.03, '4'),
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface.withOpacity(0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [BoxShadow(color: Theme.of(context).shadowColor.withOpacity(0.05), blurRadius: 40, offset: const Offset(0, -10))],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: ElevatedButton(
              onPressed: () {
                HapticFeedback.heavyImpact();
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => BookingScreen(vet: vet)),
                );
              },
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              child: Text('BOOK APPOINTMENT • ${vet.price.toUpperCase()}', 
                style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatTile(BuildContext context, IconData icon, Color iconColor, String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        color: iconColor.withOpacity(0.06),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: iconColor.withOpacity(0.15), width: 1.5),
      ),
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text(subtitle, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 9, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.outline, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _buildRatingBar(BuildContext context, String label, double ratio, String count) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 60, child: Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700))),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: ratio,
                backgroundColor: Theme.of(context).dividerColor.withOpacity(0.1),
                color: AppColors.accentAmber,
                minHeight: 10,
              ),
            ),
          ),
          const SizedBox(width: 16),
          SizedBox(width: 30, child: Text(count, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurfaceVariant))),
        ],
      ),
    );
  }
}
