import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/review_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

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

    return GlassScaffold(
      appBar: AppBar(
        title: Text(widget.targetName),
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
                Text('User Reviews', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                _buildTonalBadge('Verified', AppColors.healthGreen),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: reviews.isEmpty
                ? Center(
                    child: Text('No reviews yet. Be the first to share!', 
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.textTertiary)),
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
                          padding: const EdgeInsets.only(bottom: 12),
                          child: PremiumCard(
                            opacity: 0.1,
                            borderRadius: 24,
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(review.reviewerName, style: AppTypography.titleMedium.copyWith(fontSize: 15, fontWeight: FontWeight.w700)),
                                      Text(dateStr, style: AppTypography.labelSmall.copyWith(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textTertiary)),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: List.generate(5, (i) => Padding(
                                      padding: const EdgeInsets.only(right: 2),
                                      child: Icon(
                                        Icons.star_rounded, 
                                        size: 14, 
                                        color: i < review.rating ? AppColors.accentAmber : Colors.black.withOpacity(0.05),
                                      ),
                                    )),
                                  ),
                                  const SizedBox(height: 12),
                                  Text(review.comment, 
                                    style: AppTypography.bodyMedium.copyWith(fontSize: 14, color: AppColors.textSecondary, height: 1.5, fontWeight: FontWeight.w500)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          _buildAddReviewField(),
        ],
      ),
    );
  }

  Widget _buildTonalBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
      child: Text(label.toUpperCase(), style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 9, letterSpacing: 0.5)),
    );
  }

  Widget _buildAddReviewField() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.4),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) => IconButton(
                onPressed: () => setState(() => _userRating = index + 1.0),
                icon: Icon(
                  index < _userRating ? Icons.star_rounded : Icons.star_outline_rounded,
                  color: AppColors.accentAmber,
                  size: 32,
                ),
              )),
            ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: InputDecoration(
                      hintText: 'Share your experience...',
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.5),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                FloatingActionButton(
                  onPressed: _submitReview,
                  backgroundColor: AppColors.primary,
                  mini: true,
                  child: const Icon(Icons.send_rounded, color: Colors.white),
                ),
              ],
            ),
          ],
        ),
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
    _commentController.clear();
    FocusScope.of(context).unfocus();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Review submitted!')));
  }
}
