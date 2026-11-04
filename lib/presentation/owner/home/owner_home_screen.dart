import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../common_widgets/illustrations/pet_illustrations.dart';
import '../../common_widgets/motion/soft_motion.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../../data/models/event_model.dart';
import '../../../data/models/vet_model.dart';
import '../services/vet_details_screen.dart';
import '../../common_widgets/floating_navbar.dart';
import '../pets/my_pets_screen.dart';
import '../pets/pet_details_screen.dart';
import '../pets/add_edit_pet_screen.dart';
import '../pets/ai_health_scanner_screen.dart';
import '../calendar/calendar_screen.dart';
import '../calendar/add_event_modal.dart';
import '../shop/shop_screen.dart';
import '../services/pet_services_screen.dart';
import '../community/community_feed_screen.dart';
import '../community/create_post_screen.dart';
import '../community/create_blog_screen.dart';
import 'pet_tracker_screen.dart';
import '../pets/vaccination_screen.dart';
import '../../common_widgets/resilient_network_image.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/promo_container.dart';
import '../../common_widgets/premium_toast.dart';
import '../devices/my_devices_screen.dart';
import 'user_profile_screen.dart';
import '../../common_widgets/pet_refresh_indicator.dart';
import 'notification_screen.dart';
import '../../../core/responsive.dart';
import 'hero_pet_carousel.dart';

class OwnerHomeScreen extends StatefulWidget {
  const OwnerHomeScreen({super.key});

  @override
  State<OwnerHomeScreen> createState() => _OwnerHomeScreenState();
}

class _OwnerHomeScreenState extends State<OwnerHomeScreen> {
  int _currentNavIndex = 0;
  final Set<int> _activatedTabs = {0};

