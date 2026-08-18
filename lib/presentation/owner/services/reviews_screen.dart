import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
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
  final _commentController = TextEditingController();
  double _userRating = 5.0;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<AppStateRepository>().loadReviews(widget.targetId));
  }

  @override
  Widget build(BuildContext context) {
    final reviews = context.select((AppStateRepository repo) => repo.reviews);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(widget.targetName, style: const TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('User Experience', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: -0.5)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.healthGreen.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                  child: const Text('VERIFIED', style: TextStyle(color: AppColors.healthGreen, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 1)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: reviews.isEmpty
                ? const EmptyState(
                    icon: Icons.rate_review_outlined,
                    title: 'No reviews yet',
                    message: 'Be the first to share your experience with the community!',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    physics: const BouncingScrollPhysics(),
                    itemCount: reviews.length,
                    itemBuilder: (context, index) {
                      final review = reviews[index];
                      final dateStr = DateFormat.yMMMd().format(DateTime.fromMillisecondsSinceEpoch(review.timestamp));

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
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(review.reviewerName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                                      Text(dateStr, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey[500])),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: List.generate(5, (i) => Padding(
                                      padding: const EdgeInsets.only(right: 2),
                                      child: Icon(
                                        Icons.star_rounded, 
                                        size: 16, 
                                        color: i < review.rating ? AppColors.accentAmber : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
                                      ),
                                    )),
                                  ),
                                  const SizedBox(height: 14),
                                  Text(review.comment, 
                                    style: TextStyle(fontSize: 14, color: isDark ? Colors.white70 : Colors.black87, height: 1.5, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          _buildAddReviewSheet(),
        ],
      ),
    );
  }

  Widget _buildAddReviewSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 32,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 40, offset: const Offset(0, -10))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('RATE YOUR EXPERIENCE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.5, color: AppColors.primary)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) => IconButton(
              onPressed: () {
                HapticFeedback.selectionClick();
                setState(() => _userRating = index + 1.0);
              },
              icon: Icon(
                index < _userRating ? Icons.star_rounded : Icons.star_outline_rounded,
                color: AppColors.accentAmber,
                size: 36,
              ),
            )),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: PremiumCard(
                  opacity: 0.1,
                  borderRadius: 20,
                  child: TextField(
                    controller: _commentController,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Share details of your visit...',
                      hintStyle: TextStyle(color: isDark ? Colors.white24 : Colors.grey, fontSize: 14),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: _submitReview,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                  child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _submitReview() {
    final comment = _commentController.text.trim();
    if (comment.isEmpty) return;

    context.read<AppStateRepository>().addReview(
      targetId: widget.targetId,
      rating: _userRating,
      comment: comment,
    );
    HapticFeedback.mediumImpact();
    _commentController.clear();
    FocusScope.of(context).unfocus();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Review published! ⭐️'), behavior: SnackBarBehavior.floating, backgroundColor: AppColors.healthGreen),
    );
  }
}
