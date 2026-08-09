import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../core/services/cloudinary_service.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/status_chip.dart';
import '../../auth/login_screen.dart';
import '../services/favorite_vets_screen.dart';
import '../shop/orders_screen.dart';
import '../pets/my_pets_screen.dart';
import '../../common_widgets/tail_wagging_loader.dart';
import 'edit_profile_screen.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

class UserProfileScreen extends StatefulWidget {
  const UserProfileScreen({super.key});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  bool _isUpdatingPhoto = false;

  Future<void> _updateProfilePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    
    if (pickedFile != null) {
      setState(() => _isUpdatingPhoto = true);
      HapticFeedback.mediumImpact();
      
      final file = File(pickedFile.path);
      final uploadedUrl = await CloudinaryService().uploadImage(file, 'profile_pics');
      
      if (uploadedUrl != null) {
        final repo = context.read<AppStateRepository>();
        await repo.updateProfile(
          name: repo.currentUser!.name,
          photoUrl: uploadedUrl,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile photo updated! ✨'), backgroundColor: AppColors.healthGreen),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to upload photo.'), backgroundColor: AppColors.dangerRed),
          );
        }
      }
      
      if (mounted) setState(() => _isUpdatingPhoto = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final user = state.currentUser;
    final pets = state.pets;

    if (user == null) return const Scaffold(body: TailWaggingLoader(useBottomPosition: true));

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Premium Parallax Header
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            stretch: true,
            automaticallyImplyLeading: false,
            backgroundColor: AppColors.primary,
            systemOverlayStyle: SystemUiOverlayStyle.light,
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Gradient Background
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.primary, AppColors.primaryDark],
                      ),
                    ),
                  ),
                  // Background Pattern
                  Positioned(
                    right: -40,
                    top: -20,
                    child: Opacity(
                      opacity: 0.08,
                      child: const Icon(Icons.pets_rounded, size: 300, color: Colors.white),
                    ),
                  ),
                  // Centered Avatar
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 40),
                        _buildAvatarSection(user!),
                        const SizedBox(height: 16),
                        FadeInDown(
                          child: Text(user.name, 
                            style: GoogleFonts.fredoka(
                              color: Colors.white, 
                              fontSize: 26, 
                              fontWeight: FontWeight.w700
                            )),
                        ),
                        FadeInUp(
                          child: Container(
                            margin: const EdgeInsets.only(top: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.24),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(user.role.displayName.toUpperCase(), 
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Colors.black26, shape: BoxShape.circle),
                  child: const Icon(Icons.logout_rounded, color: Colors.white, size: 18),
                ),
                onPressed: () => _showLogoutDialog(context, state),
              ),
              const SizedBox(width: 8),
            ],
          ),

          // 2. Profile Content
          SliverToBoxAdapter(
            child: Container(
              transform: Matrix4.translationValues(0, -30, 0),
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 32),

                  // Quick Stats Row
                  _buildPlatformStats(state),
                  const SizedBox(height: 32),

                  // Pet Family Section
                  _buildPetFamilySection(context, pets),
                  const SizedBox(height: 32),

                  // Contact Card
                  _buildSectionHeader('Personal Details'),
                  const SizedBox(height: 16),
                  _buildContactCard(context, user),
                  const SizedBox(height: 32),

                  // Settings Grid
                  _buildSectionHeader('Account & Security'),
                  const SizedBox(height: 16),
                  _buildSettingsGrid(context),
                  
                  const SizedBox(height: 40),
                  _buildRewardsBanner(context, user),

                  const SizedBox(height: 40),
                  _buildPartnerBranding(context),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPartnerBranding(BuildContext context) {
    return Center(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Supported by ', 
                style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.w600)),
              GestureDetector(
                onTap: () async {
                  final url = Uri.parse('https://vertexhand.vercel.app/');
                  try {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  } catch (e) {
                    debugPrint('[PartnerLink] Could not launch: $e');
                  }
                },
                child: Text('VertexHand', 
                  style: TextStyle(
                    color: AppColors.primary, 
                    fontSize: 11, 
                    fontWeight: FontWeight.w900,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.primary.withValues(alpha: 0.3),
                  )),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text('Developed by MASA', 
            style: TextStyle(color: Colors.grey[400], fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
        ],
      ),
    );
  }

  Widget _buildAvatarSection(UserModel user) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white38, width: 2),
          ),
          child: CircleAvatar(
            radius: 54,
            backgroundColor: Colors.white.withValues(alpha: 0.1),
            backgroundImage: (user.photoUrl != null && user.photoUrl!.isNotEmpty)
                ? NetworkImage(user.photoUrl!)
                : null,
            child: (user.photoUrl == null || user.photoUrl!.isEmpty)
                ? const Icon(Icons.person, size: 50, color: Colors.white38)
                : null,
          ),
        ),
        if (_isUpdatingPhoto)
          const Positioned.fill(
            child: Center(child: CircularProgressIndicator(color: Colors.white)),
          ),
        Positioned(
          bottom: 0,
          right: 0,
          child: GestureDetector(
            onTap: _isUpdatingPhoto ? null : _updateProfilePhoto,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: const Icon(Icons.camera_alt_rounded, color: AppColors.primary, size: 18),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlatformStats(AppStateRepository state) {
    return Row(
      children: [
        Expanded(child: _buildStatItem('Pets', '${state.pets.length}', Icons.pets_rounded, AppColors.primary)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatItem('Orders', '${state.orders.length}', Icons.shopping_bag_rounded, AppColors.healthGreen)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatItem('Points', '${state.currentUser?.points ?? 0}', Icons.stars_rounded, AppColors.accentAmber)),
      ],
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return PremiumCard(
      opacity: 0.1,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(value, style: GoogleFonts.fredoka(fontWeight: FontWeight.w700, fontSize: 18)),
            Text(label.toUpperCase(), style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: Colors.grey, letterSpacing: 0.5)),
          ],
        ),
      ),
    );
  }

  Widget _buildPetFamilySection(BuildContext context, List<PetModel> pets) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildSectionHeader('Pet Family'),
            TextButton(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyPetsScreen())),
              child: const Text('VIEW ALL', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 10)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (pets.isEmpty)
          Text('No pets linked to your account.', style: AppTypography.bodyMedium)
        else
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: pets.length,
              itemBuilder: (context, index) {
                final pet = pets[index];
                return Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.borderLight, width: 2),
                    ),
                    child: CircleAvatar(
                      radius: 32,
                      backgroundImage: pet.photoUrl != null ? NetworkImage(pet.photoUrl!) : null,
                      child: pet.photoUrl == null ? const Icon(Icons.pets, size: 16) : null,
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildContactCard(BuildContext context, UserModel user) {
    return PremiumCard(
      opacity: 0.1,
      borderRadius: 28,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            _buildInfoRow(Icons.email_rounded, 'Email', user.email),
            const Divider(height: 32),
            _buildInfoRow(Icons.phone_rounded, 'Phone', user.phone ?? 'Not set'),
            const Divider(height: 32),
            _buildInfoRow(Icons.location_on_rounded, 'Address', user.address ?? 'Not set'),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.08), 
            shape: BoxShape.circle
          ),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Colors.grey)),
              Text(value, 
                style: AppTypography.titleMedium.copyWith(fontSize: 14),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.2,
      children: [
        _buildSettingsCard(context, Icons.edit_note_rounded, 'Edit Profile', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen()))),
        _buildSettingsCard(context, Icons.history_rounded, 'My Orders', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrdersScreen()))),
        _buildSettingsCard(context, Icons.favorite_rounded, 'Favorite Vets', () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FavoriteVetsScreen()))),
        _buildSettingsCard(context, Icons.notifications_active_rounded, 'Notifications', () {}),
      ],
    );
  }

  Widget _buildSettingsCard(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return PremiumCard(
      onTap: onTap,
      opacity: 0.15,
      borderRadius: 20,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 20),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12))),
          ],
        ),
      ),
    );
  }

  Widget _buildRewardsBanner(BuildContext context, UserModel user) {
    return FadeInUp(
      child: PremiumCard(
        useGlass: false,
        backgroundColor: const Color(0xFFE0F2F1),
        borderRadius: 28,
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('REFERRAL PROGRAM', style: TextStyle(color: Color(0xFF00695C), fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
                    const SizedBox(height: 4),
                    Text('Invite friends & earn rewards!', style: GoogleFonts.fredoka(fontWeight: FontWeight.w700, fontSize: 15, color: Color(0xFF004D40))),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(user.referralCode ?? 'PETMAYA2026', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 1.5)),
                          const SizedBox(width: 8),
                          const Icon(Icons.copy_rounded, size: 14, color: Colors.grey),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.card_giftcard_rounded, size: 60, color: Color(0xFF00695C)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title.toUpperCase(), 
      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: AppColors.primary, letterSpacing: 1.5));
  }

  void _showLogoutDialog(BuildContext context, AppStateRepository state) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: Text('Sign Out', style: GoogleFonts.fredoka(fontWeight: FontWeight.w700)),
        content: const Text('Are you sure you want to exit your pet care portal?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () {
              state.logout();
              Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (r) => false);
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.dangerRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('LOGOUT', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
