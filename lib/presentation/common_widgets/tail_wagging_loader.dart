import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';
import 'package:animate_do/animate_do.dart';

class TailWaggingLoader extends StatelessWidget {
  final double size;
  final bool useBottomPosition;
  final bool isGlobal;

  const TailWaggingLoader({
    super.key,
    this.size = 280, // More balanced premium size
    this.useBottomPosition = false,
    this.isGlobal = false,
  });

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    Widget loader = SizedBox(
      width: size,
      height: size,
      child: Lottie.asset(
        'assets/lottie/cat_wagging.json',
        fit: BoxFit.contain,
        repeat: true,
        errorBuilder: (context, error, stackTrace) {
          return const Icon(Icons.pets_rounded, size: 60, color: Colors.grey);
        },
      ),
    );

    if (!useBottomPosition && !isGlobal) {
      return Center(child: loader);
    }

    // Advanced "Pop & Zoom" Motion
    Widget content = Stack(
      alignment: Alignment.center,
      clipBehavior: Clip.none,
      children: [
        Positioned(
          top: screenHeight * 0.52, // Balanced anchor
          left: 0,
          right: 0,
          child: ElasticInUp( // Premium bouncy entrance
            duration: const Duration(milliseconds: 1500),
            from: 350, 
            child: ZoomIn( // Depth effect
              duration: const Duration(milliseconds: 800),
              child: Center(child: loader),
            ),
          ),
        ),
      ],
    );

    if (isGlobal) {
      return TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.0, end: 1.0),
        duration: const Duration(milliseconds: 600),
        builder: (context, value, child) {
          return BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 8 * value, sigmaY: 8 * value),
            child: Material(
              color: Colors.black.withValues(alpha: 0.2 * value),
              child: content,
            ),
          );
        },
      );
    }

    return content;
  }
}
