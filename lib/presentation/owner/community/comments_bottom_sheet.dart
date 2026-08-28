import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/feed_post_model.dart';
import '../../common_widgets/premium_card.dart';

class CommentsBottomSheet extends StatefulWidget {
  final FeedPostModel post;

  const CommentsBottomSheet({super.key, required this.post});

  @override
  State<CommentsBottomSheet> createState() => _CommentsBottomSheetState();
}

class _CommentsBottomSheetState extends State<CommentsBottomSheet> {
  final _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Start listening to real-time comments for this post
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppStateRepository>().listenToComments(widget.post.postId);
    });
  }

  void _submitComment() {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    HapticFeedback.lightImpact();
    final repo = context.read<AppStateRepository>();
    repo.addComment(widget.post.postId, text);
    _commentController.clear();
    // Keep focus for multiple comments if preferred, or unfocus
    // FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<AppStateRepository>();
    final comments = repo.getCommentsForPost(widget.post.postId);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Discussion (${comments.length})', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800, fontSize: 18)),
                IconButton(icon: const Icon(Icons.close_rounded, size: 20), onPressed: () => Navigator.pop(context)),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: comments.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline_rounded, size: 48, color: Theme.of(context).dividerColor),
                        const SizedBox(height: 12),
                        Text('Be the first to share a thought!', style: AppTypography.bodyMedium.copyWith(color: Colors.grey[500])),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    physics: const BouncingScrollPhysics(),
                    itemCount: comments.length,
                    itemBuilder: (context, index) {
                      final c = comments[index];
                      final date = DateTime.fromMillisecondsSinceEpoch(c.timestamp);
                      final diff = DateTime.now().difference(date);
                      String timeStr = 'Just now';
                      if (diff.inMinutes > 0 && diff.inMinutes < 60) {
                        timeStr = '${diff.inMinutes}m';
                      } else if (diff.inHours > 0 && diff.inHours < 24) timeStr = '${diff.inHours}h';
                      else if (diff.inDays > 0) timeStr = '${diff.inDays}d';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: AppColors.primaryLight,
                              backgroundImage: (c.userPhoto != null && c.userPhoto!.isNotEmpty)
                                  ? NetworkImage(c.userPhoto!)
                                  : null,
                              child: (c.userPhoto == null || c.userPhoto!.isEmpty)
                                  ? const Icon(Icons.person, size: 18)
                                  : null,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(c.userName, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                                            if (repo.userCache[c.userId]?.isVerified ?? false) ...[
                                              const SizedBox(width: 4),
                                              const Icon(Icons.verified_rounded, color: AppColors.healthGreen, size: 12),
                                            ],
                                          ],
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          c.text,
                                          style: TextStyle(
                                            fontSize: 13,
                                            height: 1.4,
                                            fontWeight: FontWeight.w500,
                                            color: isDark ? Colors.white.withValues(alpha: 0.9) : Colors.black87,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Padding(
                                    padding: const EdgeInsets.only(left: 12),
                                    child: Row(
                                      children: [
                                        Text(timeStr, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey[500])),
                                        const SizedBox(width: 14),
                                        GestureDetector(
                                          onTap: () {},
                                          child: Text('Like', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey[600])),
                                        ),
                                        const SizedBox(width: 14),
                                        GestureDetector(
                                          onTap: () {},
                                          child: Text('Reply', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey[600])),
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
                    },
                  ),
          ),

          // Input Bar
          Container(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, -10))],
            ),
            child: Row(
              children: [
                Expanded(
                  child: PremiumCard(
                    opacity: 0.1,
                    borderRadius: 24,
                    child: TextField(
                      controller: _commentController,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Write a public comment...',
                        hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _submitComment,
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                    child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
