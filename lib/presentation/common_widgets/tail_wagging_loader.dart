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

    // Optimization: Simplified stack for performance
    Widget content = Center(
      child: loader,
    );

    if (isGlobal) {
      return Material(
        color: Colors.black.withValues(alpha: 0.2),
        child: content,
      );
    }

    return content;
  }
}
