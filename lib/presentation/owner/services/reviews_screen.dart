import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/review_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/empty_state.dart';

class ReviewsScreen extends StatefulWidget {
  final String targetId;
  final String targetName;

  const ReviewsScreen({
    super.key,
    required this.targetId,
    required this.targetName,
  });

  @override
  State<ReviewsScreen> createState() => _ReviewsScreenState();
}

class _ReviewsScreenState extends State<ReviewsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppStateRepository>().loadReviews(widget.targetId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final reviews = context.watch<AppStateRepository>().reviews;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('${widget.targetName}\'s Reviews', style: const TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: reviews.isEmpty
          ? const EmptyState(
              icon: Icons.star_outline_rounded,
              title: 'No reviews yet',
              message: 'Be the first to share your experience with this provider!',
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
              itemCount: reviews.length,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context, index) {
                final review = reviews[index];
                return FadeInUp(
                  delay: Duration(milliseconds: 50 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: PremiumCard(
                      opacity: 0.15,
                      borderRadius: 24,
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 20,
                                  backgroundImage: review.reviewerPhoto != null
                                      ? CachedNetworkImageProvider(review.reviewerPhoto!)
                                      : null,
                                  child: review.reviewerPhoto == null
                                      ? const Icon(Icons.person, size: 20)
                                      : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(review.reviewerName,
                                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                                      Text(
                                        DateFormat('MMM dd, yyyy').format(
                                            DateTime.fromMillisecondsSinceEpoch(review.timestamp)),
                                        style: TextStyle(fontSize: 10, color: Colors.grey[500], fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                ),
                                _buildRatingBadge(review.rating),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              review.comment,
                              style: TextStyle(
                                  fontSize: 13,
                                  height: 1.5,
                                  color: isDark ? Colors.white70 : Colors.black87,
                                  fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddReviewSheet(context),
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.rate_review_rounded, color: Colors.white),
        label: const Text('WRITE A REVIEW',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
      ),
    );
  }

  Widget _buildRatingBadge(double rating) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.accentAmber.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 14),
          const SizedBox(width: 4),
          Text(rating.toString(),
              style: const TextStyle(color: AppColors.accentAmber, fontWeight: FontWeight.w900, fontSize: 12)),
        ],
      ),
    );
  }

  void _showAddReviewSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddReviewBottomSheet(
        targetId: widget.targetId,
        targetName: widget.targetName,
      ),
    );
  }
}

class _AddReviewBottomSheet extends StatefulWidget {
  final String targetId;
  final String targetName;

  const _AddReviewBottomSheet({required this.targetId, required this.targetName});

  @override
  State<_AddReviewBottomSheet> createState() => _AddReviewBottomSheetState();
}

class _AddReviewBottomSheetState extends State<_AddReviewBottomSheet> {
  double _rating = 5.0;
  final _commentController = TextEditingController();
  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.only(
          top: 24, left: 24, right: 24, bottom: MediaQuery.of(context).viewInsets.bottom + 32),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
                child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 24),
            Text('Rate ${widget.targetName}',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            const Text('Share your experience with the community',
                style: TextStyle(fontSize: 14, color: Colors.grey, fontWeight: FontWeight.w600)),
            const SizedBox(height: 32),
            
            // Star Rating Selector
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: AppColors.accentAmber,
                      size: 44,
                    ),
                    onPressed: () => setState(() => _rating = index + 1.0),
                  );
                }),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: Text(
                _getRatingLabel(),
                style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary, fontSize: 16),
              ),
            ),
            const SizedBox(height: 40),

            // Comment Input
            const Text('YOUR COMMENT',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 10, color: Colors.grey, letterSpacing: 1)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(18),
              ),
              child: TextField(
                controller: _commentController,
                maxLines: 4,
                style: const TextStyle(fontWeight: FontWeight.w600),
                decoration: const InputDecoration(
                  hintText: 'Describe your visit, the care provided...',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 18),
                ),
              ),
            ),
            const SizedBox(height: 40),

            SizedBox(
              width: double.infinity,
              height: 64,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: _isSaving
                    ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                    : const Text('SUBMIT REVIEW',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getRatingLabel() {
    if (_rating >= 5) return 'EXCELLENT';
    if (_rating >= 4) return 'VERY GOOD';
    if (_rating >= 3) return 'GOOD';
    if (_rating >= 2) return 'FAIR';
    return 'POOR';
  }

  void _submit() async {
    if (_commentController.text.trim().isEmpty) return;
    setState(() => _isSaving = true);
    HapticFeedback.mediumImpact();
    
    await context.read<AppStateRepository>().addReview(
      targetId: widget.targetId,
      rating: _rating,
      comment: _commentController.text.trim(),
    );
    
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Thank you! Your review has been posted. ✨'), backgroundColor: AppColors.healthGreen),
      );
    }
  }
}
