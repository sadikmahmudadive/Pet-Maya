import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/pet_model.dart';
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
import '../community/blog_screen.dart';
import '../community/create_blog_screen.dart';
import 'pet_tracker_screen.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'user_profile_screen.dart';
import '../../common_widgets/tail_wagging_loader.dart';
import 'notification_screen.dart';

class OwnerHomeScreen extends StatefulWidget {
  const OwnerHomeScreen({super.key});

  @override
  State<OwnerHomeScreen> createState() => _OwnerHomeScreenState();
}

class _OwnerHomeScreenState extends State<OwnerHomeScreen> {
  int _currentNavIndex = 0;

  @override
  Widget build(BuildContext context) {
    final orientation = MediaQuery.of(context).orientation;
    final isLandscape = orientation == Orientation.landscape;

    return GlassScaffold(
      body: Stack(
        children: [
          Padding(
            padding: EdgeInsets.only(right: isLandscape ? 100 : 0),
            child: IndexedStack(
              index: _currentNavIndex,
              children: [
                HomeDashboardFragment(
                  onNavRequested: (index) =>
                      setState(() => _currentNavIndex = index),
                ), // 0
                const PetServicesScreen(), // 1
                const CommunityFeedScreen(), // 2
                const UserProfileScreen(), // 3
                const ShopScreen(), // 4
              ],
            ),
          ),
          Positioned(
            left: isLandscape ? null : 0,
            right: isLandscape ? 12 : 0,
            bottom: isLandscape ? 24 : 0,
            top: isLandscape ? 24 : null,
            child: isLandscape
                ? _buildSideNavbar()
                : FloatingNavbar(
                    selectedIndex: _currentNavIndex > 3 ? 1 : _currentNavIndex,
                    onItemTapped: (index) =>
                        setState(() => _currentNavIndex = index),
                    onFabTapped: () => _showQuickActionSheet(context),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSideNavbar() {
    return Container(
      width: 76,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: Theme.of(context).dividerColor.withValues(alpha: 0.1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(-5, 0),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildSideTab(0, Icons.grid_view_rounded),
          _buildSideTab(1, Icons.explore_rounded),
          GestureDetector(
            onTap: () => _showQuickActionSheet(context),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: const Icon(Icons.add, color: Colors.white, size: 24),
            ),
          ),
          _buildSideTab(2, Icons.forum_rounded),
          _buildSideTab(3, Icons.person_rounded),
        ],
      ),
    );
  }

  Widget _buildSideTab(int index, IconData icon) {
    final isSelected = _currentNavIndex == index;
    return IconButton(
      icon: Icon(
        icon,
        color: isSelected ? AppColors.primary : Colors.grey,
        size: 28,
      ),
      onPressed: () => setState(() => _currentNavIndex = index),
    );
  }

  void _showQuickActionSheet(BuildContext context) {
    HapticFeedback.mediumImpact();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? const Color(0xFF1B232E) : Colors.white,
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
                    'Quick Actions ⚡',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
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
    final isSmallScreen = size.width < 360;

    return CustomScrollView(
      physics: const BouncingScrollPhysics(
        parent: AlwaysScrollableScrollPhysics(),
      ),
      slivers: [
        CupertinoSliverRefreshControl(
          refreshIndicatorExtent: 80,
          refreshTriggerPullDistance: 120,
          builder:
              (
                context,
                refreshState,
                pulledExtent,
                refreshTriggerPullDistance,
                refreshIndicatorExtent,
              ) {
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
            if (user != null) await state.syncFromFirebase(user);
          },
        ),
        SliverToBoxAdapter(
          child: RepaintBoundary(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, size.height * 0.08, 20, 20),
              child: _buildPremiumHeader(context, user),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── MY PETS ──────────────────────────────────────────────────
              FadeInDown(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 8,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'My Pets',
                        style: Theme.of(
                          context,
                        ).textTheme.titleLarge?.copyWith(fontSize: 20),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MyPetsScreen(),
                          ),
                        ),
                        child: Text(
                          'See All',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 4),
              SizedBox(
                height: 180,
                child: pets.isEmpty
                    ? _buildEmptyPetsPlaceholder(context)
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: pets.length,
                        itemBuilder: (context, index) {
                          final pet = pets[index];
                          return FadeInRight(
                            delay: Duration(milliseconds: 100 * index),
                            child: _buildVerticalPetCard(context, pet),
                          );
                        },
                      ),
              ),

              // ─── DISCOVER MORE ─────────────────────────────────────────────
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Discover More',
                      style: Theme.of(
                        context,
                      ).textTheme.titleLarge?.copyWith(fontSize: 20),
                    ),
                    const SizedBox(height: 12),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final crossAxisCount = constraints.maxWidth > 600
                            ? 4
                            : 2;
                        final childAspectRatio = constraints.maxWidth > 600
                            ? 1.0
                            : (isSmallScreen ? 0.75 : 0.8);

                        return GridView.count(
                          padding: EdgeInsets.zero,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: crossAxisCount,
                          mainAxisSpacing: 16,
                          crossAxisSpacing: 16,
                          childAspectRatio: childAspectRatio,
                          children: [
                            _buildDiscoveryCard(
                              context,
                              icon: Icons.attach_money_rounded,
                              color: const Color(0xFFE0F7FA),
                              iconColor: const Color(0xFF006064),
                              title: 'Pet Shop',
                              subtitle: 'Premium treats',
                              action: 'Shop',
                              onTap: () => onNavRequested?.call(4),
                            ),
                            _buildDiscoveryCard(
                              context,
                              icon: Icons.location_on_rounded,
                              color: const Color(0xFFE3F2FD),
                              iconColor: const Color(0xFF0D47A1),
                              title: 'Tracker',
                              subtitle: 'Live location',
                              action: 'Locate',
                              onTap: () {
                                if (pets.isNotEmpty) {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          PetTrackerScreen(pet: pets.first),
                                    ),
                                  );
                                }
                              },
                            ),
                            _buildDiscoveryCard(
                              context,
                              icon: Icons.chat_bubble_outline_rounded,
                              color: const Color(0xFFF3E5F5),
                              iconColor: const Color(0xFF4A148C),
                              title: 'Wellness',
                              subtitle: 'Health scan',
                              action: 'Check',
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const AiHealthScannerScreen(),
                                ),
                              ),
                            ),
                            _buildDiscoveryCard(
                              context,
                              icon: Icons.pets_rounded,
                              color: const Color(0xFFE8F5E9),
                              iconColor: const Color(0xFF1B5E20),
                              title: 'Community',
                              subtitle: 'Global feed',
                              action: 'Explore',
                              onTap: () => onNavRequested?.call(2),
                            ),
                            _buildDiscoveryCard(
                              context,
                              icon: Icons.article_rounded,
                              color: const Color(0xFFFFF3E0),
                              iconColor: const Color(0xFFE65100),
                              title: 'Blog',
                              subtitle: 'Expert advice',
                              action: 'Read',
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const BlogScreen(),
                                ),
                              ),
                            ),
                            _buildDiscoveryCard(
                              context,
                              icon: Icons.event_available_rounded,
                              color: const Color(0xFFFFEBEE),
                              iconColor: const Color(0xFFD32F2F),
                              title: 'Reminders',
                              subtitle: 'Schedule care',
                              action: 'View',
                              onTap: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const CalendarScreen(),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),

              // ─── UPCOMING EVENTS ──────────────────────────────────────────
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Upcoming Events',
                      style: Theme.of(
                        context,
                      ).textTheme.titleLarge?.copyWith(fontSize: 20),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const CalendarScreen(),
                        ),
                      ),
                      child: Text(
                        'See All',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              if (events.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text('No upcoming events.'),
                )
              else
                SizedBox(
                  height: 190,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    itemCount: events.length > 5
                        ? 5
                        : events.length, // Show up to 5 horizontal cards
                    itemBuilder: (context, index) {
                      return FadeInRight(
                        delay: Duration(milliseconds: 50 * index),
                        child: _buildUpcomingEventCard(
                          context,
                          events[index],
                          state,
                        ),
                      );
                    },
                  ),
                ),

              // ─── TOP VETERINARIANS ────────────────────────────────────────
              const SizedBox(height: 24),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Top Veterinarians',
                      style: Theme.of(
                        context,
                      ).textTheme.titleLarge?.copyWith(fontSize: 20),
                    ),
                    GestureDetector(
                      onTap: () => onNavRequested?.call(1),
                      child: Text(
                        'See All',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              if (vets.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Center(child: Text('No vets found.')),
                )
              else
                ...vets
                    .where((v) => v.tag.toLowerCase().contains('vet'))
                    .take(3)
                    .map(
                      (vet) =>
                          FadeInUp(child: _buildDetailedVetCard(context, vet)),
                    ),

              const SizedBox(
                height: 160,
              ), // standard spacer to clear floating navbar
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildVerticalPetCard(BuildContext context, PetModel pet) {
    final size = MediaQuery.of(context).size;
    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    // Cap the card width to prevent massive images on tablets
    final cardWidth = isLandscape ? 140.0 : size.width * 0.4;

    return Container(
      width: cardWidth,
      margin: const EdgeInsets.only(left: 16, right: 4, bottom: 8),
      child: PremiumCard(
        opacity: 0.2,
        borderRadius: 28,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => PetDetailsScreen(petId: pet.petID)),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: Theme.of(
                        context,
                      ).shadowColor.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(40),
                  child: pet.photoUrl != null && pet.photoUrl!.isNotEmpty
                      ? pet.photoUrl!.startsWith('assets')
                            ? Image.asset(
                                pet.photoUrl!,
                                width: isLandscape ? 55 : cardWidth * 0.55,
                                height: isLandscape ? 55 : cardWidth * 0.55,
                                fit: BoxFit.cover,
                              )
                            : CachedNetworkImage(
                                imageUrl: pet.photoUrl!,
                                width: isLandscape ? 55 : cardWidth * 0.55,
                                height: isLandscape ? 55 : cardWidth * 0.55,
                                fit: BoxFit.cover,
                                errorWidget: (c, u, e) =>
                                    _buildPetErrorIcon(context),
                              )
                      : _buildPetErrorIcon(context),
                ),
              ),
              const SizedBox(height: 10),
              Flexible(
                child: Text(
                  pet.name,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                pet.breed,
                style: Theme.of(
                  context,
                ).textTheme.labelSmall?.copyWith(fontSize: 9),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
            ],
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
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: Theme.of(context).dividerColor,
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.pets_rounded,
            color: Theme.of(context).hintColor.withValues(alpha: 0.2),
            size: 48,
          ),
          const SizedBox(height: 12),
          Text(
            'No pets added yet',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          TextButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AddEditPetScreen()),
            ),
            child: const Text('Add your first pet'),
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

  Widget _buildPremiumHeader(BuildContext context, UserModel? user) {
    final hour = DateTime.now().hour;
    String greeting = 'Good Morning,';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon,';
    if (hour >= 17) greeting = 'Good Evening,';

    final isLandscape =
        MediaQuery.of(context).orientation == Orientation.landscape;

    return PremiumCard(
      opacity: 0.3,
      borderRadius: 32,
      child: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: 16,
          vertical: isLandscape ? 12 : 16,
        ),
        child: Row(
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
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(
                      context,
                    ).colorScheme.primary.withValues(alpha: 0.1),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: isLandscape ? 20 : 24,
                backgroundColor: Theme.of(context).cardColor,
                backgroundImage: (user?.photoUrl != null && user!.photoUrl!.isNotEmpty)
                    ? (user.photoUrl!.startsWith('http')
                        ? CachedNetworkImageProvider(user.photoUrl!) as ImageProvider
                        : AssetImage(user.photoUrl!) as ImageProvider)
                    : null,
                child: (user?.photoUrl == null || user!.photoUrl!.isEmpty)
                    ? Icon(
                        Icons.person,
                        color: Theme.of(context).colorScheme.primary,
                        size: isLandscape ? 16 : 20,
                      )
                    : null,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    greeting,
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 10,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    user?.name ?? 'Pet Maya User',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                      fontSize: isLandscape ? 16 : 18,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            if (!isLandscape) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                decoration: BoxDecoration(
                  color: Theme.of(
                    context,
                  ).colorScheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(
                      Icons.stars_rounded,
                      color: Color(0xFF7B1FA2),
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '15',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: const Color(0xFF7B1FA2),
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
            ],
            Consumer<AppStateRepository>(
              builder: (context, repo, _) {
                final unreadCount = repo.notifications
                    .where((n) => !n.isRead)
                    .length;
                return GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const NotificationScreen(),
                    ),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Theme.of(
                        context,
                      ).colorScheme.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        const Icon(
                          Icons.notifications_rounded,
                          color: Color(0xFF0277BD),
                          size: 18,
                        ),
                        if (unreadCount > 0)
                          Positioned(
                            top: -4,
                            right: -4,
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              constraints: const BoxConstraints(
                                minWidth: 14,
                                minHeight: 14,
                              ),
                              decoration: const BoxDecoration(
                                color: AppColors.dangerRed,
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                unreadCount > 9 ? '9+' : '$unreadCount',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  height: 1,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailedVetCard(BuildContext context, VetModel vet) {
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
                              '${vet.rating}',
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Flexible(
                              child: Text(
                                ' (${vet.reviewsCount} reviews)',
                                style: Theme.of(context).textTheme.labelSmall,
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
                  color: Theme.of(context).cardColor.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(20),
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

  Widget _buildDiscoveryCard(
    BuildContext context, {
    required IconData icon,
    required Color color,
    Color? iconColor,
    required String title,
    required String subtitle,
    required String action,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PremiumCard(
      onTap: onTap,
      opacity: isDark ? 0.3 : 0.15,
      borderRadius: 28,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: (iconColor ?? AppColors.primary).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                icon,
                color: iconColor ?? AppColors.primary,
                size: 24,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: Colors.grey,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const Spacer(),
            Row(
              children: [
                Text(
                  action.toUpperCase(),
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    color: iconColor ?? AppColors.primary,
                    letterSpacing: 1.0,
                    fontSize: 9,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 8,
                  color: iconColor ?? AppColors.primary,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}


