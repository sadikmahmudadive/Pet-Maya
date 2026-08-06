import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../auth/login_screen.dart';
import '../services/favorite_vets_screen.dart';
import '../shop/orders_screen.dart';
import 'edit_profile_screen.dart';
import 'package:animate_do/animate_do.dart';

class UserProfileScreen extends StatelessWidget {
  const UserProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppStateRepository state) => state.currentUser);
    final state = context.read<AppStateRepository>();

    if (user == null) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Transparent AppBar for Navigation
          SliverAppBar(
            pinned: true,
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new_rounded, 
                color: isDark ? Colors.white : Theme.of(context).colorScheme.onSurface),
              onPressed: () => Navigator.pop(context),
            ),
            backgroundColor: Theme.of(context).scaffoldBackgroundColor.withOpacity(0.0),
            elevation: 0,
          ),

          // 2. Premium Header with Overlapping Avatar (Unified Sliver to prevent clipping)
          SliverToBoxAdapter(
            child: Column(
              children: [
                Stack(
                  alignment: Alignment.bottomCenter,
                  clipBehavior: Clip.none,
                  children: [
                    // Header Background
                    Container(
                      height: 180,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppColors.primary.withOpacity(isDark ? 0.3 : 0.15),
                            Theme.of(context).scaffoldBackgroundColor,
                          ],
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -30,
                            top: -20,
                            child: Opacity(
                              opacity: 0.05,
                              child: Icon(Icons.pets_rounded, size: 240, color: AppColors.primary),
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Floating Avatar
                    Positioned(
                      bottom: -50,
                      child: FadeInDown(
                        child: Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Theme.of(context).cardColor, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1), 
                                blurRadius: 20, 
                                offset: const Offset(0, 10)
                              )
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 60,
                            backgroundColor: Theme.of(context).colorScheme.surface,
                            backgroundImage: (user.photoUrl != null && user.photoUrl!.isNotEmpty)
                                ? NetworkImage(user.photoUrl!)
                                : null,
                            child: (user.photoUrl == null || user.photoUrl!.isEmpty)
                                ? Icon(Icons.person, size: 60, color: AppColors.primary.withOpacity(0.3))
                                : null,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 66), // Breathing room for name below floating avatar
                
                // User Name
                FadeInUp(
                  child: Text(user.name, 
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: -0.5
                    )),
                ),
                const SizedBox(height: 32),

                // 3. Information Content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Contact Information Card
                      FadeInUp(
                        child: PremiumCard(
                          opacity: 0.1,
                          borderRadius: 28,
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Contact Information', 
                                      style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700)),
                                    _buildLogoutButton(context, state),
                                  ],
                                ),
                                const SizedBox(height: 24),
                                _buildInfoRow(context, Icons.email_rounded, user.email),
                                const Divider(height: 32),
                                _buildInfoRow(context, Icons.phone_rounded, user.phone ?? 'No phone added'),
                                const Divider(height: 32),
                                _buildInfoRow(context, Icons.location_on_rounded, user.address ?? 'No address added'),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Earn Rewards Card
                      FadeInUp(
                        delay: const Duration(milliseconds: 100),
                        child: PremiumCard(
                          useGlass: false,
                          backgroundColor: isDark ? const Color(0xFF1E3A5F) : const Color(0xFFD1F0FF),
                          borderRadius: 28,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Earn Rewards', 
                                        style: AppTypography.labelSmall.copyWith(
                                          color: isDark ? Colors.white70 : AppColors.primaryDark, 
                                          fontWeight: FontWeight.w700
                                        )),
                                      const SizedBox(height: 4),
                                      Text(user.referralCode ?? 'BPMYXT', 
                                        style: AppTypography.displaySmall.copyWith(
                                          color: isDark ? Colors.white : AppColors.primaryDark, 
                                          fontSize: 22, 
                                          fontWeight: FontWeight.w700
                                        )),
                                    ],
                                  ),
                                ),
                                _buildShareButton(context),
                              ],
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Settings & Tools
                      Text('Settings & Tools', 
                        style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 16),
                      FadeInUp(
                        delay: const Duration(milliseconds: 200),
                        child: PremiumCard(
                          opacity: 0.1,
                          borderRadius: 28,
                          child: Column(
                            children: [
                              _buildSettingsItem(context, Icons.edit_note_rounded, 'Update Profile', 
                                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen()))),
                              _buildSettingsItem(context, Icons.person_pin_rounded, 'About', () {}),
                              _buildSettingsItem(context, Icons.control_camera_rounded, 'Add Smart Device', () {}),
                              _buildSettingsItem(context, Icons.local_hospital_rounded, 'Favorite Veterinarians', 
                                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoriteVetsScreen()))),
                              _buildSettingsItem(context, Icons.history_rounded, 'My Orders', 
                                () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen())), isLast: true),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 120),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 16),
        Expanded(
          child: Text(text, 
            style: AppTypography.bodyMedium.copyWith(
              fontWeight: FontWeight.w600, 
              color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.8)
            )),
        ),
      ],
    );
  }

  Widget _buildLogoutButton(BuildContext context, AppStateRepository state) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.mediumImpact();
        state.logout();
        Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (r) => false);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.dangerRed.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.logout_rounded, size: 14, color: AppColors.dangerRed),
            const SizedBox(width: 8),
            Text('Logout', style: AppTypography.labelSmall.copyWith(color: AppColors.dangerRed, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _buildShareButton(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(isDark ? 0.1 : 0.4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.share_rounded, size: 16, color: isDark ? Colors.white : AppColors.primaryDark),
          const SizedBox(width: 8),
          Text('Share', 
            style: AppTypography.labelSmall.copyWith(
              color: isDark ? Colors.white : AppColors.primaryDark, 
              fontWeight: FontWeight.w700
            )),
        ],
      ),
    );
  }

  Widget _buildSettingsItem(BuildContext context, IconData icon, String label, VoidCallback onTap, {bool isLast = false}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(28),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Icon(icon, color: Theme.of(context).colorScheme.primary, size: 22),
                const SizedBox(width: 16),
                Expanded(child: Text(label, style: AppTypography.bodyLarge.copyWith(
                  fontWeight: FontWeight.w600,
                  color: Theme.of(context).textTheme.bodyLarge?.color
                ))),
                Icon(Icons.chevron_right_rounded, size: 20, color: Theme.of(context).hintColor),
              ],
            ),
          ),
          if (!isLast) const Divider(height: 1, indent: 60, endIndent: 20),
        ],
      ),
    );
  }
}
