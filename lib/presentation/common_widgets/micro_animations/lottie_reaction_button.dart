import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../data/models/feed_post_model.dart';
import '../../../data/repositories/app_state_repository.dart';

class LottieReactionButton extends StatefulWidget {
  final FeedPostModel post;
  const LottieReactionButton({super.key, required this.post});

  @override
  State<LottieReactionButton> createState() => _LottieReactionButtonState();
}

class _LottieReactionButtonState extends State<LottieReactionButton> with SingleTickerProviderStateMixin {
  OverlayEntry? _overlayEntry;

  void _showReactionPicker(BuildContext context) {
    final RenderBox renderBox = context.findRenderObject() as RenderBox;
    final offset = renderBox.localToGlobal(Offset.zero);
    final size = MediaQuery.of(context).size;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    _overlayEntry = OverlayEntry(
      builder: (context) => Stack(
        children: [
          GestureDetector(
            onTap: _hideReactionPicker,
            child: Container(color: Colors.black.withValues(alpha: 0.2)),
          ),
          Positioned(
            left: (offset.dx - 20).clamp(16, size.width - 320),
            top: offset.dy - 100,
            child: Material(
              color: Colors.transparent,
              child: ElasticInUp(
                duration: const Duration(milliseconds: 450),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E1E1E) : Colors.white,
                    borderRadius: BorderRadius.circular(40),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.4),
                        blurRadius: 30,
                        offset: const Offset(0, 15),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildReactionItem('Like', 'L', 0),
                      _buildReactionItem('Love', 'H', 1),
                      _buildReactionItem('Haha', 'LA', 2),
                      _buildReactionItem('Clap', 'CL', 3),
                      _buildReactionItem('Insight', 'B', 4),
                      _buildReactionItem('Care', 'CA', 5),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);
    HapticFeedback.mediumImpact();
  }

  void _hideReactionPicker() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  Widget _buildReactionItem(String label, String marker, int index) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () {
              context.read<AppStateRepository>().togglePostLike(widget.post.postId);
              _hideReactionPicker();
            },
            child: ScaleTransition(
              scale: const AlwaysStoppedAnimation(1.0), // Can add hover scale later
              child: _MarkerLottie(marker: marker, size: 40),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 9,
              fontWeight: FontWeight.w700,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final userId = state.currentUser?.uid ?? 'guest';
    final isLiked = widget.post.isLikedByUser(userId);
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
            if (isLiked)
              ElasticIn(
                duration: const Duration(milliseconds: 600),
                child: _MarkerLottie(marker: 'L', repeat: false, size: 24),
              )
            else
              Icon(
                Icons.thumb_up_alt_outlined,
                color: isDark ? Colors.white60 : Colors.grey[700],
                size: 20,
              ),
            const SizedBox(width: 8),
            Text(
              'Like',
              style: TextStyle(
                color: isLiked ? const Color(0xFF1877F2) : (isDark ? Colors.white60 : Colors.grey[700]!),
                fontWeight: isLiked ? FontWeight.w800 : FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MarkerLottie extends StatefulWidget {
  final String marker;
  final bool repeat;
  final double size;
  const _MarkerLottie({required this.marker, this.repeat = true, required this.size});

  @override
  State<_MarkerLottie> createState() => _MarkerLottieState();
}

class _MarkerLottieState extends State<_MarkerLottie> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Manually tuned re-mapping to achieve professional centering
    final xMap = {
      'L': 150.0,   // Like
      'CL': 285.0,  // Clap
      'CA': 425.0,  // Care
      'H': 565.0,   // Love
      'B': 705.0,   // Insight
      'LA': 850.0,  // Haha
    };
    
    final targetX = xMap[widget.marker] ?? 500.0;
    // Lower targetY moves the character DOWN in the view
    const targetY = 180.0; 
    
    final boxSize = widget.repeat ? 40.0 : 20.0;
    // Scale factor to keep characters large but with safe margins
    final scale = boxSize / 160.0; 

    return Container(
      width: boxSize,
      height: boxSize,
      child: ClipOval(
        child: OverflowBox(
          alignment: Alignment.center,
          maxWidth: 1000 * scale,
          maxHeight: 500 * scale,
          child: Transform.translate(
            // Calculation: map character center to the center of the local box
            offset: Offset((500 - targetX) * scale, (250 - targetY) * scale),
            child: Lottie.asset(
              'assets/lottie/reactions.json',
              controller: _controller,
              fit: BoxFit.fill,
              delegates: LottieDelegates(
                values: [
                  ValueDelegate.opacity(['BG', '**'], value: 0),
                  ValueDelegate.opacity(['Rectangle 1532578559', '**'], value: 0),
                  ValueDelegate.opacity(['Rectangle 1532578558', '**'], value: 0),
                  ..._getHiddenLayers(widget.marker),
                ],
              ),
              onLoaded: (composition) {
                final marker = composition.markers.firstWhere(
                  (m) => m.name == widget.marker,
                  orElse: () => composition.markers.first,
                );
                _controller.duration = Duration(
                  milliseconds: (marker.durationFrames * 1000 / composition.frameRate).round(),
                );
                if (widget.repeat) {
                  _controller.repeat(min: marker.start, max: marker.end);
                } else {
                  _controller.forward(from: marker.start);
                }
              },
            ),
          ),
        ),
      ),
    );
  }

  List<ValueDelegate> _getHiddenLayers(String currentMarker) {
    final all = {'L': 'O_L', 'CL': 'O_CL', 'CA': 'O_CA', 'H': 'O_H', 'B': 'O_B', 'LA': 'O_LA'};
    return all.entries
        .where((e) => e.key != currentMarker)
        .map((e) => ValueDelegate.opacity([e.value, '**'], value: 0))
        .toList();
  }
}
