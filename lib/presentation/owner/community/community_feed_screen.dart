import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';
import 'create_post_screen.dart';
import 'comments_bottom_sheet.dart';

class CommunityFeedScreen extends StatefulWidget {
  const CommunityFeedScreen({super.key});

  @override
  State<CommunityFeedScreen> createState() => _CommunityFeedScreenState();
}

class _CommunityFeedScreenState extends State<CommunityFeedScreen> {
  String _selectedTab = 'ALL';

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final currentUserId = state.currentUser?.uid ?? 'guest';

    final posts = state.posts.where((p) {
      if (_selectedTab == 'ALL') return true;
      return p.postType == _selectedTab;
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Community'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_box_rounded, color: AppColors.primary),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CreatePostScreen()),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          // Filter Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: [
                _buildTabChip('ALL', '🐾 All'),
                _buildTabChip('MOMENT', '📸 Moments'),
                _buildTabChip('ADOPTION', '🏡 Adoption'),
                _buildTabChip('RESCUE', '🚨 Rescue'),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Feed List
          Expanded(
            child: posts.isEmpty
                ? Center(child: Text('No posts yet in this category.', style: AppTypography.bodyMedium))
                : RefreshIndicator(
                    onRefresh: () async {
                      HapticFeedback.mediumImpact();
                      final user = state.currentUser;
                      if (user != null) await state.syncFromFirebase(user);
                    },
                    child: ListView.builder(
                        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 160),
                        itemCount: posts.length,
                        itemBuilder: (context, index) {
                          final post = posts[index];
                          final isLiked = post.isLikedByUser(currentUserId);

                          return FadeInUp(
                            delay: Duration(milliseconds: 100 * index),
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 24),
                              child: PremiumCard(
                                opacity: 0.25,
                                borderRadius: 32,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Author Header
                                    Padding(
                                      padding: const EdgeInsets.all(20),
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(2),
                                            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                                            child: CircleAvatar(
                                              radius: 20,
                                              backgroundColor: AppColors.primaryLight,
                                              backgroundImage: post.userPhoto != null ? NetworkImage(post.userPhoto!) : null,
                                              child: post.userPhoto == null ? const Icon(Icons.person, size: 20) : null,
                                            ),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(post.userName, style: AppTypography.titleMedium.copyWith(fontSize: 15, fontWeight: FontWeight.w700)),
                                                Text('Trending now', style: AppTypography.labelSmall.copyWith(fontSize: 9, fontWeight: FontWeight.w700)),
                                              ],
                                            ),
                                          ),
                                          _buildPostBadge(post.postType),
                                        ],
                                      ),
                                    ),

                                    // Post text
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 20),
                                      child: Text(post.content, style: AppTypography.bodyLarge.copyWith(height: 1.6, fontSize: 15, fontWeight: FontWeight.w500)),
                                    ),

                                    // Post Image
                                    if (post.imageUrl != null) ...[
                                      const SizedBox(height: 20),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(24),
                                          child: Image.network(post.imageUrl!, width: double.infinity, height: 260, fit: BoxFit.cover),
                                        ),
                                      ),
                                    ],

                                    // Interactions
                                    Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Row(
                                        children: [
                                          _buildInteractionBtn(
                                            icon: isLiked ? Icons.favorite_rounded : Icons.favorite_outline_rounded,
                                            label: '${post.likesCount}',
                                            color: isLiked ? AppColors.dangerRed : Theme.of(context).iconTheme.color!,
                                            onTap: () {
                                              HapticFeedback.lightImpact();
                                              state.togglePostLike(post.postId);
                                            },
                                          ),
                                          const SizedBox(width: 12),
                                          _buildInteractionBtn(
                                            icon: Icons.chat_bubble_outline_rounded,
                                            label: '${post.commentsCount}',
                                            color: Theme.of(context).iconTheme.color!,
                                            onTap: () {
                                              showModalBottomSheet(
                                                context: context,
                                                isScrollControlled: true,
                                                backgroundColor: Colors.transparent,
                                                builder: (_) => CommentsBottomSheet(post: post),
                                              );
                                            },
                                          ),
                                          const Spacer(),
                                          IconButton(
                                            icon: Icon(Icons.share_outlined, size: 20, color: Theme.of(context).iconTheme.color),
                                            onPressed: () {},
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
          ),
        ],
      ),
    );
  }

  Widget _buildInteractionBtn({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(color: color.withOpacity(0.05), borderRadius: BorderRadius.circular(20)),
        child: Row(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 8),
            Text(label, style: AppTypography.titleMedium.copyWith(fontSize: 14, color: color, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _buildTabChip(String tab, String label) {
    final isSelected = _selectedTab == tab;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: PremiumCard(
        onTap: () => setState(() => _selectedTab = tab),
        opacity: isSelected ? 0.4 : 0.1,
        borderRadius: 20,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          child: Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: isSelected ? AppColors.primary : Theme.of(context).hintColor,
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        postType,
        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 9, letterSpacing: 0.5),
      ),
    );
  }
}
