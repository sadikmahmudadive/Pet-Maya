import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/feed_post_model.dart';
import '../../../data/models/notification_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/empty_state.dart';
import '../../common_widgets/tail_wagging_loader.dart';
import '../../common_widgets/skeleton_loader.dart';
import 'create_post_screen.dart';
import 'comments_bottom_sheet.dart';
import '../../common_widgets/micro_animations/animated_action_button.dart';
import 'package:lottie/lottie.dart';
import '../../common_widgets/micro_animations/lottie_reaction_button.dart';

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({super.key});

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
  Widget _buildSocialProofReactions(FeedPostModel post) {
    final reactions = post.userReactions.values.toSet().toList();
    if (reactions.isEmpty && post.likesCount > 0) {
      reactions.add('Like');
    }
    if (reactions.isEmpty) return const SizedBox.shrink();

    final activeList = reactions.take(3).toList();
    return SizedBox(
      height: 20,
      width: (activeList.length - 1) * 14.0 + 20.0,
      child: Stack(
        children: activeList.asMap().entries.map((entry) {
          final idx = entry.key;
          final rName = entry.value;
          final config = kReactions.firstWhere(
            (r) => r.label.toLowerCase() == rName.toLowerCase(),
            orElse: () => kReactions.first,
          );

          return Positioned(
            left: idx * 14.0,
            child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 3,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: ClipOval(
                child: Lottie.asset(
                  config.assetPath,
                  fit: BoxFit.contain,
                  repeat: false,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  String _selectedTab = 'ALL';

  String _formatTimestamp(int timestamp) {
    final now = DateTime.now();
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
    final diff = now.difference(date);

    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d').format(date);
  }

  void _showShareModal(BuildContext context, FeedPostModel post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FacebookShareBottomSheet(post: post),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final currentUserId = state.currentUser?.uid ?? 'guest';
    final currentUser = state.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final posts = state.posts.where((p) {
      if (_selectedTab == 'ALL') return true;
      return p.postType == _selectedTab;
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text(
          'Community',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: isDark
            ? SystemUiOverlayStyle.light
            : SystemUiOverlayStyle.dark,
        actions: [const SizedBox(width: 8)],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        slivers: [
          // ─── TAIL WAGGING REFRESH CONTROL (Matching other screens) ───
          CupertinoSliverRefreshControl(
            refreshIndicatorExtent: 100,
            refreshTriggerPullDistance: 140,
            builder:
                (
                  context,
                  refreshState,
                  pulledExtent,
                  refreshTriggerPullDistance,
                  refreshIndicatorExtent,
                ) {
                  return const TailWaggingLoader(
                    size: 350,
                    useBottomPosition: true,
                  );
                },
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              final user = state.currentUser;
              if (user != null) await state.syncFromFirebase(user);
            },
          ),

          // ─── TOP COMPOSER & FILTER TABS ─────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 100),
              child: Column(
                children: [
                  // Facebook-style Top Composer
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: PremiumCard(
                      opacity: isDark ? 0.25 : 0.2,
                      borderRadius: 24,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: AppColors.primaryLight,
                                  backgroundImage:
                                      (currentUser?.photoUrl != null &&
                                          currentUser!.photoUrl!.isNotEmpty)
                                      ? (currentUser.photoUrl!.startsWith(
                                              'http',
                                            )
                                            ? NetworkImage(
                                                    currentUser.photoUrl!,
                                                  )
                                                  as ImageProvider
                                            : AssetImage(currentUser.photoUrl!)
                                                  as ImageProvider)
                                      : null,
                                  child:
                                      (currentUser?.photoUrl == null ||
                                          currentUser!.photoUrl!.isEmpty)
                                      ? const Icon(Icons.person, size: 18)
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) =>
                                            const CreatePostScreen(),
                                      ),
                                    ),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 14,
                                        vertical: 10,
                                      ),
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? Colors.white.withValues(
                                                alpha: 0.08,
                                              )
                                            : Colors.black.withValues(
                                                alpha: 0.04,
                                              ),
                                        borderRadius: BorderRadius.circular(24),
                                        border: Border.all(
                                          color: isDark
                                              ? Colors.white10
                                              : Colors.black12,
                                        ),
                                      ),
                                      child: Text(
                                        "What's on your mind${currentUser?.name != null ? ', ${currentUser!.name.split(' ').first}' : ''}?",
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          color: isDark
                                              ? Colors.white54
                                              : Colors.black54,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Divider(
                              height: 1,
                              color: isDark
                                  ? Colors.white10
                                  : Colors.black.withValues(alpha: 0.06),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                _buildComposerActionBtn(
                                  icon: Icons.photo_library_rounded,
                                  label: 'Photo',
                                  color: AppColors.healthGreen,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const CreatePostScreen(),
                                    ),
                                  ),
                                ),
                                _buildComposerActionBtn(
                                  icon: Icons.label_rounded,
                                  label: 'Category',
                                  color: AppColors.primary,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const CreatePostScreen(),
                                    ),
                                  ),
                                ),
                                _buildComposerActionBtn(
                                  icon: Icons.sentiment_satisfied_alt_rounded,
                                  label: 'Feeling',
                                  color: AppColors.accentAmber,
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const CreatePostScreen(),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Filter Tabs
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 4,
                    ),
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: [
                        _buildTabChip('ALL', 'All', Icons.grid_view_rounded),
                        _buildTabChip(
                          'MOMENT',
                          'Moments',
                          Icons.photo_camera_rounded,
                        ),
                        _buildTabChip(
                          'ADOPTION',
                          'Adoption',
                          Icons.home_rounded,
                        ),
                        _buildTabChip(
                          'RESCUE',
                          'Rescue',
                          Icons.warning_amber_rounded,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // ─── POSTS / EMPTY STATE ────────────────────────────────────
          if (posts.isEmpty && !state.isLoading)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyState(
                icon: Icons.chat_bubble_outline_rounded,
                title: 'No stories yet',
                message: 'Be the first to share a moment with the community!',
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 160),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate((context, index) {
                  final post = posts[index];
                  final isLiked = post.isLikedByUser(currentUserId);
                  final formattedTime = _formatTimestamp(post.timestamp);

                  return FadeInUp(
                    delay: Duration(milliseconds: 80 * index),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 600),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 20),
                          child: PremiumCard(
                            opacity: isDark ? 0.25 : 0.2,
                            borderRadius: 28,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Author Header
                                Builder(
                                  builder: (context) {
                                    // Live Data Logic: Priority 1 (Current User), Priority 2 (Cached Other Users), Priority 3 (Post Data)
                                    final repo = context
                                        .read<AppStateRepository>();
                                    String authorName = post.userName;
                                    String? authorPhoto = post.userPhoto;

                                    if (post.userId == currentUserId &&
                                        currentUser != null) {
                                      authorName = currentUser.name;
                                      authorPhoto = currentUser.photoUrl;
                                    } else if (repo.userCache.containsKey(
                                      post.userId,
                                    )) {
                                      final cached =
                                          repo.userCache[post.userId]!;
                                      authorName = cached.name;
                                      authorPhoto = cached.photoUrl;
                                    } else {
                                      // Trigger background fetch for next scroll
                                      repo.fetchAndCacheUser(post.userId);
                                    }

                                    return Padding(
                                      padding: const EdgeInsets.fromLTRB(
                                        16,
                                        16,
                                        16,
                                        12,
                                      ),
                                      child: Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 20,
                                            backgroundColor:
                                                AppColors.primaryLight,
                                            backgroundImage:
                                                (authorPhoto != null &&
                                                    authorPhoto.isNotEmpty)
                                                ? (authorPhoto.startsWith(
                                                        'http',
                                                      )
                                                      ? NetworkImage(
                                                              authorPhoto,
                                                            )
                                                            as ImageProvider
                                                      : AssetImage(authorPhoto)
                                                            as ImageProvider)
                                                : null,
                                            child:
                                                (authorPhoto == null ||
                                                    authorPhoto.isEmpty)
                                                ? const Icon(
                                                    Icons.person,
                                                    size: 20,
                                                  )
                                                : null,
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Text(
                                                      authorName,
                                                      style: const TextStyle(
                                                        fontSize: 15,
                                                        fontWeight:
                                                            FontWeight.w800,
                                                      ),
                                                    ),
                                                    if (repo
                                                            .userCache[post
                                                                .userId]
                                                            ?.isVerified ??
                                                        false) ...[
                                                      const SizedBox(width: 4),
                                                      const Icon(
                                                        Icons.verified_rounded,
                                                        color: AppColors
                                                            .healthGreen,
                                                        size: 14,
                                                      ),
                                                    ],
                                                  ],
                                                ),
                                                const SizedBox(height: 2),
                                                Row(
                                                  children: [
                                                    Text(
                                                      formattedTime,
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: isDark
                                                            ? Colors.white54
                                                            : Colors.grey[600],
                                                      ),
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      '·',
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        color: isDark
                                                            ? Colors.white54
                                                            : Colors.grey[600],
                                                      ),
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Icon(
                                                      Icons.public_rounded,
                                                      size: 12,
                                                      color: isDark
                                                          ? Colors.white54
                                                          : Colors.grey[600],
                                                    ),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          _buildPostBadge(post.postType),
                                          IconButton(
                                            icon: Icon(
                                              Icons.more_horiz_rounded,
                                              color: isDark
                                                  ? Colors.white54
                                                  : Colors.grey[600],
                                            ),
                                            onPressed: () {},
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),

                                // Post Content Text
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                  ),
                                  child: Text(
                                    post.content,
                                    style: TextStyle(
                                      height: 1.5,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: isDark
                                          ? Colors.white.withValues(alpha: 0.9)
                                          : Colors.black87,
                                    ),
                                  ),
                                ),

                                // Quoted Shared Post (if this is a shared post)
                                if (post.sharedPostAuthor != null &&
                                    post.sharedPostContent != null) ...[
                                  const SizedBox(height: 12),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                    ),
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: isDark
                                            ? Colors.white.withValues(
                                                alpha: 0.05,
                                              )
                                            : Colors.black.withValues(
                                                alpha: 0.03,
                                              ),
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(
                                          color: isDark
                                              ? Colors.white12
                                              : Colors.black.withValues(
                                                  alpha: 0.08,
                                                ),
                                        ),
                                      ),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Padding(
                                            padding: const EdgeInsets.all(12),
                                            child: Row(
                                              children: [
                                                CircleAvatar(
                                                  radius: 14,
                                                  backgroundColor:
                                                      AppColors.primaryLight,
                                                  child: const Icon(
                                                    Icons.person,
                                                    size: 14,
                                                    color: AppColors.primary,
                                                  ),
                                                ),
                                                const SizedBox(width: 8),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Text(
                                                        post.sharedPostAuthor!,
                                                        style: const TextStyle(
                                                          fontWeight:
                                                              FontWeight.w700,
                                                          fontSize: 12,
                                                        ),
                                                      ),
                                                      Text(
                                                        'Original Post',
                                                        style: TextStyle(
                                                          fontSize: 9,
                                                          color: isDark
                                                              ? Colors.white54
                                                              : Colors
                                                                    .grey[600],
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsets.fromLTRB(
                                              12,
                                              0,
                                              12,
                                              12,
                                            ),
                                            child: Text(
                                              post.sharedPostContent!,
                                              maxLines: 3,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                fontSize: 13,
                                                height: 1.4,
                                                color: isDark
                                                    ? Colors.white70
                                                    : Colors.black87,
                                              ),
                                            ),
                                          ),
                                          if (post.sharedPostImageUrl != null &&
                                              post
                                                  .sharedPostImageUrl!
                                                  .isNotEmpty)
                                            ClipRRect(
                                              borderRadius:
                                                  const BorderRadius.vertical(
                                                    bottom: Radius.circular(16),
                                                  ),
                                              child: CachedNetworkImage(
                                                imageUrl:
                                                    post.sharedPostImageUrl!,
                                                width: double.infinity,
                                                height: 180,
                                                fit: BoxFit.cover,
                                                placeholder: (c, u) =>
                                                    SkeletonLoader(
                                                      width: MediaQuery.of(
                                                        context,
                                                      ).size.width,
                                                      height: 180,
                                                      borderRadius: 16,
                                                    ),
                                                errorWidget: (c, u, e) =>
                                                    const SizedBox.shrink(),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],

                                // Post Image Attachment
                                if (post.imageUrl != null) ...[
                                  const SizedBox(height: 14),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                    ),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(20),
                                      child: CachedNetworkImage(
                                        imageUrl: post.imageUrl!,
                                        width: double.infinity,
                                        height: 260,
                                        fit: BoxFit.cover,
                                        placeholder: (c, u) => SkeletonLoader(
                                          width: MediaQuery.of(
                                            context,
                                          ).size.width,
                                          height: 260,
                                          borderRadius: 20,
                                        ),
                                        errorWidget: (c, u, e) => const Icon(
                                          Icons.error_outline_rounded,
                                        ),
                                      ),
                                    ),
                                  ),
                                ],

                                const SizedBox(height: 12),

                                // Social Proof Bar
                                if (post.likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                  ),
                                  child: Row(
                                    children: [
                                      if (post.likesCount > 0) ...[
                                        _buildSocialProofReactions(post),
                                        const SizedBox(width: 6),
                                        Text(
                                          '${post.likesCount}',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                            color: isDark
                                                ? Colors.white60
                                                : Colors.grey[700],
                                          ),
                                        ),
                                      ],
                                      const Spacer(),
                                      Text(
                                        '${post.commentsCount} comments',
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: isDark
                                              ? Colors.white60
                                              : Colors.grey[700],
                                        ),
                                      ),
                                      if (post.sharesCount > 0) ...[
                                        const SizedBox(width: 8),
                                        Text(
                                          '·',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: isDark
                                                ? Colors.white60
                                                : Colors.grey[700],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          '${post.sharesCount} shares',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: isDark
                                                ? Colors.white60
                                                : Colors.grey[700],
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),

                                const SizedBox(height: 8),
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                  ),
                                  child: Divider(
                                    height: 1,
                                    color: isDark
                                        ? Colors.white10
                                        : Colors.black.withValues(alpha: 0.08),
                                  ),
                                ),

                                // Action Bar
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: LottieReactionButton(post: post),
                                      ),
                                      Expanded(
                                        child: AnimatedActionButton(
                                          inactiveIcon:
                                              Icons.chat_bubble_outline_rounded,
                                          activeIcon: Icons.chat_bubble_rounded,
                                          label: 'Comment',
                                          isActive: false,
                                          activeColor: AppColors.primary,
                                          inactiveColor: isDark
                                              ? Colors.white60
                                              : Colors.grey[700]!,
                                          onTap: () => showModalBottomSheet(
                                            context: context,
                                            isScrollControlled: true,
                                            backgroundColor: Colors.transparent,
                                            builder: (_) =>
                                                CommentsBottomSheet(post: post),
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        child: AnimatedActionButton(
                                          inactiveIcon: Icons.share_outlined,
                                          activeIcon: Icons.share_rounded,
                                          label: 'Share',
                                          isActive: false,
                                          activeColor: const Color(0xFF1877F2),
                                          inactiveColor: isDark
                                              ? Colors.white60
                                              : Colors.grey[700]!,
                                          onTap: () =>
                                              _showShareModal(context, post),
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
                    ),
                  );
                }, childCount: posts.length),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildComposerActionBtn({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        child: Row(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFacebookActionBtn({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabChip(String tab, String label, IconData icon) {
    final isSelected = _selectedTab == tab;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeColor = AppColors.primary;
    final inactiveColor = isDark ? Colors.white38 : Colors.grey[600];

    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: PremiumCard(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _selectedTab = tab);
        },
        opacity: isSelected ? 0.35 : 0.05,
        borderRadius: 20,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 15,
                color: isSelected ? activeColor : inactiveColor,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? activeColor : inactiveColor,
                  fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPostBadge(String postType) {
    Color color;
    switch (postType) {
      case 'RESCUE':
        color = AppColors.dangerRed;
        break;
      case 'ADOPTION':
        color = AppColors.accentAmber;
        break;
      default:
        color = AppColors.primary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Text(
        postType,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.w900,
          fontSize: 8,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _ShareContact {
  final String id;
  final String name;
  final String role;
  final String? avatar;
  const _ShareContact({
    required this.id,
    required this.name,
    required this.role,
    this.avatar,
  });
}

class FacebookShareBottomSheet extends StatefulWidget {
  final FeedPostModel post;
  const FacebookShareBottomSheet({super.key, required this.post});

  @override
  State<FacebookShareBottomSheet> createState() =>
      _FacebookShareBottomSheetState();
}

class _FacebookShareBottomSheetState extends State<FacebookShareBottomSheet> {
  final Set<String> _sentRecipients = {};
  String _selectedAudience = 'Public';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showAudienceSelector(BuildContext context, Color cardBg) {
    HapticFeedback.selectionClick();
    showModalBottomSheet(
      context: context,
      backgroundColor: cardBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Who can see this post?',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: const Icon(
                Icons.public_rounded,
                color: AppColors.primary,
              ),
              title: const Text(
                'Public',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: const Text('Anyone on Pet Maya can view this post'),
              trailing: _selectedAudience == 'Public'
                  ? const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.primary,
                    )
                  : null,
              onTap: () {
                setState(() => _selectedAudience = 'Public');
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.people_alt_rounded,
                color: AppColors.primary,
              ),
              title: const Text(
                'Friends & Community',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: const Text(
                'Only your pet friends and clinic connections',
              ),
              trailing: _selectedAudience == 'Friends'
                  ? const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.primary,
                    )
                  : null,
              onTap: () {
                setState(() => _selectedAudience = 'Friends');
                Navigator.pop(ctx);
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.lock_outline_rounded,
                color: AppColors.primary,
              ),
              title: const Text(
                'Only Me',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: const Text(
                'Only you can view this post on your profile',
              ),
              trailing: _selectedAudience == 'Only Me'
                  ? const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.primary,
                    )
                  : null,
              onTap: () {
                setState(() => _selectedAudience = 'Only Me');
                Navigator.pop(ctx);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final currentUser = state.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBg = isDark ? const Color(0xFF1E2430) : Colors.white;

    // Dynamically build recipient list from real vets and active community authors
    final currentUid = currentUser?.uid;
    final List<_ShareContact> dynamicContacts = [];
    final Set<String> addedIds = {};

    for (final vet in state.vets) {
      if (vet.id != currentUid && !addedIds.contains(vet.id)) {
        addedIds.add(vet.id);
        dynamicContacts.add(
          _ShareContact(
            id: vet.id,
            name: vet.name,
            role: '${vet.tag} • ${vet.qualification}',
            avatar: vet.photoUrl,
          ),
        );
      }
    }

    for (final post in state.posts) {
      if (post.userId != currentUid &&
          !addedIds.contains(post.userId) &&
          post.userName.isNotEmpty) {
        addedIds.add(post.userId);
        dynamicContacts.add(
          _ShareContact(
            id: post.userId,
            name: post.userName,
            role: 'Pet Parent • Pet Maya Community',
            avatar: post.userPhoto,
          ),
        );
      }
    }

    final filteredContacts = _searchQuery.isEmpty
        ? dynamicContacts
        : dynamicContacts
              .where(
                (c) =>
                    c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                    c.role.toLowerCase().contains(_searchQuery.toLowerCase()),
              )
              .toList();

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 25,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag Handle
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // User Header & Privacy Selector (Facebook Style)
              Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: AppColors.primaryLight,
                    backgroundImage:
                        (currentUser?.photoUrl != null &&
                            currentUser!.photoUrl!.isNotEmpty)
                        ? NetworkImage(currentUser.photoUrl!)
                        : null,
                    child:
                        (currentUser?.photoUrl == null ||
                            currentUser!.photoUrl!.isEmpty)
                        ? const Icon(
                            Icons.person,
                            size: 22,
                            color: AppColors.primary,
                          )
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          currentUser?.name ?? 'Pet Lover',
                          style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 3),
                        GestureDetector(
                          onTap: () => _showAudienceSelector(context, cardBg),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? Colors.white10
                                  : Colors.grey.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isDark ? Colors.white12 : Colors.black12,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.public_rounded,
                                  size: 12,
                                  color: AppColors.primary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '$_selectedAudience ▾',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(
                      Icons.close_rounded,
                      color: isDark ? Colors.white54 : Colors.grey[600],
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Facebook Quick Action Grid (Horizontal scroll)
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: [
                    _buildQuickActionCircle(
                      icon: Icons.flash_on_rounded,
                      label: 'Share Now\n(Feed)',
                      bgColor: const Color(0xFF1877F2),
                      iconColor: Colors.white,
                      onTap: () {
                        Navigator.pop(context);
                        HapticFeedback.mediumImpact();
                        state.sharePost(originalPost: widget.post);
                        state.showToast('Shared to your Community Feed! 🚀');
                      },
                    ),
                    const SizedBox(width: 16),
                    _buildQuickActionCircle(
                      icon: Icons.edit_note_rounded,
                      label: 'Share to Feed\n(Caption)',
                      bgColor: isDark
                          ? Colors.white10
                          : const Color(0xFFE7F3FF),
                      iconColor: const Color(0xFF1877F2),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) =>
                                CreatePostScreen(sharedPost: widget.post),
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 16),
                    _buildQuickActionCircle(
                      icon: Icons.link_rounded,
                      label: 'Copy\nLink',
                      bgColor: isDark
                          ? Colors.white10
                          : const Color(0xFFFFF3E0),
                      iconColor: AppColors.accentAmber,
                      onTap: () {
                        Clipboard.setData(
                          ClipboardData(
                            text:
                                'https://petmaya.app/post/${widget.post.postId}',
                          ),
                        );
                        HapticFeedback.lightImpact();
                        Navigator.pop(context);
                        state.showToast('Post link copied to clipboard! 📋');
                      },
                    ),
                    const SizedBox(width: 16),
                    _buildQuickActionCircle(
                      icon: Icons.chat_rounded,
                      label: 'Send in\nChat',
                      bgColor: isDark
                          ? Colors.white10
                          : const Color(0xFFE8F5E9),
                      iconColor: AppColors.healthGreen,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        state.showToast(
                          'Select a pet friend or vet below to share! 💬',
                        );
                      },
                    ),
                    const SizedBox(width: 16),
                    _buildQuickActionCircle(
                      icon: Icons.more_horiz_rounded,
                      label: 'More\nOptions',
                      bgColor: isDark
                          ? Colors.white10
                          : Colors.grey.withValues(alpha: 0.15),
                      iconColor: isDark ? Colors.white70 : Colors.black87,
                      onTap: () async {
                        Navigator.pop(context);
                        HapticFeedback.mediumImpact();
                        state.incrementPostShares(widget.post.postId);
                        final shareText =
                            'Check out this post on Pet Maya by ${widget.post.userName}:\n\n"${widget.post.content}"\n\nhttps://petmaya.app/';
                        await SharePlus.instance.share(
                          ShareParams(
                            text: shareText,
                            subject: 'Pet Maya Post by ${widget.post.userName}',
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              Divider(
                height: 1,
                color: isDark
                    ? Colors.white10
                    : Colors.black.withValues(alpha: 0.08),
              ),
              const SizedBox(height: 16),

              // Facebook Send in Direct Message section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Send in Direct Message',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                      color: isDark ? Colors.white70 : Colors.grey[800],
                      letterSpacing: 0.2,
                    ),
                  ),
                  if (dynamicContacts.isNotEmpty)
                    Text(
                      '${dynamicContacts.length} contacts',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white38 : Colors.grey[500],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Search Bar for Contacts
              if (dynamicContacts.length > 3) ...[
                Container(
                  height: 40,
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.05)
                        : Colors.grey.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.search_rounded,
                        size: 18,
                        color: isDark ? Colors.white38 : Colors.grey[500],
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) =>
                              setState(() => _searchQuery = val.trim()),
                          style: const TextStyle(fontSize: 12),
                          decoration: const InputDecoration(
                            hintText: 'Search pet friends and vets...',
                            hintStyle: TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                            border: InputBorder.none,
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                          ),
                        ),
                      ),
                      if (_searchQuery.isNotEmpty)
                        GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                          child: const Icon(
                            Icons.close_rounded,
                            size: 16,
                            color: Colors.grey,
                          ),
                        ),
                    ],
                  ),
                ),
              ],

              if (filteredContacts.isEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                    vertical: 24,
                    horizontal: 16,
                  ),
                  alignment: Alignment.center,
                  child: Column(
                    children: [
                      Icon(
                        Icons.people_outline_rounded,
                        size: 36,
                        color: isDark ? Colors.white24 : Colors.grey[400],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _searchQuery.isNotEmpty
                            ? 'No contacts match "$_searchQuery"'
                            : 'No other active contacts found yet',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white38 : Colors.grey[600],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                )
              else
                Column(
                  children: filteredContacts.map((contact) {
                    final isSent = _sentRecipients.contains(contact.id);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.03)
                            : Colors.grey.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.06)
                              : Colors.black.withValues(alpha: 0.04),
                        ),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppColors.primaryLight,
                            backgroundImage:
                                (contact.avatar != null &&
                                    contact.avatar!.isNotEmpty)
                                ? CachedNetworkImageProvider(contact.avatar!)
                                : null,
                            child:
                                (contact.avatar == null ||
                                    contact.avatar!.isEmpty)
                                ? const Icon(
                                    Icons.person,
                                    size: 18,
                                    color: AppColors.primary,
                                  )
                                : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  contact.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  contact.role,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: isDark
                                        ? Colors.white54
                                        : Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          ElevatedButton(
                            onPressed: isSent
                                ? null
                                : () {
                                    HapticFeedback.lightImpact();
                                    setState(
                                      () => _sentRecipients.add(contact.id),
                                    );
                                    state.incrementPostShares(
                                      widget.post.postId,
                                    );
                                    state.addNotification(
                                      title: 'Post Shared 🐾',
                                      message:
                                          'You sent ${widget.post.userName}\'s story to ${contact.name}',
                                      type: NotificationType.system,
                                    );
                                    state.showToast(
                                      'Sent to ${contact.name}! 🐾',
                                    );
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: isSent
                                  ? AppColors.healthGreen
                                  : const Color(0xFF1877F2),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 8,
                              ),
                              minimumSize: const Size(64, 32),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: Text(
                              isSent ? 'Sent ✓' : 'Send',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionCircle({
    required IconData icon,
    required String label,
    required Color bgColor,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}
