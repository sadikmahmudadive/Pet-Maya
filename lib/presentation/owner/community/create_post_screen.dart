import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/feed_post_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _contentController = TextEditingController();
  String _postType = 'MOMENT';
  String? _imageUrl = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop';

  void _submitPost() {
    final content = _contentController.text.trim();
    if (content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please write something to share')),
      );
      return;
    }

    final repo = context.read<AppStateRepository>();
    final post = FeedPostModel(
      postId: 'post_${const Uuid().v4().substring(0, 6)}',
      userId: repo.currentUser?.uid ?? 'user_1',
      userName: repo.currentUser?.name ?? 'Alex Smith',
      userPhoto: repo.currentUser?.photoUrl,
      postType: _postType,
      content: content,
      imageUrl: _imageUrl,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    repo.addPost(post);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Post published to community! 🎉'), backgroundColor: AppColors.healthGreen),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Create Post'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          TextButton(
            onPressed: _submitPost,
            child: Text('POST', style: AppTypography.titleMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 14, letterSpacing: 0.8)),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Post type chips
            FadeInDown(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('SELECT CATEGORY', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 16),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: [
                        _buildTypeChip('MOMENT', '📸 Moment'),
                        _buildTypeChip('ADOPTION', '🏡 Adoption'),
                        _buildTypeChip('RESCUE', '🚨 Rescue'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),

            // Content textfield
            FadeInUp(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('POST CONTENT', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 16),
                  PremiumCard(
                    opacity: 0.15,
                    borderRadius: 24,
                    child: TextField(
                      controller: _contentController,
                      maxLines: 6,
                      style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, height: 1.6),
                      decoration: InputDecoration(
                        hintText: 'Share your pet story or ask for advice...',
                        hintStyle: TextStyle(color: AppColors.textTertiary.withOpacity(0.5)),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),

            // Image Preview / Selector
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('ATTACHMENT', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 16),
                  if (_imageUrl != null)
                    Stack(
                      children: [
                        PremiumCard(
                          opacity: 0.4,
                          borderRadius: 24,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: Image.network(_imageUrl!, height: 240, width: double.infinity, fit: BoxFit.cover),
                          ),
                        ),
                        Positioned(
                          top: 12,
                          right: 12,
                          child: GestureDetector(
                            onTap: () => setState(() => _imageUrl = null),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                              child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                      ],
                    )
                  else
                    PremiumCard(
                      onTap: () {
                        setState(() {
                          _imageUrl = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop';
                        });
                      },
                      opacity: 0.1,
                      borderRadius: 24,
                      child: Container(
                        height: 120,
                        width: double.infinity,
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.add_photo_alternate_rounded, color: AppColors.primary, size: 32),
                            const SizedBox(height: 8),
                            Text('Add Photo from Gallery', 
                              style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w600, color: AppColors.primary)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeChip(String type, String label) {
    final isSelected = _postType == type;
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: PremiumCard(
        onTap: () => setState(() => _postType = type),
        opacity: isSelected ? 0.4 : 0.1,
        borderRadius: 20,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          child: Text(
            label,
            style: AppTypography.labelSmall.copyWith(
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
          ),
        ),
      ),
    );
  }
}
