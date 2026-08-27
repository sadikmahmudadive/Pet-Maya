import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import 'dart:io';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/blog_post_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../core/services/firebase_storage_service.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/lottie_upload_icon.dart';

class CreateBlogScreen extends StatefulWidget {
  const CreateBlogScreen({super.key});

  @override
  State<CreateBlogScreen> createState() => _CreateBlogScreenState();
}

class _CreateBlogScreenState extends State<CreateBlogScreen> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _tagController = TextEditingController();
  
  String _selectedCategory = 'Health';
  File? _imageFile;
  bool _isUploading = false;
  final List<String> _tags = [];

  final List<String> _categories = ['Health', 'Nutrition', 'Training', 'Lifestyle', 'Events'];

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (pickedFile != null) {
      setState(() => _imageFile = File(pickedFile.path));
    }
  }

  void _addTag() {
    final tag = _tagController.text.trim().toLowerCase();
    if (tag.isNotEmpty && !_tags.contains(tag)) {
      setState(() {
        _tags.add(tag);
        _tagController.clear();
      });
    }
  }

  void _submitBlog() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();

    if (title.isEmpty || content.isEmpty || _imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide a title, content, and cover image'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isUploading = true);
    final repo = context.read<AppStateRepository>();
    final user = repo.currentUser;

    if (user == null) {
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You must be logged in to publish an article'), backgroundColor: AppColors.dangerRed),
      );
      return;
    }

    try {
      // 1. Upload cover image
      final imageUrl = await FirebaseStorageService().uploadImage(_imageFile!, 'blogs');
      if (imageUrl == null) throw Exception('Image upload failed');

      final isAdmin = user?.role == UserRole.admin || user?.role == UserRole.superAdmin;
      final status = isAdmin ? 'APPROVED' : 'PENDING';
      final isApproved = isAdmin;

      // 2. Create blog model
      final blog = BlogPostModel(
        id: 'blog_${const Uuid().v4().substring(0, 8)}',
        authorId: user?.uid ?? 'guest',
        authorName: user?.name ?? 'Pet Lover',
        authorPhoto: user?.photoUrl,
        title: title,
        content: content,
        imageUrl: imageUrl,
        category: _selectedCategory,
        timestamp: DateTime.now().millisecondsSinceEpoch,
        readTimeMinutes: (content.split(' ').length / 200).ceil().clamp(1, 60),
        tags: _tags,
        status: status,
        isApproved: isApproved,
      );

      // 3. Save to repository
      await repo.addBlog(blog);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(isAdmin 
                ? 'Blog published successfully! 📝' 
                : 'Article submitted for review! It will go live after admin approval 📝'),
            backgroundColor: AppColors.healthGreen,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.dangerRed, behavior: SnackBarBehavior.floating),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Write Article'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (!_isUploading)
            TextButton(
              onPressed: _submitBlog,
              child: const Text('PUBLISH', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
            ),
          const SizedBox(width: 12),
        ],
      ),
      body: _isUploading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ─── COVER IMAGE ───────────────────────────────────────────
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      width: double.infinity,
                      height: 200,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : Colors.grey[100],
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: isDark ? Colors.white12 : Colors.black12, width: 1.5),
                        image: _imageFile != null
                            ? DecorationImage(image: FileImage(_imageFile!), fit: BoxFit.cover)
                            : null,
                      ),
                      child: _imageFile == null
                          ? Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const LottieUploadIcon(size: 56),
                                const SizedBox(height: 8),
                                Text('Add Cover Image', style: TextStyle(color: Colors.grey[500], fontWeight: FontWeight.w600)),
                              ],
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // ─── TITLE ─────────────────────────────────────────────────
                  TextField(
                    controller: _titleController,
                    style: GoogleFonts.plusJakartaSans(fontSize: 24, fontWeight: FontWeight.w800),
                    decoration: InputDecoration(
                      hintText: 'Article Title',
                      hintStyle: TextStyle(color: Colors.grey[400]),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                    maxLines: null,
                  ),
                  const SizedBox(height: 12),
                  Divider(color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06)),
                  const SizedBox(height: 12),

                  // ─── CATEGORY & TAGS ────────────────────────────────────────
                  Row(
                    children: [
                      const Icon(Icons.category_rounded, size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                      DropdownButton<String>(
                        value: _selectedCategory,
                        underline: const SizedBox(),
                        icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
                        items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)))).toList(),
                        onChanged: (val) => setState(() => _selectedCategory = val!),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Tags
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ..._tags.map((tag) => Chip(
                            label: Text(tag, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                            onDeleted: () => setState(() => _tags.remove(tag)),
                            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                            side: BorderSide.none,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          )),
                      SizedBox(
                        width: 100,
                        child: TextField(
                          controller: _tagController,
                          onSubmitted: (_) => _addTag(),
                          decoration: const InputDecoration(
                            hintText: '+ Add tag',
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: EdgeInsets.zero,
                            hintStyle: TextStyle(fontSize: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // ─── CONTENT ───────────────────────────────────────────────
                  TextField(
                    controller: _contentController,
                    style: const TextStyle(fontSize: 16, height: 1.6),
                    decoration: InputDecoration(
                      hintText: 'Share your expert knowledge...',
                      hintStyle: TextStyle(color: Colors.grey[400]),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                    maxLines: null,
                  ),
                  const SizedBox(height: 200),
                ],
              ),
            ),
    );
  }
}
