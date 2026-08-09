import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/empty_state.dart';
import '../../common_widgets/tail_wagging_loader.dart';
import 'create_post_screen.dart';
import 'comments_bottom_sheet.dart';
import '../../common_widgets/skeleton_loader.dart';

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({super.key});

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
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

  void _showShareModal(BuildContext context, dynamic post) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surface,
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
                  color: Colors.grey.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Share Post',
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                child: const Icon(Icons.feed_rounded, color: AppColors.primary, size: 22),
              ),
              title: const Text('Share to Feed', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Repost this memory to your pet feed', style: TextStyle(fontSize: 12)),
              onTap: () {
                Navigator.pop(ctx);
                HapticFeedback.mediumImpact();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Shared to your feed!'), behavior: SnackBarBehavior.floating),
                );
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.accentAmber.withOpacity(0.15), shape: BoxShape.circle),
                child: const Icon(Icons.link_rounded, color: AppColors.accentAmber, size: 22),
              ),
              title: const Text('Copy Link', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Copy post URL to clipboard', style: TextStyle(fontSize: 12)),
              onTap: () {
                Navigator.pop(ctx);
                Clipboard.setData(ClipboardData(text: 'https://petmaya.app/post/${post.postId}'));
                HapticFeedback.lightImpact();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Post link copied to clipboard!'), behavior: SnackBarBehavior.floating),
                );
              },
            ),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.healthGreen.withOpacity(0.15), shape: BoxShape.circle),
                child: const Icon(Icons.send_rounded, color: AppColors.healthGreen, size: 22),
              ),
              title: const Text('Share via App...', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Send directly via messaging apps', style: TextStyle(fontSize: 12)),
              onTap: () {
                Navigator.pop(ctx);
                HapticFeedback.lightImpact();
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
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
        title: const Text('Community', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
        actions: [
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),

          // Facebook-style Top Composer
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: PremiumCard(
              opacity: isDark ? 0.25 : 0.2,
              borderRadius: 24,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: AppColors.primaryLight,
                          backgroundImage: currentUser?.photoUrl != null ? NetworkImage(currentUser!.photoUrl!) : null,
                          child: currentUser?.photoUrl == null ? const Icon(Icons.person, size: 20) : null,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen())),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.04),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
                              ),
                              child: Text(
                                "What's on your mind${currentUser?.name != null ? ', ' + currentUser!.name.split(' ').first : ''}?",
                                style: TextStyle(
                                  color: isDark ? Colors.white54 : Colors.black54,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Divider(height: 1, color: isDark ? Colors.white10 : Colors.black.withOpacity(0.06)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildComposerActionBtn(
                          icon: Icons.photo_library_rounded,
                          label: 'Photo',
                          color: AppColors.healthGreen,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen())),
                        ),
                        _buildComposerActionBtn(
                          icon: Icons.label_rounded,
                          label: 'Category',
                          color: AppColors.primary,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen())),
                        ),
                        _buildComposerActionBtn(
                          icon: Icons.sentiment_satisfied_alt_rounded,
                          label: 'Feeling',
                          color: AppColors.accentAmber,
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen())),
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
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: [
                _buildTabChip('ALL', 'All', Icons.grid_view_rounded),
                _buildTabChip('MOMENT', 'Moments', Icons.photo_camera_rounded),
                _buildTabChip('ADOPTION', 'Adoption', Icons.home_rounded),
                _buildTabChip('RESCUE', 'Rescue', Icons.warning_amber_rounded),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Feed List
          Expanded(
            child: posts.isEmpty && !state.isLoading
                ? const EmptyState(
                    icon: Icons.chat_bubble_outline_rounded,
                    title: 'No stories yet',
                    message: 'Be the first to share a moment with the community!',
                  )
                : Stack(
                    children: [
                      NotificationListener<ScrollNotification>(
                        onNotification: (notification) {
                          if (notification is ScrollUpdateNotification) {
                            // Detect significant pull down
                            if (notification.metrics.pixels < -100 && !state.isLoading) {
                              HapticFeedback.mediumImpact();
                              final user = state.currentUser;
                              if (user != null) state.syncFromFirebase(user);
                            }
                          }
                          return false;
                        },
                        child: ListView.builder(
                          physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 160),
                          itemCount: posts.length,
                          itemBuilder: (context, index) {
                            final post = posts[index];
                            final isLiked = post.isLikedByUser(currentUserId);
                            final formattedTime = _formatTimestamp(post.timestamp);

                            return FadeInUp(
                              delay: Duration(milliseconds: 80 * index),
                              child: Padding(
                                padding: const EdgeInsets.only(bottom: 20),
                                child: PremiumCard(
                                  opacity: isDark ? 0.25 : 0.2,
                                  borderRadius: 28,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Facebook-style Author Header
                                      Padding(
                                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 20,
                                              backgroundColor: AppColors.primaryLight,
                                              backgroundImage: (post.userPhoto != null && post.userPhoto!.isNotEmpty)
                                                  ? NetworkImage(post.userPhoto!)
                                                  : null,
                                              child: (post.userPhoto == null || post.userPhoto!.isEmpty)
                                                  ? const Icon(Icons.person, size: 20)
                                                  : null,
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(post.userName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                                                  const SizedBox(height: 2),
                                                  Row(
                                                    children: [
                                                      Text(
                                                        formattedTime,
                                                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: isDark ? Colors.white54 : Colors.grey[600]),
                                                      ),
                                                      const SizedBox(width: 4),
                                                      Text('·', style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : Colors.grey[600])),
                                                      const SizedBox(width: 4),
                                                      Icon(Icons.public_rounded, size: 12, color: isDark ? Colors.white54 : Colors.grey[600]),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                            _buildPostBadge(post.postType),
                                            IconButton(
                                              icon: Icon(Icons.more_horiz_rounded, color: isDark ? Colors.white54 : Colors.grey[600]),
                                              onPressed: () {},
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Post Content Text
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 16),
                                        child: Text(
                                          post.content,
                                          maxLines: 4,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            height: 1.5,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w500,
                                            color: isDark ? Colors.white.withOpacity(0.9) : Colors.black87,
                                          ),
                                        ),
                                      ),

                                      // Post Image Attachment
                                      if (post.imageUrl != null) ...[
                                        const SizedBox(height: 14),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 8),
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(20),
                                            child: CachedNetworkImage(
                                              imageUrl: post.imageUrl!,
                                              width: double.infinity,
                                              height: 260,
                                              fit: BoxFit.cover,
                                              placeholder: (c, u) => SkeletonLoader(width: double.infinity, height: 260, borderRadius: 20),
                                              errorWidget: (c, u, e) => const Icon(Icons.error_outline_rounded),
                                            ),
                                          ),
                                        ),
                                      ],

                                      const SizedBox(height: 12),

                                      // Facebook-style Social Proof Bar
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 16),
                                        child: Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.all(4),
                                              decoration: const BoxDecoration(
                                                color: Color(0xFF1877F2),
                                                shape: BoxShape.circle,
                                              ),
                                              child: const Icon(Icons.thumb_up_alt_rounded, size: 10, color: Colors.white),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              '${post.likesCount}',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w700,
                                                color: isDark ? Colors.white60 : Colors.grey[700],
                                              ),
                                            ),
                                            const Spacer(),
                                            Text(
                                              '${post.commentsCount} comments',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: isDark ? Colors.white60 : Colors.grey[700],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      const SizedBox(height: 8),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 16),
                                        child: Divider(height: 1, color: isDark ? Colors.white10 : Colors.black.withOpacity(0.08)),
                                      ),

                                      // Facebook-style 3-Button Action Bar
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        child: Row(
                                          children: [
                                            Expanded(
                                              child: _buildFacebookActionBtn(
                                                icon: isLiked ? Icons.thumb_up_alt_rounded : Icons.thumb_up_alt_outlined,
                                                label: 'Like',
                                                color: isLiked ? const Color(0xFF1877F2) : (isDark ? Colors.white60 : Colors.grey[700]!),
                                                onTap: () {
                                                  HapticFeedback.lightImpact();
                                                  state.togglePostLike(post.postId);
                                                },
                                              ),
                                            ),
                                            Expanded(
                                              child: _buildFacebookActionBtn(
                                                icon: Icons.chat_bubble_outline_rounded,
                                                label: 'Comment',
                                                color: isDark ? Colors.white60 : Colors.grey[700]!,
                                                onTap: () {
                                                  HapticFeedback.lightImpact();
                                                  showModalBottomSheet(
                                                    context: context,
                                                    isScrollControlled: true,
                                                    backgroundColor: Colors.transparent,
                                                    builder: (_) => CommentsBottomSheet(post: post),
                                                  );
                                                },
                                              ),
                                            ),
                                            Expanded(
                                              child: _buildFacebookActionBtn(
                                                icon: Icons.share_outlined,
                                                label: 'Share',
                                                color: isDark ? Colors.white60 : Colors.grey[700]!,
                                                onTap: () => _showShareModal(context, post),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      // Trigger the cinematic loader based on sync state
                      if (state.isLoading)
                        const Positioned.fill(
                          child: TailWaggingLoader(isGlobal: true),
                        ),
                    ],
                  ),
          ),
        ],
      ),
      // Overlay the cinematic loader at the Scaffold level to ensure it slides from the real screen bottom
      floatingActionButton: state.isLoading 
        ? const TailWaggingLoader(isGlobal: true) 
        : null,
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  Widget _buildComposerActionBtn({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
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
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFacebookActionBtn({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
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
              style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w700),
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
              Icon(icon, size: 15, color: isSelected ? activeColor : inactiveColor),
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
      case 'RESCUE': color = AppColors.dangerRed; break;
      case 'ADOPTION': color = AppColors.accentAmber; break;
      default: color = AppColors.primary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Text(
        postType,
        style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.8),
      ),
    );
  }
}
