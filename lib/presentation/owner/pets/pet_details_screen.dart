import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/cupertino.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'add_edit_pet_screen.dart';
import 'pet_food_screen.dart';
import 'pet_health_tracker_screen.dart';
import 'package:animate_do/animate_do.dart';

class PetDetailsScreen extends StatelessWidget {
  final String petId;

  const PetDetailsScreen({super.key, required this.petId});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final pet = state.pets.firstWhere((p) => p.petID == petId, orElse: () => state.pets.first);
    final records = state.serviceRecords.where((r) => r.petId == petId).toList();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Parallax Header
          SliverAppBar(
            expandedHeight: 340,
            pinned: true,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.black26,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            elevation: 0,
            systemOverlayStyle: SystemUiOverlayStyle.light, // Always white icons on image header
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  pet.photoUrl != null && pet.photoUrl!.isNotEmpty
                      ? pet.photoUrl!.startsWith('assets')
                          ? Image.asset(pet.photoUrl!, fit: BoxFit.cover, width: double.infinity, height: 350)
                          : CachedNetworkImage(
                              imageUrl: pet.photoUrl!,
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: 350,
                              placeholder: (c, u) => const Center(child: CupertinoActivityIndicator()),
                              errorWidget: (c, u, e) => Container(color: AppColors.primaryLight, child: const Icon(Icons.pets, size: 50, color: AppColors.primary)),
                            )
                      : Container(color: AppColors.primaryLight, child: const Icon(Icons.pets, size: 50, color: AppColors.primary)),
                  // Enhanced Top Gradient for Status Bar Visibility
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: const Alignment(0, -0.2), 
                        colors: [
                          Colors.black.withOpacity(isDark ? 0.6 : 0.4),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                  // Bottom Blend Gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: const Alignment(0, 0.2),
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Theme.of(context).scaffoldBackgroundColor,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundColor: Colors.black26,
                  child: IconButton(
                    icon: const Icon(Icons.edit_rounded, color: Colors.white, size: 18),
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AddEditPetScreen(petToEdit: pet))),
                  ),
                ),
              ),
            ],
          ),

          SliverToBoxAdapter(
            child: Column(
              children: [
                // 2. Floating Identity Card (Aligned with App UX)
                Transform.translate(
                  offset: const Offset(0, -40), // Slightly less offset to prevent clipping
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: FadeInDown(
                      child: PremiumCard(
                        opacity: isDark ? 0.25 : 0.15, // Increased opacity for better contrast
                        borderRadius: 32,
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min, // Ensure it doesn't expand unnecessarily
                                  children: [
                                    Text(pet.name, style: AppTypography.headlineMedium.copyWith(
                                      fontWeight: FontWeight.w800, 
                                      fontSize: 28,
                                      color: isDark ? Colors.white : Colors.black87,
                                    )),
                                    const SizedBox(height: 4),
                                    Text(pet.breed, style: AppTypography.bodyLarge.copyWith(
                                      color: isDark ? Colors.white70 : Colors.grey[700], 
                                      fontWeight: FontWeight.w600
                                    )),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: pet.gender == 'Female' ? const Color(0xFFFFC1CC) : const Color(0xFFC1E1FF),
                                  borderRadius: BorderRadius.circular(16),
                                  boxShadow: [
                                    BoxShadow(color: (pet.gender == 'Female' ? const Color(0xFFFFC1CC) : const Color(0xFFC1E1FF)).withOpacity(0.4), blurRadius: 12, offset: const Offset(0, 4))
                                  ],
                                ),
                                child: Icon(
                                  pet.gender == 'Female' ? Icons.female_rounded : Icons.male_rounded,
                                  color: Colors.white,
                                  size: 24,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 120),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // 3. About Section
                      FadeInUp(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.pets_rounded, size: 20, color: AppColors.primary),
                                const SizedBox(width: 12),
                                Text('About ${pet.name}', style: AppTypography.titleLarge.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? Colors.white : Colors.black87,
                                )),
                              ],
                            ),
                            const SizedBox(height: 20),
                            // Stats Grid
                            Row(
                              children: [
                                _buildStatCard(context, 'Age', pet.age, const Color(0xFFE8F6F1), const Color(0xFF2D8C69)),
                                const SizedBox(width: 10),
                                _buildStatCard(context, 'Weight', pet.weight, const Color(0xFFE9F5F8), const Color(0xFF2D698C)),
                                const SizedBox(width: 10),
                                _buildStatCard(context, 'Height', pet.height, const Color(0xFFF1F6E8), const Color(0xFF698C2D)),
                                const SizedBox(width: 10),
                                _buildStatCard(context, 'Color', pet.color, const Color(0xFFE8F1F6), const Color(0xFF2D698C)),
                              ],
                            ),
                            const SizedBox(height: 24),
                            PremiumCard(
                              opacity: isDark ? 0.1 : 0.05,
                              borderRadius: 20,
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Text(
                                  pet.description ?? "${pet.name} is a lovely ${pet.breed}.",
                                  style: AppTypography.bodyLarge.copyWith(
                                    height: 1.6, 
                                    color: isDark ? Colors.white70 : Colors.black87
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),

                      // 4. Status Section
                      FadeInUp(
                        delay: const Duration(milliseconds: 100),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.analytics_rounded, size: 22, color: AppColors.primary),
                                const SizedBox(width: 12),
                                Text('${pet.name}\'s Status', style: AppTypography.titleLarge.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? Colors.white : Colors.black87,
                                )),
                              ],
                            ),
                            const SizedBox(height: 20),
                            _buildStatusTile(
                              context,
                              'Health Condition', 
                              pet.healthIndex > 80 ? 'Perfect' : 'Action Required',
                              pet.healthIndex > 80 ? 'Healthy' : 'Abnormal',
                              Icons.medical_services_rounded, 
                              const Color(0xFFFFE8E8),
                              const Color(0xFFD9534F),
                              () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetHealthTrackerScreen(petId: pet.petID))),
                            ),
                            const SizedBox(height: 12),
                            _buildStatusTile(
                              context,
                              'Food & Nutrition', 
                              'Daily Schedule: ${pet.feedingTimes.join(', ')}',
                              'Synced',
                              Icons.restaurant_rounded, 
                              const Color(0xFFE8F6F1),
                              const Color(0xFF2D8C69),
                              () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetFoodScreen(petId: pet.petID))),
                            ),
                            const SizedBox(height: 12),
                            _buildStatusTile(
                              context,
                              'Current Mood', 
                              pet.mood,
                              'Stable',
                              Icons.emoji_emotions_rounded, 
                              const Color(0xFFFFF4E8),
                              const Color(0xFFD98C4F),
                              null,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 40),

                      // 5. Professional History
                      FadeInUp(
                        delay: const Duration(milliseconds: 200),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Professional History', style: AppTypography.titleLarge.copyWith(
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : Colors.black87,
                            )),
                            const SizedBox(height: 20),
                            if (records.isEmpty)
                              PremiumCard(
                                opacity: isDark ? 0.1 : 0.05,
                                borderRadius: 24,
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 40),
                                  child: Column(
                                    children: [
                                      Icon(Icons.history_edu_rounded, size: 48, color: isDark ? Colors.white24 : Theme.of(context).dividerColor),
                                      const SizedBox(height: 12),
                                      Text('No history available yet.', style: TextStyle(color: isDark ? Colors.white38 : Colors.grey[500])),
                                    ],
                                  ),
                                ),
                              )
                            else
                              ...records.map((r) => _buildHistoryCard(context, r)),
                          ],
                        ),
                      ),

                      const SizedBox(height: 60),
                      
                      // 6. Delete Button (Styled with Caution)
                      FadeInUp(
                        delay: const Duration(milliseconds: 300),
                        child: PremiumCard(
                          onTap: () {
                            HapticFeedback.heavyImpact();
                            state.deletePet(pet.petID);
                            Navigator.pop(context);
                          },
                          useGlass: false,
                          backgroundColor: isDark 
                              ? const Color(0xFFFF0055).withOpacity(0.15)
                              : const Color(0xFFFF0055).withOpacity(0.1),
                          borderRadius: 20,
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            child: Center(
                              child: Text(
                                'DELETE ${pet.name.toUpperCase()} PROFILE', 
                                style: TextStyle(
                                  color: isDark ? const Color(0xFFFF528E) : const Color(0xFFFF0055), 
                                  fontWeight: FontWeight.w800, 
                                  letterSpacing: 1, 
                                  fontSize: 13
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String label, String value, Color bgColor, Color textColor) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: PremiumCard(
        useGlass: false,
        backgroundColor: isDark 
            ? textColor.withOpacity(0.15) 
            : bgColor,
        borderRadius: 20,
        child: Container(
          height: 72, // Fixed height to ensure alignment in the row
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(label.toUpperCase(), style: TextStyle(
                fontSize: 8, 
                fontWeight: FontWeight.w800, 
                color: isDark ? Colors.white54 : textColor.withOpacity(0.6), 
                letterSpacing: 0.5
              )),
              const SizedBox(height: 4),
              Flexible(
                child: Text(
                  value, 
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: value.length > 8 ? 9 : 11, // Auto-shrink font for long values like "1 Year, 2 Mo"
                    fontWeight: FontWeight.w900, 
                    color: isDark ? Colors.white : textColor,
                    height: 1.1,
                  ),
                  maxLines: 2, // Allow wrapping to prevent horizontal clipping
                  overflow: TextOverflow.visible,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusTile(BuildContext context, String title, String subtitle, String statusLabel, IconData icon, Color bgColor, Color iconColor, VoidCallback? onTap) {
    return PremiumCard(
      onTap: onTap,
      opacity: 0.1,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: AppTypography.bodySmall.copyWith(color: Theme.of(context).colorScheme.outline, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(statusLabel, style: TextStyle(color: iconColor, fontSize: 9, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(height: 8),
                Icon(Icons.arrow_forward_ios_rounded, color: Theme.of(context).dividerColor, size: 12),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, ServiceRecordModel record) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: PremiumCard(
        opacity: isDark ? 0.2 : 0.1,
        borderRadius: 24,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(record.serviceType.toUpperCase(), style: TextStyle(
                    fontWeight: FontWeight.w900, 
                    fontSize: 11, 
                    color: isDark ? AppColors.primaryLight : AppColors.primary, 
                    letterSpacing: 1
                  )),
                  Text(record.date, style: AppTypography.labelSmall.copyWith(
                    color: isDark ? Colors.white38 : Theme.of(context).colorScheme.outline
                  )),
                ],
              ),
              const SizedBox(height: 12),
              Text(record.title, style: AppTypography.titleMedium.copyWith(
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : Colors.black87,
              )),
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.verified_user_rounded, size: 14, color: AppColors.healthGreen),
                  const SizedBox(width: 6),
                  Text(record.providerName, style: TextStyle(
                    fontSize: 12, 
                    color: isDark ? Colors.white54 : Theme.of(context).colorScheme.outline, 
                    fontWeight: FontWeight.w700
                  )),
                ],
              ),
              const SizedBox(height: 12),
              Text(record.description, style: AppTypography.bodyMedium.copyWith(
                color: isDark ? Colors.white70 : Theme.of(context).colorScheme.onSurfaceVariant
              )),
            ],
          ),
        ),
      ),
    );
  }
}
