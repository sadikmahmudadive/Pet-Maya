import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/blog_post_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';
import '../common_widgets/monogram_avatar.dart';

class AdminBlogManagerScreen extends StatefulWidget {
  const AdminBlogManagerScreen({super.key});

  @override
  State<AdminBlogManagerScreen> createState() => _AdminBlogManagerScreenState();
}

class _AdminBlogManagerScreenState extends State<AdminBlogManagerScreen> {
  String _searchQuery = '';
  String _selectedStatus = 'ALL'; // ALL, PENDING, APPROVED

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final blogs = state.blogs;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final pendingCount = blogs.where((b) => !b.isApproved && b.status != 'APPROVED').length;

    final filteredBlogs = blogs.where((blog) {
      // Status filter
      if (_selectedStatus == 'PENDING') {
        if (blog.isApproved || blog.status == 'APPROVED') return false;
      } else if (_selectedStatus == 'APPROVED') {
        if (!blog.isApproved && blog.status != 'APPROVED') return false;
      }

      final query = _searchQuery.toLowerCase();
      return blog.title.toLowerCase().contains(query) ||
             blog.authorName.toLowerCase().contains(query) ||
             blog.category.toLowerCase().contains(query);
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Editorial Command', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),

          // ─── STATUS FILTER TABS ──────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _buildStatusTab('ALL', 'All (${blogs.length})', isDark),
                const SizedBox(width: 8),
                _buildStatusTab('PENDING', 'Pending ($pendingCount)', isDark, isWarning: pendingCount > 0),
                const SizedBox(width: 8),
                _buildStatusTab('APPROVED', 'Live (${blogs.length - pendingCount})', isDark),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: PremiumCard(
              opacity: 0.1,
              borderRadius: 20,
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  hintText: 'Search articles, authors...',
                  hintStyle: TextStyle(color: isDark ? Colors.white24 : Colors.grey),
                  prefixIcon: Icon(Icons.search_rounded, color: isDark ? Colors.white54 : Colors.grey),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 18),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          Expanded(
            child: filteredBlogs.isEmpty
                ? const EmptyState(
                    icon: Icons.article_outlined,
                    title: 'No articles found',
                    message: 'Manage and moderate community blog posts here.',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filteredBlogs.length,
                    itemBuilder: (context, index) {
                      final blog = filteredBlogs[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 30 * index),
                        child: _buildBlogAdminTile(context, blog, state),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusTab(String key, String label, bool isDark, {bool isWarning = false}) {
    final isSelected = _selectedStatus == key;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedStatus = key),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected 
                ? (isWarning ? Colors.orange : AppColors.primary) 
                : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
            borderRadius: BorderRadius.circular(14),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBlogAdminTile(BuildContext context, BlogPostModel blog, AppStateRepository state) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateStr = DateFormat('MMM d, yyyy').format(DateTime.fromMillisecondsSinceEpoch(blog.timestamp));
    final isApproved = blog.isApproved || blog.status == 'APPROVED';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: PremiumCard(
        opacity: 0.15,
        borderRadius: 24,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: CachedNetworkImage(
                  imageUrl: blog.imageUrl,
                  width: 80,
                  height: 80,
                  fit: BoxFit.cover,
                  errorWidget: (c, u, e) => Container(color: Colors.grey[200], child: const Icon(Icons.article)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(blog.category.toUpperCase(), 
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.5)),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: (isApproved ? Colors.green : Colors.orange).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(isApproved ? 'LIVE' : 'PENDING REVIEW', 
                            style: TextStyle(color: isApproved ? Colors.green : Colors.orange, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.5)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(blog.title, 
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 15)),
                    const SizedBox(height: 2),
                    Text('By ${blog.authorName} • $dateStr', 
                      style: TextStyle(fontSize: 10, color: Colors.grey[500], fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.more_vert_rounded, color: Colors.grey),
                onPressed: () => _showModerationOptions(context, blog, state),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showModerationOptions(BuildContext context, BlogPostModel blog, AppStateRepository state) {
    final isApproved = blog.isApproved || blog.status == 'APPROVED';

    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text('Moderate: ${blog.title}'),
        actions: [
          if (!isApproved)
            CupertinoActionSheetAction(
              onPressed: () {
                state.updateBlogStatus(blog.id, 'APPROVED', true);
                Navigator.pop(ctx);
              },
              child: const Text('Approve & Publish'),
            ),
          if (blog.status != 'REJECTED' && !isApproved)
            CupertinoActionSheetAction(
              onPressed: () {
                state.updateBlogStatus(blog.id, 'REJECTED', false);
                Navigator.pop(ctx);
              },
              child: const Text('Reject Submission'),
            ),
          if (isApproved)
            CupertinoActionSheetAction(
              onPressed: () {
                state.updateBlogStatus(blog.id, 'UNPUBLISHED', false);
                Navigator.pop(ctx);
              },
              child: const Text('Unpublish Article'),
            ),
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            onPressed: () {
              Navigator.pop(ctx);
              _confirmDelete(context, blog, state);
            },
            child: const Text('Delete Permanently'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, BlogPostModel blog, AppStateRepository state) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: const Text('Delete Article?'),
        content: Text('Are you sure you want to permanently remove "${blog.title}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.dangerRed),
            onPressed: () {
              state.deleteBlog(blog.id);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Article deleted from community feed.'), backgroundColor: AppColors.dangerRed),
              );
            },
            child: const Text('DELETE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
