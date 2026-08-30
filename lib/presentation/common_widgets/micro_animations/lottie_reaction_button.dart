import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/models/feed_post_model.dart';
import '../../../data/repositories/app_state_repository.dart';

class ReactionConfig {
  final String label;
  final String assetPath;
  final Color activeColor;

  const ReactionConfig({
    required this.label,
    required this.assetPath,
    required this.activeColor,
  });
}

const List<ReactionConfig> kReactions = [
  ReactionConfig(
    label: 'Like',
    assetPath: 'assets/lottie/reaction_like.json',
    activeColor: Color(0xFF1877F2),
  ),
  ReactionConfig(
    label: 'Love',
    assetPath: 'assets/lottie/reaction_love.json',
    activeColor: Color(0xFFF33E58),
  ),
  ReactionConfig(
    label: 'Haha',
    assetPath: 'assets/lottie/reaction_haha.json',
    activeColor: Color(0xFFF7B125),
  ),
  ReactionConfig(
    label: 'Clap',
    assetPath: 'assets/lottie/reaction_clap.json',
    activeColor: Color(0xFF1AB680),
  ),
  ReactionConfig(
    label: 'Insight',
    assetPath: 'assets/lottie/reaction_insight.json',
    activeColor: Color(0xFFF5A623),
  ),
  ReactionConfig(
    label: 'Care',
    assetPath: 'assets/lottie/reaction_care.json',
    activeColor: Color(0xFF9C27B0),
  ),
];

class LottieReactionButton extends StatefulWidget {
  final FeedPostModel post;
  const LottieReactionButton({super.key, required this.post});

  @override
  State<LottieReactionButton> createState() => _LottieReactionButtonState();
}

class _LottieReactionButtonState extends State<LottieReactionButton>
    with SingleTickerProviderStateMixin {
  OverlayEntry? _overlayEntry;

  void _showReactionPicker(BuildContext context) {
    final RenderBox renderBox = context.findRenderObject() as RenderBox;
    final offset = renderBox.localToGlobal(Offset.zero);
    final size = MediaQuery.of(context).size;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    _overlayEntry = OverlayEntry(
      builder: (context) => Stack(
        children: [
          // Dismiss background barrier
          GestureDetector(
            onTap: _hideReactionPicker,
            behavior: HitTestBehavior.translucent,
            child: Container(color: Colors.transparent),
          ),
          Positioned(
            left: (offset.dx - 12).clamp(12.0, size.width - 340.0),
            top: offset.dy - 85,
            child: Material(
              color: Colors.transparent,
              child: ElasticInUp(
                duration: const Duration(milliseconds: 400),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF1E2630)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(36),
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.1)
                          : Colors.black.withValues(alpha: 0.06),
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.18),
                        blurRadius: 28,
                        spreadRadius: 2,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: kReactions.map((reaction) {
                      return _ReactionItem(
                        reaction: reaction,
                        onSelected: () {
                          final state = context.read<AppStateRepository>();
                          state.togglePostReaction(
                            widget.post.postId,
                            reaction.label,
                          );
                          HapticFeedback.mediumImpact();
                          _hideReactionPicker();
                        },
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);
    HapticFeedback.lightImpact();
  }

  void _hideReactionPicker() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final userId = state.currentUser?.uid ?? 'guest';
    final userReaction = widget.post.getUserReaction(userId);
    final isReacted = userReaction != null;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final activeConfig = isReacted
        ? kReactions.firstWhere(
            (r) => r.label.toLowerCase() == userReaction.toLowerCase(),
            orElse: () => kReactions.first,
          )
        : null;

    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        state.togglePostLike(widget.post.postId);
      },
      onLongPress: () => _showReactionPicker(context),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isReacted && activeConfig != null)
              ElasticIn(
                key: ValueKey(activeConfig.label),
                duration: const Duration(milliseconds: 400),
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: Lottie.asset(
                    activeConfig.assetPath,
                    repeat: true,
                    fit: BoxFit.contain,
                  ),
                ),
              )
            else
              Icon(
                Icons.thumb_up_alt_outlined,
                color: isDark ? Colors.white60 : Colors.grey[700],
                size: 20,
              ),
            const SizedBox(width: 8),
            Text(
              activeConfig?.label ?? 'Like',
              style: TextStyle(
                color: isReacted
                    ? activeConfig!.activeColor
                    : (isDark ? Colors.white60 : Colors.grey[700]!),
                fontWeight: isReacted ? FontWeight.w800 : FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReactionItem extends StatefulWidget {
  final ReactionConfig reaction;
  final VoidCallback onSelected;

  const _ReactionItem({
    required this.reaction,
    required this.onSelected,
  });

  @override
  State<_ReactionItem> createState() => _ReactionItemState();
}

class _ReactionItemState extends State<_ReactionItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: widget.onSelected,
      onTapDown: (_) => setState(() => _isHovered = true),
      onTapUp: (_) => setState(() => _isHovered = false),
      onTapCancel: () => setState(() => _isHovered = false),
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 5),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedScale(
              scale: _isHovered ? 1.35 : 1.0,
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutBack,
              child: SizedBox(
                width: 42,
                height: 42,
                child: Lottie.asset(
                  widget.reaction.assetPath,
                  repeat: true,
                  fit: BoxFit.contain,
                ),
              ),
            ),
            const SizedBox(height: 3),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 150),
              style: GoogleFonts.plusJakartaSans(
                fontSize: 9.5,
                fontWeight: _isHovered ? FontWeight.w800 : FontWeight.w600,
                color: _isHovered
                    ? widget.reaction.activeColor
                    : (isDark ? Colors.white60 : Colors.grey[600]),
              ),
              child: Text(widget.reaction.label),
            ),
          ],
        ),
      ),
    );
  }
}