  void _onTabSelected(int index) {
    if (_currentNavIndex != index) {
      setState(() {
        _currentNavIndex = index;
        _activatedTabs.add(index);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      // Full width shell: each tab caps its own content, the dock caps itself.
      maxContentWidth: double.infinity,
      body: Stack(
        children: [
          Column(
            children: [
              _buildSystemBanner(context),
              Expanded(
                child: IndexedStack(
                  index: _currentNavIndex,
                  children: [
                    ResponsiveCenter(
                      child: HomeDashboardFragment(
                        onNavRequested: _onTabSelected,
                      ),
                    ), // 0
                    _activatedTabs.contains(1)
                        ? const PetServicesScreen()
                        : const SizedBox.shrink(), // 1
                    _activatedTabs.contains(2)
                        ? const CommunityFeedScreen()
                        : const SizedBox.shrink(), // 2
                    _activatedTabs.contains(3)
                        ? const ResponsiveCenter(child: UserProfileScreen())
                        : const SizedBox.shrink(), // 3
                    _activatedTabs.contains(4)
                        ? const ShopScreen()
                        : const SizedBox.shrink(), // 4
                  ],
                ),
              ),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: FloatingNavbar(
              selectedIndex: _currentNavIndex > 3 ? 1 : _currentNavIndex,
              onItemTapped: _onTabSelected,
              onFabTapped: () => _showQuickActionSheet(context),
            ),
          ),
          // Floating Promo Overlay
          const PromoContainer(),
        ],
      ),
    );
  }

  Widget _buildSystemBanner(BuildContext context) {
    final banner = context.select(
      (AppStateRepository repo) => repo.systemBanner,
    );
    if (banner == null || banner.isEmpty) return const SizedBox.shrink();

    return FadeInDown(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: SafeArea(
          bottom: false,
          child: Row(
            children: [
              const Icon(Icons.campaign_rounded, color: Colors.white, size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  banner,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(
                  Icons.close_rounded,
                  color: Colors.white70,
                  size: 16,
                ),
                onPressed: () =>
                    context.read<AppStateRepository>().setSystemBanner(null),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showQuickActionSheet(BuildContext context) {
    HapticFeedback.mediumImpact();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 36),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Quick actions',
                    style: AppTypography.headlineMedium.copyWith(
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.close_rounded,
                      color: isDark ? Colors.white54 : Colors.grey[600],
                    ),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Wrap(
                spacing: 20,
                runSpacing: 20,
                alignment: WrapAlignment.center,
                children: [
                  _buildQuickActionBtn(
                    ctx,
                    Icons.auto_awesome_rounded,
                    'AI Scanner',
                    AppColors.primary,
                    () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AiHealthScannerScreen(),
                        ),
                      );
                    },
                  ),
                  _buildQuickActionBtn(
                    ctx,
                    Icons.pets_rounded,
                    'Add Pet',
                    AppColors.healthGreen,
                    () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AddEditPetScreen(),
                        ),
                      );
                    },
                  ),
                  _buildQuickActionBtn(
                    ctx,
                    Icons.edit_note_rounded,
                    'Create Post',
                    const Color(0xFF1877F2),
                    () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const CreatePostScreen(),
                        ),
                      );
                    },
                  ),
                  _buildQuickActionBtn(
                    ctx,
                    Icons.article_rounded,
                    'Write Blog',
                    AppColors.tertiary,
                    () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const CreateBlogScreen(),
                        ),
                      );
                    },
                  ),
                  _buildQuickActionBtn(
                    ctx,
                    Icons.event_note_rounded,
                    'Add Event',
                    AppColors.accentAmber,
                    () {
                      Navigator.pop(ctx);
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => const AddEventModal(),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActionBtn(
    BuildContext ctx,
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    final isDark = Theme.of(ctx).brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: color.withValues(alpha: isDark ? 0.22 : 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: color.withValues(alpha: isDark ? 0.35 : 0.25),
                width: 1.5,
              ),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white70 : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class HomeDashboardFragment extends StatelessWidget {
  final Function(int)? onNavRequested;

  const HomeDashboardFragment({super.key, this.onNavRequested});

  @override
  Widget build(BuildContext context) {
    final user = context.select(
      (AppStateRepository state) => state.currentUser,
    );
    final pets = context.select((AppStateRepository state) => state.pets);
    final allRecords = context.select(
      (AppStateRepository state) => state.serviceRecords,
    );
    final allEvents = context.select(
      (AppStateRepository state) => state.events,
    );
    // Filter for truly upcoming events: Not completed, and occurring today or in the future
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final events = allEvents
        .where(
          (e) =>
              !e.isCompleted &&
              (e.date.isAtSameMomentAs(today) || e.date.isAfter(today)),
        )
        .toList();
    final vets = context.select((AppStateRepository state) => state.vets);
    final state = context.read<AppStateRepository>();

    final size = MediaQuery.of(context).size;

    return PetRefreshIndicator(
      onRefresh: () async {
        if (user != null) await state.syncFromFirebase(user);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
          SliverToBoxAdapter(
            child: RepaintBoundary(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, size.height * 0.07, 20, 16),
                child: Reveal(
                  child: _buildPremiumHeader(
                    context,
                    user,
                    petCount: pets.length,
                    eventCount: events.length,
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (pets.isNotEmpty)
                  RepaintBoundary(
                    child: Reveal(
                      index: 1,
                      child: HeroPetCarousel(pets: pets, allRecords: allRecords),
                    ),
                  ),

                // ─── MY PETS ────────────────────────────────────────────
                _sectionHeader(
                  context,
                  'My pets',
                  onSeeAll: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const MyPetsScreen()),
                  ),
                ),
                SizedBox(
                  height: 232,
                  child: pets.isEmpty
                      ? _buildEmptyPetsPlaceholder(context)
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          scrollDirection: Axis.horizontal,
                          itemCount: pets.length,
                          itemBuilder: (context, index) => Reveal(
                            index: index,
                            child: _buildVerticalPetCard(context, pet: pets[index], allRecords: allRecords),
                          ),
                        ),
                ),

                // ─── SMART CARE HUB ─────────────────────────────────────
                _sectionHeader(context, 'Smart care hub', topGap: 28),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: RepaintBoundary(
                    child: _buildBentoServicesGrid(context, pets, events, onNavRequested),
                  ),
                ),

                // ─── UPCOMING EVENTS ────────────────────────────────────
                _sectionHeader(
                  context,
                  'Upcoming events',
                  topGap: 28,
                  onSeeAll: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CalendarScreen()),
                  ),
                ),
                if (events.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Reveal(child: _buildNoEventsCard(context)),
                  )
                else
                  SizedBox(
                    height: 190,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      itemCount: events.length > 5 ? 5 : events.length,
                      itemBuilder: (context, index) => Reveal(
                        index: index,
                        child: _buildUpcomingEventCard(context, events[index], state),
                      ),
                    ),
                  ),

                // ─── TOP VETERINARIANS ──────────────────────────────────
                _sectionHeader(
                  context,
                  'Top veterinarians',
                  topGap: 28,
                  onSeeAll: () => onNavRequested?.call(1),
                ),
                if (vets.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      'No vets are listed yet. Please check back soon.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  )
                else
                  ...vets
                      .where((v) => v.tag.toLowerCase().contains('vet'))
                      .take(3)
                      .toList()
                      .asMap()
                      .entries
                      .map((e) => Reveal(index: e.key, child: _buildDetailedVetCard(context, e.value))),

                const SizedBox(height: 160), // clears the floating navbar
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// A section title with an optional "See all" that is a proper 48 px tap target.
  Widget _sectionHeader(BuildContext context, String title, {VoidCallback? onSeeAll, double topGap = 8}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, topGap, 12, 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: AppTypography.headlineSmall.copyWith(color: isDark ? Colors.white : AppColors.textPrimary),
            ),
          ),
          if (onSeeAll != null)
            TextButton(
              onPressed: onSeeAll,
              style: TextButton.styleFrom(minimumSize: const Size(64, 44)),
              child: const Text('See all'),
            ),
        ],
      ),
    );
  }

  Widget _buildNoEventsCard(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 12, 16, 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: AppShadows.soft(isDark),
      ),
      child: Row(
        children: [
          const SoftIllustration(scene: IllustrationScene.noAppointments, size: 104),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Nothing planned yet', style: AppTypography.titleMedium.copyWith(color: isDark ? Colors.white : AppColors.textPrimary)),
                const SizedBox(height: 4),
                Text(
                  'Add a vaccination, grooming or vet visit and we will remind you.',
                  style: AppTypography.bodySmall.copyWith(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                ),
                const SizedBox(height: 6),
                TextButton(
                  onPressed: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const AddEventModal(),
                  ),
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(64, 44), alignment: Alignment.centerLeft),
                  child: const Text('Add an event'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBentoServicesGrid(
    BuildContext context,
    List<PetModel> pets,
    List<EventModel> events,
    Function(int)? onNavRequested,
  ) {
    final primaryPet = pets.isNotEmpty ? pets.first : null;
    final repo = context.watch<AppStateRepository>();
    final hasGpsDevice = repo.devices.any((d) => d.deviceType == 'gps_collar' || d.isOnline);

    void openRadar() {
      if (!hasGpsDevice) {
        repo.showToast(
          'No GPS device paired yet. Pair a tracker to use the live radar.',
          type: ToastType.warning,
          context: context,
        );
        Navigator.push(context, MaterialPageRoute(builder: (_) => const MyDevicesScreen()));
        return;
      }
      if (primaryPet != null) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => PetTrackerScreen(pet: primaryPet)));
      }
    }

    final radar = _SoftTile(
      icon: Icons.radar_rounded,
      title: 'GPS Radar',
      subtitle: hasGpsDevice ? 'Live location and safe zones' : 'No tracker paired. Tap to pair.',
      badge: hasGpsDevice ? 'Live' : 'Not set up',
      tint: AppColors.sky,
      ink: AppColors.skyInk,
      onTap: openRadar,
    );
    final scan = _SoftTile(
      icon: Icons.auto_awesome_rounded,
      title: 'AI Health Scan',
      subtitle: 'Quick guidance from a photo and symptoms',
      badge: 'AI',
      tint: AppColors.lilac,
      ink: AppColors.lilacInk,
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AiHealthScannerScreen())),
    );
    final vaccines = _SoftTile(
      icon: Icons.vaccines_rounded,
      title: 'Vaccine Hub',
      subtitle: 'Schedule, doses and reminders',
      badge: pets.isNotEmpty ? '${pets.first.healthIndex}% health' : 'Vault',
      tint: AppColors.mintSoft,
      ink: AppColors.mintInk,
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VaccinationScreen(initialPet: primaryPet))),
    );
    final shop = _SoftTile(
      icon: Icons.shopping_bag_rounded,
      title: 'Care Shop',
      subtitle: 'Prescription diets, food and treats',
      badge: 'Pharmacy',
      tint: AppColors.peach,
      ink: AppColors.peachInk,
      onTap: () => onNavRequested?.call(4),
    );
    final community = _SoftTile(
      icon: Icons.groups_rounded,
      title: 'Community and vet feed',
      subtitle: 'Connect with 10k+ pet parents & clinicians',
      tint: AppColors.butter,
      ink: AppColors.butterInk,
      wide: true,
      onTap: () => onNavRequested?.call(2),
    );

    return Column(
      children: [
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: Reveal(index: 0, child: radar)),
              const SizedBox(width: 14),
              Expanded(child: Reveal(index: 1, child: scan)),
            ],
          ),
        ),
        const SizedBox(height: 14),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: Reveal(index: 2, child: vaccines)),
              const SizedBox(width: 14),
              Expanded(child: Reveal(index: 3, child: shop)),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Reveal(index: 4, child: community),
      ],
    );
  }

  Widget _buildVerticalPetCard(
    BuildContext context, {
    required PetModel pet,
    required List<ServiceRecordModel> allRecords,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLandscape = MediaQuery.of(context).orientation == Orientation.landscape;
    final cardWidth = isLandscape ? 150.0 : 160.0;
    final hasMedicalLogs =
        allRecords.any((r) => r.petId == pet.petID) ||
        (pet.vaccinationDetails?.trim().isNotEmpty == true);
    final score = hasMedicalLogs ? pet.healthIndex.clamp(0, 100) : 0;

    // Each kind of animal gets its own pastel, so a family of pets is easy to tell apart at a glance.
    final (tint, ink) = switch (pet.resolvedSpecies) {
      'Dog' => (AppColors.peach, AppColors.peachInk),
      'Cat' => (AppColors.lilac, AppColors.lilacInk),
      'Bird' || 'Fish' => (AppColors.sky, AppColors.skyInk),
      'Rabbit' || 'Rodent' => (AppColors.rose, AppColors.roseInk),
      _ => (AppColors.mintSoft, AppColors.mintInk),
    };
    final bg = isDark ? Color.alphaBlend(tint.withValues(alpha: 0.14), AppColors.surfaceDark) : tint;
    final ringColor = hasMedicalLogs ? AppColors.healthGreen : AppColors.accentAmber;
    final reduce = SoftMotion.reduced(context);

    Widget avatar = ClipOval(
      child: pet.photoUrl != null && pet.photoUrl!.isNotEmpty
          ? ResilientNetworkImage(
              imageUrl: pet.photoUrl!,
              width: 68,
              height: 68,
              fit: BoxFit.cover,
              fallbackAssetPath: 'assets/images/pet_placeholder.png',
            )
          : SizedBox(width: 68, height: 68, child: _buildPetErrorIcon(context)),
    );

    final statusText = hasMedicalLogs ? '$score% healthy' : 'No health log';

    return Container(
      width: cardWidth,
      margin: const EdgeInsets.only(left: 16, right: 4, bottom: 10),
      child: Semantics(
        button: true,
        label: '${pet.name}, ${pet.breed}. $statusText',
        excludeSemantics: true,
        child: Pressable(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => PetDetailsScreen(petId: pet.petID)),
          ),
          child: Container(
            padding: const EdgeInsets.fromLTRB(12, 14, 12, 12),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              boxShadow: AppShadows.soft(isDark, tint: ink),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Photo in a white ring, wrapped by a health arc that fills in when the card appears.
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDark : Colors.white,
                        shape: BoxShape.circle,
                      ),
                    ),
                    SizedBox(
                      width: 86,
                      height: 86,
                      child: TweenAnimationBuilder<double>(
                        tween: Tween(begin: 0, end: score / 100.0),
                        duration: reduce ? Duration.zero : const Duration(milliseconds: 900),
                        curve: SoftMotion.out,
                        builder: (context, v, _) => CircularProgressIndicator(
                          value: v,
                          strokeWidth: 4,
                          strokeCap: StrokeCap.round,
                          backgroundColor: ringColor.withValues(alpha: 0.18),
                          valueColor: AlwaysStoppedAnimation<Color>(ringColor),
                        ),
                      ),
                    ),
                    avatar,
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  pet.name,
                  style: AppTypography.titleMedium.copyWith(
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  pet.breed,
                  style: AppTypography.bodySmall.copyWith(color: isDark ? AppColors.textSecondaryDark : ink),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.85),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        hasMedicalLogs ? Icons.favorite_rounded : Icons.edit_note_rounded,
                        size: 13,
                        color: hasMedicalLogs ? AppColors.mintInk : AppColors.butterInk,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          statusText,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.labelSmall.copyWith(
                            color: isDark ? Colors.white : (hasMedicalLogs ? AppColors.mintInk : AppColors.butterInk),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPetErrorIcon(BuildContext context) {
    return Container(
      color: Theme.of(context).dividerColor.withValues(alpha: 0.1),
      child: Icon(Icons.pets, size: 24, color: Theme.of(context).hintColor),
    );
  }

  Widget _buildEmptyPetsPlaceholder(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 4, 20, 8),
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        boxShadow: AppShadows.soft(isDark),
      ),
      child: Row(
        children: [
          const SoftIllustration(scene: IllustrationScene.noPets, size: 130),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Meet your pet',
                  style: AppTypography.titleMedium.copyWith(color: isDark ? Colors.white : AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  'Add a pet to start their health vault.',
                  style: AppTypography.bodySmall.copyWith(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary),
                ),
                const SizedBox(height: 6),
                TextButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditPetScreen())),
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(64, 44), alignment: Alignment.centerLeft),
                  child: const Text('Add your first pet'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingEventCard(
    BuildContext context,
    EventModel evt,
    AppStateRepository state,
  ) {
    final dateStr = DateFormat('MMM d, yyyy').format(evt.date);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenWidth = MediaQuery.of(context).size.width;

    return Container(
      width:
          screenWidth *
          0.75, // Take 75% of screen width to show peek of next card
      margin: const EdgeInsets.only(left: 4, right: 12, bottom: 12, top: 4),
      child: PremiumCard(
        useGlass: false,
        backgroundColor: isDark
            ? Theme.of(context).cardColor
            : const Color(0xFFEDF4F8),
        borderRadius: 24,
        onTap: () {
          HapticFeedback.lightImpact();
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => AddEventModal(event: evt),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      evt.category.toUpperCase(),
                      style: const TextStyle(
                        color: Color(0xFF1AB680),
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        dateStr,
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.grey,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '${evt.fromTime} - ${evt.toTime}',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Colors.grey,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                evt.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(
                    Icons.pets_rounded,
                    size: 14,
                    color: isDark ? Colors.white70 : Colors.grey,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    evt.petName,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white70 : Colors.grey,
                      fontWeight: FontWeight.w700,
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

  void _showRewardsModal(BuildContext context, UserModel user) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final repo = context.read<AppStateRepository>();
    final referralCode = user.referralCode?.isNotEmpty == true
        ? user.referralCode!
        : UserModel.generateReferralCode(user.uid);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: EdgeInsets.fromLTRB(
            24,
            20,
            24,
            MediaQuery.of(ctx).viewInsets.bottom + 28,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
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
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Title & Balance Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Referral & Reward Points',
                        style: GoogleFonts.nunito(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Earn +100 points for every friend who joins',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7B1FA2).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFF7B1FA2).withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.stars_rounded, color: Color(0xFF7B1FA2), size: 18),
                        const SizedBox(width: 6),
                        Text(
                          '${user.points} PM',
                          style: GoogleFonts.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF7B1FA2),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Referral Code Container
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1FAF5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.25),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'YOUR REFERRAL CODE',
                      style: GoogleFonts.nunito(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF0F172A) : Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
                            ),
                            child: Text(
                              referralCode,
                              style: GoogleFonts.nunito(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2.0,
                                color: isDark ? Colors.white : Colors.black87,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        IconButton.filled(
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: referralCode));
                            HapticFeedback.mediumImpact();
                            repo.showToast('Referral code "$referralCode" copied! 📋', context: ctx);
                          },
                          icon: const Icon(Icons.copy_rounded, size: 20),
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.all(14),
                          ),
                        ),
                        const SizedBox(width: 6),
                        IconButton.filled(
                          onPressed: () {
                            HapticFeedback.lightImpact();
                            Share.share(
                              'Join me on Pet Maya, the smart pet care app! 🐾 Use my referral code: $referralCode to unlock welcome rewards!',
                            );
                          },
                          icon: const Icon(Icons.share_rounded, size: 20),
                          style: IconButton.styleFrom(
                            backgroundColor: const Color(0xFF0288D1),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.all(14),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Redeem Info Banner
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.grey.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.card_giftcard_rounded, color: AppColors.primary, size: 22),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Points can be redeemed for shop discounts or free veterinary consultation credits!',
                        style: TextStyle(
                          fontSize: 12,
                          height: 1.35,
                          color: isDark ? Colors.white70 : Colors.black87,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Close Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text(
                    'CLOSE',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.8),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPremiumHeader(
    BuildContext context,
    UserModel? user, {
    int petCount = 0,
    int eventCount = 0,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hour = DateTime.now().hour;
    String greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    if (hour >= 17) greeting = 'Good evening';

    final isLandscape = MediaQuery.of(context).orientation == Orientation.landscape;
    final ink = isDark ? Colors.white : AppColors.textPrimary;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondary;
    final hasPhoto = user?.photoUrl != null && user!.photoUrl!.isNotEmpty;
    final summary = petCount == 0
        ? 'Add a pet to get started'
        : '$petCount ${petCount == 1 ? 'pet' : 'pets'} · $eventCount upcoming';

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: isLandscape ? 12 : 16),
      decoration: BoxDecoration(
        gradient: isDark ? null : AppColors.sunriseGradient,
        color: isDark ? AppColors.surfaceDark : null,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        boxShadow: AppShadows.soft(isDark, tint: AppColors.peachInk),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: CircleAvatar(
              radius: isLandscape ? 22 : 26,
              backgroundColor: AppColors.primaryLight,
              backgroundImage: hasPhoto
                  ? (user.photoUrl!.startsWith('http')
                        ? CachedNetworkImageProvider(user.photoUrl!) as ImageProvider
                        : AssetImage(user.photoUrl!) as ImageProvider)
                  : null,
              child: hasPhoto ? null : const Icon(Icons.person_rounded, color: AppColors.primaryDark),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(greeting, style: AppTypography.labelMedium.copyWith(color: isDark ? muted : AppColors.peachInk), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(
                  user?.name ?? 'Pet Maya friend',
                  style: AppTypography.headlineMedium.copyWith(color: ink, fontSize: isLandscape ? 17 : 20),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(summary, style: AppTypography.bodySmall.copyWith(color: muted), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (!isLandscape) ...[
            Semantics(
              button: true,
              label: '${user?.points ?? 15} points. Open rewards',
              excludeSemantics: true,
              child: Pressable(
                onTap: () {
                  if (user != null) _showRewardsModal(context, user);
                },
                child: Container(
                  constraints: const BoxConstraints(minHeight: 44),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.butter.withValues(alpha: 0.16) : Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.stars_rounded, color: isDark ? AppColors.warningYellow : const Color(0xFFB07A00), size: 18),
                      const SizedBox(width: 5),
                      CountUp(
                        value: user?.points ?? 15,
                        style: AppTypography.titleSmall.copyWith(color: isDark ? Colors.white : AppColors.butterInk, fontWeight: FontWeight.w900),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Consumer<AppStateRepository>(
            builder: (context, repo, _) {
              final unreadCount = repo.notifications.where((n) => !n.isRead).length;
              return Semantics(
                button: true,
                label: unreadCount > 0 ? 'Notifications, $unreadCount unread' : 'Notifications',
                excludeSemantics: true,
                child: Pressable(
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen())),
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Stack(
                      clipBehavior: Clip.none,
                      alignment: Alignment.center,
                      children: [
                        Icon(Icons.notifications_rounded, color: isDark ? Colors.white : AppColors.skyInk, size: 22),
                        if (unreadCount > 0)
                          Positioned(
                            top: 6,
                            right: 5,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                              decoration: BoxDecoration(color: AppColors.dangerRedDeep, borderRadius: BorderRadius.circular(8)),
                              alignment: Alignment.center,
                              child: Text(
                                unreadCount > 9 ? '9+' : '$unreadCount',
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800, height: 1),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedVetCard(BuildContext context, VetModel vet) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: PremiumCard(
        opacity: 0.15,
        borderRadius: 32,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => VetDetailsScreen(vet: vet)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Theme.of(
                          context,
                        ).colorScheme.onPrimary.withValues(alpha: 0.5),
                        width: 2,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: CachedNetworkImage(
                        imageUrl: vet.photoUrl ?? '',
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                        errorWidget: (c, u, e) => Container(
                          color: Theme.of(
                            context,
                          ).dividerColor.withValues(alpha: 0.1),
                          child: Icon(
                            Icons.person,
                            color: Theme.of(context).hintColor,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          vet.name,
                          style: Theme.of(context).textTheme.titleLarge
                              ?.copyWith(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        Text(
                          vet.qualification,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              size: 14,
                              color: AppColors.accentAmber,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              vet.reviewsCount == 0 ? 'NEW' : '${vet.rating}',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.accentAmber,
                                  ),
                            ),
                            Flexible(
                              child: Text(
                                vet.reviewsCount == 0
                                    ? ''
                                    : ' (${vet.reviewsCount} reviews)',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0x99051E1C)
                      : Theme.of(context).cardColor.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark
                        ? const Color(0x2B1AB680)
                        : Colors.transparent,
                    width: 0.8,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'PROFESSIONAL PROFILE',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Experienced in complex surgeries and preventive care for small animals.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      _buildMiniBadge(
                        context,
                        Icons.work_rounded,
                        '${vet.experience} Exp',
                      ),
                      const SizedBox(width: 8),
                      _buildMiniBadge(
                        context,
                        Icons.history_rounded,
                        'N/A Last',
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Text(
                          'Start',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.onPrimary,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 14,
                          color: Theme.of(context).colorScheme.onPrimary,
                        ),
                      ],
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

  Widget _buildMiniBadge(BuildContext context, IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, size: 10, color: Theme.of(context).iconTheme.color),
          const SizedBox(width: 4),
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelSmall?.copyWith(fontSize: 9),
          ),
        ],
      ),
    );
  }
}


/// A pastel tile for the Smart care hub: a round icon, a title and one line of help, plus an optional status pill.
class _SoftTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? badge;
  final Color tint;
  final Color ink;
  final bool wide;
  final VoidCallback onTap;

  const _SoftTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.tint,
    required this.ink,
    required this.onTap,
    this.badge,
    this.wide = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = isDark ? Color.alphaBlend(tint.withValues(alpha: 0.14), AppColors.surfaceDark) : tint;
    final titleColor = isDark ? Colors.white : AppColors.textPrimary;
    final bodyColor = isDark ? AppColors.textSecondaryDark : ink;
    final iconColor = isDark ? tint : ink;

    final iconBubble = Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(icon, color: iconColor, size: 24),
    );

    final badgePill = badge == null
        ? null
        : Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              badge!,
              style: AppTypography.labelSmall.copyWith(color: isDark ? Colors.white : ink, fontWeight: FontWeight.w800),
            ),
          );

    final texts = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(title, style: AppTypography.titleMedium.copyWith(color: titleColor, fontWeight: FontWeight.w800)),
        const SizedBox(height: 3),
        Text(subtitle, style: AppTypography.bodySmall.copyWith(color: bodyColor, height: 1.35), maxLines: 2, overflow: TextOverflow.ellipsis),
      ],
    );

    return Semantics(
      button: true,
      label: '$title. $subtitle',
      excludeSemantics: true,
      onTap: onTap,
      child: Pressable(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            boxShadow: AppShadows.soft(isDark, tint: ink),
          ),
          child: wide
              ? Row(
                  children: [
                    iconBubble,
                    const SizedBox(width: 14),
                    Expanded(child: texts),
                    Icon(Icons.arrow_forward_rounded, color: iconColor, size: 20),
                  ],
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [iconBubble, if (badgePill != null) Flexible(child: badgePill)],
                    ),
                    const SizedBox(height: 14),
                    texts,
                  ],
                ),
        ),
      ),
    );
  }
}
