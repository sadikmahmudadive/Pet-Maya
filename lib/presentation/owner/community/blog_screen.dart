import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/blog_post_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/empty_state.dart';
import 'blog_detail_screen.dart';
import 'create_blog_screen.dart';

class BlogScreen extends StatefulWidget {
  const BlogScreen({super.key});

  @override
  State<BlogScreen> createState() => _BlogScreenState();
}

class _BlogScreenState extends State<BlogScreen> {
  String _selectedCategory = 'ALL';

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final blogs = state.blogs.where((b) {
      if (!b.isApproved && b.status != 'APPROVED') return false;
      if (_selectedCategory == 'ALL') return true;
      return b.category.toUpperCase() == _selectedCategory;
    }).toList();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final categories = ['ALL', 'HEALTH', 'NUTRITION', 'TRAINING', 'LIFESTYLE'];

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Pet Care Blog', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          
          // ─── CATEGORY FILTER ───────────────────────────────────────────────
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: categories.map((cat) => _buildCategoryChip(cat)).toList(),
            ),
          ),

          Expanded(
            child: blogs.isEmpty
                ? const EmptyState(
                    icon: Icons.article_outlined,
                    title: 'No articles found',
                    message: 'We are working on new content for you!',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
                    itemCount: blogs.length,
                    physics: const BouncingScrollPhysics(),
                    itemBuilder: (context, index) {
                      return FadeInUp(
                        delay: Duration(milliseconds: 100 * index),
                        child: _buildBlogCard(context, blogs[index]),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateBlogScreen())),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.edit_document),
        label: const Text('Write Article', style: TextStyle(fontWeight: FontWeight.bold)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      ),
    );
  }

  Widget _buildCategoryChip(String cat) {
    final isSelected = _selectedCategory == cat;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: ChoiceChip(
        label: Text(cat, style: TextStyle(
          fontSize: 11, 
          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
          color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black54),
        )),
        selected: isSelected,
        onSelected: (val) => setState(() => _selectedCategory = cat),
        selectedColor: AppColors.primary,
        backgroundColor: isDark ? Colors.white10 : Colors.grey[100],
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: isSelected ? 4 : 0,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
    );
  }

  Widget _buildBlogCard(BuildContext context, BlogPostModel blog) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateStr = DateFormat('MMM d, yyyy').format(DateTime.fromMillisecondsSinceEpoch(blog.timestamp));

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: PremiumCard(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => BlogDetailScreen(blog: blog))),
        opacity: isDark ? 0.2 : 0.15,
        borderRadius: 28,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              child: CachedNetworkImage(
                imageUrl: blog.imageUrl,
                height: 180,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(color: Colors.grey[200]),
                errorWidget: (context, url, error) => const Icon(Icons.error),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(blog.category.toUpperCase(), style: const TextStyle(
                          color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5
                        )),
                      ),
                      Text('${blog.readTimeMinutes} min read', style: TextStyle(
                        fontSize: 10, color: Colors.grey[500], fontWeight: FontWeight.w600
                      )),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(blog.title, style: GoogleFonts.plusJakartaSans(
                    fontSize: 18, fontWeight: FontWeight.w800, height: 1.3
                  )),
                  const SizedBox(height: 8),
                  Text(blog.content, 
                    maxLines: 2, 
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 13, color: isDark ? Colors.white60 : Colors.grey[600], height: 1.5)
                  ),
                  const SizedBox(height: 16),
                  Builder(builder: (context) {
                    final repo = context.read<AppStateRepository>();
                    final currentUser = context.select((AppStateRepository r) => r.currentUser);
                    String authorName = blog.authorName;
                    String? authorPhoto = blog.authorPhoto;

                    if (currentUser != null && blog.authorId == currentUser.uid) {
                      authorName = currentUser.name;
                      authorPhoto = currentUser.photoUrl;
                    } else if (repo.userCache.containsKey(blog.authorId)) {
                      final cached = repo.userCache[blog.authorId]!;
                      authorName = cached.name;
                      authorPhoto = cached.photoUrl;
                    } else {
                      repo.fetchAndCacheUser(blog.authorId);
                    }

                    return Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundImage: authorPhoto != null && authorPhoto.isNotEmpty
                              ? (authorPhoto.startsWith('http') 
                                  ? NetworkImage(authorPhoto) as ImageProvider
                                  : AssetImage(authorPhoto) as ImageProvider)
                              : null,
                          child: authorPhoto == null || authorPhoto.isEmpty
                              ? const Icon(Icons.person, size: 12)
                              : null,
                        ),
                        const SizedBox(width: 8),
                        Text(authorName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        const Spacer(),
                        Text(dateStr, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                      ],
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
