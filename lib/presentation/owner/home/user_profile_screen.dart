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
import '../../../core/services/firebase_storage_service.dart';
import '../../common_widgets/premium_card.dart';
import '../../auth/login_screen.dart';
import '../services/favorite_vets_screen.dart';
import '../shop/orders_screen.dart';
import '../pets/my_pets_screen.dart';
import '../../common_widgets/tail_wagging_loader.dart';
import 'edit_profile_screen.dart';
import 'notification_screen.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../../common_widgets/micro_animations/bouncing_widget.dart';

class UserProfileScreen extends StatefulWidget {
  const UserProfileScreen({super.key});

  @override
  State<UserProfileScreen> createState() => _UserProfileScreenState();
}

class _UserProfileScreenState extends State<UserProfileScreen> {
  bool _isUpdatingPhoto = false;

  Future<void> _updateProfilePhoto() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
    );

    if (pickedFile != null) {
      setState(() => _isUpdatingPhoto = true);
      HapticFeedback.mediumImpact();

      final file = File(pickedFile.path);
      final uploadedUrl = await FirebaseStorageService().uploadImage(
        file,
        'profile_pics',
      );

      if (uploadedUrl != null) {
        final repo = context.read<AppStateRepository>();
        await repo.updateProfile(
          name: repo.currentUser!.name,
          photoUrl: uploadedUrl,
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile photo updated! ✨'),
              backgroundColor: AppColors.healthGreen,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to upload photo.'),
              backgroundColor: AppColors.dangerRed,
            ),
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

    if (user == null)
      return const Scaffold(body: TailWaggingLoader(useBottomPosition: true));

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
                      child: const Icon(
                        Icons.pets_rounded,
                        size: 300,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  // Centered Avatar
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 40),
                        _buildAvatarSection(user),
                        const SizedBox(height: 16),
                        FadeInDown(
                          child: Text(
                            user.name,
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        FadeInUp(
                          child: Container(
                            margin: const EdgeInsets.only(top: 6),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.24),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              user.role.displayName.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1,
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
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Colors.black26,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.logout_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
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
              padding: const EdgeInsets.fromLTRB(20, 40, 20, 100),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(32),
                ),
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
                  const SizedBox(height: 10),
                  _buildContactCard(context, user),
                  const SizedBox(height: 28),

                  // Care & Services Group
                  _buildSectionHeader('Care & Services'),
                  const SizedBox(height: 10),
                  _buildGroupedCard(children: [
                    _buildSettingsRow(
                      icon: Icons.local_mall_rounded,
                      iconColor: AppColors.healthGreen,
                      title: 'My Orders',
                      subtitle: '${state.orders.length} items',
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const OrdersScreen()),
                      ),
                    ),
                    _buildDivider(isDark),
                    _buildSettingsRow(
                      icon: Icons.favorite_rounded,
                      iconColor: const Color(0xFFE91E63),
                      title: 'Favorite Specialists',
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const FavoriteVetsScreen(),
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 28),

                  const SizedBox(height: 40),
                  // Preferences Group
                  _buildSectionHeader('Preferences'),
                  const SizedBox(height: 10),
                  _buildPreferencesGroup(context, state, isDark),
                  const SizedBox(height: 28),

                  // Rewards & Referral
                  _buildSectionHeader('Rewards & Referral'),
                  const SizedBox(height: 10),
                  _buildRewardsBanner(context, user),
                  const SizedBox(height: 28),

                  const SizedBox(height: 40),
                  // Support & Legal
                  _buildSectionHeader('Support & Legal'),
                  const SizedBox(height: 10),
                  _buildGroupedCard(children: [
                    _buildSettingsRow(
                      icon: Icons.shield_outlined,
                      iconColor: const Color(0xFF26A69A),
                      title: 'Privacy Policy & Terms',
                      onTap: () async {
                        final url =
                            Uri.parse('https://petmaya.app/privacy-policy');
                        try {
                          await launchUrl(
                            url,
                            mode: LaunchMode.externalApplication,
                          );
                        } catch (e) {
                          debugPrint('[PrivacyLink] Error launching url: $e');
                        }
                      },
                    ),
                    _buildDivider(isDark),
                    _buildSettingsRow(
                      icon: Icons.info_outline_rounded,
                      iconColor: Colors.grey,
                      title: 'App Version',
                      subtitle: 'v2.4.0 (Build 42)',
                      showChevron: false,
                    ),
                  ]),
                  const SizedBox(height: 28),

                  // Sign Out
                  _buildSignOutButton(context, state),

                  const SizedBox(height: 32),
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
              Text(
                'Supported by ',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
              GestureDetector(
                onTap: () async {
                  final url = Uri.parse('https://vertexhand.vercel.app/');
                  try {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  } catch (e) {
                    debugPrint('[PartnerLink] Could not launch: $e');
                  }
                },
                child: Text(
                  'VertexHand',
                  style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    decoration: TextDecoration.underline,
                    decorationColor: AppColors.primary.withValues(alpha: 0.3),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Developed by MASA',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
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
            backgroundImage:
                (user.photoUrl != null && user.photoUrl!.isNotEmpty)
                ? (user.photoUrl!.startsWith('http')
                      ? NetworkImage(user.photoUrl!) as ImageProvider
                      : AssetImage(user.photoUrl!) as ImageProvider)
                : null,
            child: (user.photoUrl == null || user.photoUrl!.isEmpty)
                ? const Icon(Icons.person, size: 50, color: Colors.white38)
                : null,
          ),
        ),
        if (_isUpdatingPhoto)
          const Positioned.fill(
            child: Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          ),
        Positioned(
          bottom: 0,
          right: 0,
          child: GestureDetector(
            onTap: _isUpdatingPhoto ? null : _updateProfilePhoto,
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.camera_alt_rounded,
                color: AppColors.primary,
                size: 18,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlatformStats(AppStateRepository state) {
    return Row(
      children: [
        Expanded(
          child: _buildStatItem(
            'Pets',
            '${state.pets.length}',
            Icons.pets_rounded,
            AppColors.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatItem(
            'Orders',
            '${state.orders.length}',
            Icons.shopping_bag_rounded,
            AppColors.healthGreen,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatItem(
            'Points',
            '${state.currentUser?.points ?? 0}',
            Icons.stars_rounded,
            AppColors.accentAmber,
          ),
        ),
      ],
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return BouncingWidget(
      onTap: () {},
      child: PremiumCard(
        opacity: 0.1,
        borderRadius: 24,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(height: 8),
              Text(
                value,
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  fontSize: 18,
                ),
              ),
              Text(
                label.toUpperCase(),
                style: const TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.w800,
                  color: Colors.grey,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
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
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const MyPetsScreen()),
              ),
              child: const Text(
                'VIEW ALL',
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (pets.isEmpty)
          Text(
            'No pets linked to your account.',
            style: AppTypography.bodyMedium,
          )
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
                      border: Border.all(
                        color: AppColors.borderLight,
                        width: 2,
                      ),
                    ),
                    child: CircleAvatar(
                      radius: 32,
                      backgroundImage: pet.photoUrl != null
                          ? NetworkImage(pet.photoUrl!)
                          : null,
                      child: pet.photoUrl == null
                          ? const Icon(Icons.pets, size: 16)
                          : null,
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
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                _buildInfoRow(Icons.email_rounded, 'Email', user.email),
                const Divider(height: 32),
                _buildInfoRow(
                  Icons.phone_rounded,
                  'Phone',
                  user.phone ?? 'Not set',
                ),
                const Divider(height: 32),
                _buildInfoRow(
                  Icons.location_on_rounded,
                  'Address',
                  user.address ?? 'Not set',
                ),
              ],
            ),
          ),
          Positioned(
            top: 12,
            right: 12,
            child: GestureDetector(
              onTap: () {
                HapticFeedback.selectionClick();
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.edit_rounded,
                  color: AppColors.primary,
                  size: 16,
                ),
              ),
            ),
          ),
        ],
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
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey,
                ),
              ),
              Text(
                value,
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

  Widget _buildGroupedCard({required List<Widget> children}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.08)
              : Colors.black.withValues(alpha: 0.06),
          width: 1,
        ),
        boxShadow: isDark
            ? null
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
      ),
      child: Column(children: children),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      height: 1,
      indent: 58,
      endIndent: 16,
      color: isDark
          ? Colors.white.withValues(alpha: 0.06)
          : Colors.black.withValues(alpha: 0.05),
    );
  }

  Widget _buildSettingsRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? subtitle,
    VoidCallback? onTap,
    bool showChevron = true,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap != null
            ? () {
                HapticFeedback.lightImpact();
                onTap();
              }
            : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.plusJakartaSans(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: isDark ? Colors.white : const Color(0xFF1A202C),
                  ),
                ),
              ),
              if (subtitle != null) ...[
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[500],
                  ),
                ),
                if (showChevron) const SizedBox(width: 6),
              ],
              if (showChevron)
                Icon(
                  Icons.chevron_right_rounded,
                  size: 18,
                  color: Colors.grey[400],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPreferencesGroup(
    BuildContext context,
    AppStateRepository state,
    bool isDark,
  ) {
    IconData themeIcon;
    String themeLabel;
    if (state.themeMode == ThemeMode.dark) {
      themeIcon = Icons.dark_mode_rounded;
      themeLabel = 'Dark Mode';
    } else if (state.themeMode == ThemeMode.light) {
      themeIcon = Icons.light_mode_rounded;
      themeLabel = 'Light Mode';
    } else {
      themeIcon = Icons.brightness_auto_rounded;
      themeLabel = isDark ? 'System (Dark)' : 'System (Light)';
    }

    return _buildGroupedCard(
      children: [
        _buildSettingsRow(
          icon: themeIcon,
          iconColor: const Color(0xFF5C6BC0),
          title: 'Appearance',
          subtitle: themeLabel,
          onTap: () => _showThemeModeDialog(context, state),
        ),
        _buildDivider(isDark),
        _buildSettingsRow(
          icon: Icons.notifications_rounded,
          iconColor: const Color(0xFFFF9800),
          title: 'Notifications',
          subtitle: 'Alerts & Reminders',
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NotificationScreen()),
          ),
        ),
      ],
    );
  }

  Widget _buildSignOutButton(
    BuildContext context,
    AppStateRepository state,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showLogoutDialog(context, state),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.dangerRed.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: AppColors.dangerRed.withValues(alpha: 0.2),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.logout_rounded,
                  color: AppColors.dangerRed,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  'Sign Out of Pet Maya',
                  style: GoogleFonts.plusJakartaSans(
                    color: AppColors.dangerRed,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showThemeModeDialog(BuildContext context, AppStateRepository state) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Choose App Appearance',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Select your preferred visual mode for Pet Maya',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white60 : Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 20),
                _buildThemeOptionTile(
                  context: ctx,
                  title: 'Light Theme',
                  subtitle: 'Clean, bright interface',
                  icon: Icons.light_mode_rounded,
                  iconColor: Colors.amber[700]!,
                  isSelected: state.themeMode == ThemeMode.light,
                  onTap: () {
                    state.setThemeMode(ThemeMode.light);
                    Navigator.pop(ctx);
                  },
                ),
                const SizedBox(height: 10),
                _buildThemeOptionTile(
                  context: ctx,
                  title: 'Dark Theme',
                  subtitle: 'Gentle on the eyes in low light',
                  icon: Icons.dark_mode_rounded,
                  iconColor: Colors.indigo[300]!,
                  isSelected: state.themeMode == ThemeMode.dark,
                  onTap: () {
                    state.setThemeMode(ThemeMode.dark);
                    Navigator.pop(ctx);
                  },
                ),
                const SizedBox(height: 10),
                _buildThemeOptionTile(
                  context: ctx,
                  title: 'System Default',
                  subtitle: 'Automatically sync with device settings',
                  icon: Icons.brightness_auto_rounded,
                  iconColor: AppColors.primary,
                  isSelected: state.themeMode == ThemeMode.system,
                  onTap: () {
                    state.setThemeMode(ThemeMode.system);
                    Navigator.pop(ctx);
                  },
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildThemeOptionTile({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: isSelected
          ? AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.1)
          : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey[100]),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primary : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white60 : Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                const Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.primary,
                  size: 22,
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRewardsBanner(BuildContext context, UserModel user) {
    final referralCode = user.referralCode?.isNotEmpty == true
        ? user.referralCode!
        : UserModel.generateReferralCode(user.uid);
    final state = context.read<AppStateRepository>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return FadeInUp(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark
                ? [
                    AppColors.primary.withValues(alpha: 0.25),
                    AppColors.secondary.withValues(alpha: 0.18),
                  ]
                : [
                    AppColors.primaryLight.withValues(alpha: 0.7),
                    AppColors.secondaryLight.withValues(alpha: 0.8),
                  ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: isDark
                ? AppColors.primary.withValues(alpha: 0.3)
                : AppColors.primary.withValues(alpha: 0.2),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.08),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'REFERRAL PROGRAM 🎁',
                            style: TextStyle(
                              color: AppColors.primaryDark,
                              fontWeight: FontWeight.w900,
                              fontSize: 9,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Invite Friends & Earn Points!',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: isDark
                                ? Colors.white
                                : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'New users get 15 initial points. Earn +5 points for every friend who joins with your code!',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? Colors.grey[300]
                                : AppColors.textSecondary,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 14,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.card_giftcard_rounded,
                      size: 28,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Referral Code & Actions
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  // Code pill with copy
                  InkWell(
                    onTap: () async {
                      HapticFeedback.lightImpact();
                      await Clipboard.setData(
                        ClipboardData(text: referralCode),
                      );
                      state.showToast(
                        'Referral code "$referralCode" copied! 📋',
                      );
                    },
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1B2631) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            referralCode,
                            style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                              letterSpacing: 1.2,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.copy_rounded,
                            size: 14,
                            color: AppColors.primary,
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Direct Share Button
                  InkWell(
                    onTap: () async {
                      HapticFeedback.mediumImpact();
                      final shareText =
                          'Join me on Pet Maya, the smart pet care app! 🐾 Use my referral code: $referralCode to unlock 15 welcome points and rewards.\n\nDownload: https://petmaya.app/';
                      await SharePlus.instance.share(
                        ShareParams(
                          text: shareText,
                          subject: 'Pet Maya Referral Code',
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(
                            Icons.share_rounded,
                            size: 14,
                            color: Colors.white,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'Share Invite',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Redeem friend's code button (if not already used)
                  if (user.referredBy == null || user.referredBy!.isEmpty)
                    InkWell(
                      onTap: () => _showRedeemDialog(context, state),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.grey[800] : Colors.grey[100],
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: Colors.grey.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.input_rounded,
                              size: 14,
                              color: isDark
                                  ? Colors.white70
                                  : AppColors.textPrimary,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Have a code?',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                                color: isDark
                                    ? Colors.white70
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Referred by ${user.referredBy} ✓',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRedeemDialog(BuildContext context, AppStateRepository state) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            const Icon(Icons.card_giftcard_rounded, color: AppColors.primary),
            const SizedBox(width: 10),
            Text(
              'Redeem Referral Code',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter a friend\'s referral code to award them +5 reward points!',
              style: TextStyle(fontSize: 13, height: 1.4),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                hintText: 'e.g. PM89AC12',
                prefixIcon: const Icon(
                  Icons.confirmation_number_outlined,
                  color: AppColors.primary,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                filled: true,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final code = controller.text.trim();
              if (code.isEmpty) return;
              Navigator.pop(ctx);
              await state.redeemReferralCode(code);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: const Text(
              'Apply Code',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: const TextStyle(
        fontWeight: FontWeight.w900,
        fontSize: 11,
        color: AppColors.primary,
        letterSpacing: 1.5,
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, AppStateRepository state) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: Text(
          'Sign Out',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
        content: const Text(
          'Are you sure you want to exit your pet care portal?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CANCEL'),
          ),
          ElevatedButton(
            onPressed: () {
              state.logout();
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (r) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text('LOGOUT', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
