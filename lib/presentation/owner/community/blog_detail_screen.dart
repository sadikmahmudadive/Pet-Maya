import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/blog_post_model.dart';
import '../../common_widgets/glass_scaffold.dart';

class BlogDetailScreen extends StatelessWidget {
  final BlogPostModel blog;
  const BlogDetailScreen({super.key, required this.blog});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateStr = DateFormat('MMMM d, yyyy').format(DateTime.fromMillisecondsSinceEpoch(blog.timestamp));

    return GlassScaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: Colors.black.withValues(alpha: 0.3),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: CircleAvatar(
              backgroundColor: Colors.black.withValues(alpha: 0.3),
              child: IconButton(
                icon: const Icon(Icons.share_rounded, size: 18, color: Colors.white),
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  Share.share('Check out this article on Pet Maya: ${blog.title}');
                },
              ),
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── HERO IMAGE ───────────────────────────────────────────────────
            Hero(
              tag: 'blog_${blog.id}',
              child: CachedNetworkImage(
                imageUrl: blog.imageUrl,
                width: double.infinity,
                height: MediaQuery.of(context).size.height * 0.4,
                fit: BoxFit.cover,
              ),
            ),

            // ─── CONTENT BODY ────────────────────────────────────────────────
            Container(
              transform: Matrix4.translationValues(0, -30, 0),
              padding: const EdgeInsets.fromLTRB(24, 32, 24, 60),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  FadeInUp(
                    duration: const Duration(milliseconds: 400),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(blog.category.toUpperCase(), style: const TextStyle(
                            color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5
                          )),
                        ),
                        const SizedBox(width: 12),
                        Text('${blog.readTimeMinutes} min read', style: TextStyle(
                          fontSize: 12, color: Colors.grey[500], fontWeight: FontWeight.w600
                        )),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  FadeInUp(
                    duration: const Duration(milliseconds: 500),
                    child: Text(blog.title, style: GoogleFonts.plusJakartaSans(
                      fontSize: 26, fontWeight: FontWeight.w800, height: 1.2
                    )),
                  ),
                  const SizedBox(height: 24),
                  
                  // Author Info
                  FadeInUp(
                    duration: const Duration(milliseconds: 600),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundImage: blog.authorPhoto != null ? NetworkImage(blog.authorPhoto!) : null,
                          child: blog.authorPhoto == null ? const Icon(Icons.person) : null,
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(blog.authorName, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                            Text(dateStr, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Main Content
                  FadeInUp(
                    duration: const Duration(milliseconds: 700),
                    child: Text(
                      blog.content,
                      style: TextStyle(
                        fontSize: 16,
                        height: 1.7,
                        color: isDark ? Colors.white.withValues(alpha: 0.85) : Colors.black87,
                      ),
                    ),
                  ),
                  
                  // Tags
                  if (blog.tags.isNotEmpty) ...[
                    const SizedBox(height: 40),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: blog.tags.map((tag) => _buildTag(tag, isDark)).toList(),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(String tag, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.05)),
      ),
      child: Text('#$tag', style: TextStyle(
        fontSize: 12, fontWeight: FontWeight.w700, color: isDark ? Colors.white60 : Colors.grey[700]
      )),
    );
  }
}
