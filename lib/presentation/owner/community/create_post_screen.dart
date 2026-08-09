import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/feed_post_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';

import '../../../core/services/cloudinary_service.dart';

class CreatePostScreen extends StatefulWidget {
  const CreatePostScreen({super.key});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _contentController = TextEditingController();
  String _postType = 'MOMENT';
  String? _selectedImageUrl;
  File? _localImage;
  bool _isPosting = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _localImage = File(pickedFile.path);
        _selectedImageUrl = pickedFile.path;
      });
    }
  }

  void _submitPost() async {
    final content = _contentController.text.trim();
    if (content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please share a story or thought'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isPosting = true);
    final repo = context.read<AppStateRepository>();

    String? finalImageUrl;

    // Upload to Cloudinary if image selected
    if (_localImage != null) {
      final uploadedUrl = await CloudinaryService().uploadImage(_localImage!, 'community_posts');
      if (uploadedUrl != null) {
        finalImageUrl = uploadedUrl;
      } else {
        if (!mounted) return;
        setState(() => _isPosting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to upload image'), backgroundColor: AppColors.dangerRed),
        );
        return;
      }
    }

    final post = FeedPostModel(
      postId: 'post_${const Uuid().v4().substring(0, 8)}',
      userId: repo.currentUser?.uid ?? 'user_1',
      userName: repo.currentUser?.name ?? 'Pet Lover',
      userPhoto: repo.currentUser?.photoUrl,
      postType: _postType,
      content: content,
      imageUrl: finalImageUrl,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    repo.addPost(post);
    HapticFeedback.mediumImpact();
    repo.showToast('Community post published! 🐾');
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final currentUser = state.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Create Post', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton(
              onPressed: _isPosting ? null : _submitPost,
              child: Text('POST', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5)),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Facebook-style Profile Header
            FadeInDown(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: AppColors.primaryLight,
                    backgroundImage: currentUser?.photoUrl != null ? NetworkImage(currentUser!.photoUrl!) : null,
                    child: currentUser?.photoUrl == null ? const Icon(Icons.person, size: 22) : null,
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(currentUser?.name ?? 'Pet Lover', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white10 : Colors.black.withOpacity(0.05),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isDark ? Colors.white12 : Colors.black12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: const [
                            Icon(Icons.public_rounded, size: 12, color: AppColors.primary),
                            SizedBox(width: 4),
                            Text('Public', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary)),
                            SizedBox(width: 2),
                            Icon(Icons.arrow_drop_down_rounded, size: 16, color: AppColors.primary),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Category Chips
            FadeInDown(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Choose Category'),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: [
                        _buildTypeChip('MOMENT', 'Moment', Icons.photo_camera_rounded),
                        _buildTypeChip('ADOPTION', 'Adoption', Icons.home_rounded),
                        _buildTypeChip('RESCUE', 'Rescue', Icons.warning_amber_rounded),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Content input
            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Story Content'),
                  const SizedBox(height: 12),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 24,
                    child: TextField(
                      controller: _contentController,
                      maxLines: 8,
                      style: TextStyle(fontWeight: FontWeight.w600, height: 1.6, color: isDark ? Colors.white : Colors.black87),
                      decoration: InputDecoration(
                        hintText: 'What\'s happening with your furry friend?',
                        hintStyle: TextStyle(color: isDark ? Colors.white24 : Colors.grey, fontSize: 15),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.all(20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Image Preview
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Attachment'),
                  const SizedBox(height: 12),
                  if (_selectedImageUrl != null)
                    Stack(
                      children: [
                        PremiumCard(
                          opacity: 0.4,
                          borderRadius: 28,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(28),
                            child: Image.file(File(_selectedImageUrl!), height: 260, width: double.infinity, fit: BoxFit.cover),
                          ),
                        ),
                        Positioned(
                          top: 12,
                          right: 12,
                          child: GestureDetector(
                            onTap: () => setState(() {
                              _selectedImageUrl = null;
                              _localImage = null;
                            }),
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
                      onTap: _pickImage,
                      opacity: 0.1,
                      borderRadius: 24,
                      child: Container(
                        height: 140,
                        width: double.infinity,
                        alignment: Alignment.center,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                              child: const Icon(Icons.add_photo_alternate_rounded, color: AppColors.primary, size: 28),
                            ),
                            const SizedBox(height: 12),
                            Text('Attach a photo from gallery', 
                              style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary, fontSize: 11, letterSpacing: 0.5)),
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

  Widget _buildSectionLabel(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1.2),
      ),
    );
  }

  Widget _buildTypeChip(String type, String label, IconData icon) {
    final isSelected = _postType == type;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeColor = AppColors.primary;
    final inactiveColor = isDark ? Colors.white60 : AppColors.textSecondary;

    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: PremiumCard(
        onTap: () => setState(() => _postType = type),
        opacity: isSelected ? 0.4 : 0.05,
        borderRadius: 18,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 16, color: isSelected ? activeColor : inactiveColor),
              const SizedBox(width: 8),
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
}
