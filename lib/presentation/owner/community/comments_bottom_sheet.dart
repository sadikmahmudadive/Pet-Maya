import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/feed_post_model.dart';

class CommentsBottomSheet extends StatefulWidget {
  final FeedPostModel post;

  const CommentsBottomSheet({super.key, required this.post});

  @override
  State<CommentsBottomSheet> createState() => _CommentsBottomSheetState();
}

class _CommentsBottomSheetState extends State<CommentsBottomSheet> {
  final _commentController = TextEditingController();

  void _submitComment() {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    final repo = context.read<AppStateRepository>();
    repo.addComment(widget.post.postId, text);
    _commentController.clear();
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<AppStateRepository>();
    final comments = repo.getCommentsForPost(widget.post.postId);

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.borderLight,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Comments (${comments.length})', style: AppTypography.titleMedium),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Comments List
          Expanded(
            child: comments.isEmpty
                ? Center(
                    child: Text('Be the first to leave a warm comment! 🐾', style: AppTypography.bodyMedium),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    itemCount: comments.length,
                    itemBuilder: (context, index) {
                      final c = comments[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: AppColors.primaryLight,
                              backgroundImage: c.userPhoto != null ? NetworkImage(c.userPhoto!) : null,
                              child: c.userPhoto == null ? const Icon(Icons.person, size: 16) : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(c.userName, style: AppTypography.titleMedium.copyWith(fontSize: 13, fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 2),
                                  Text(c.text, style: AppTypography.bodyMedium),
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
              left: 16,
              right: 16,
              top: 8,
              bottom: MediaQuery.of(context).viewInsets.bottom + 12,
            ),
            decoration: BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.borderLight.withOpacity(0.5))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: const InputDecoration(
                      hintText: 'Add a comment...',
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                  onPressed: _submitComment,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
