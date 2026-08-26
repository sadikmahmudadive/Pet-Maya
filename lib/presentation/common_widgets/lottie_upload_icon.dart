import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

/// Reusable Lottie Upload Icon widget powered by `assets/lottie/upload_icon.json`
class LottieUploadIcon extends StatelessWidget {
  final double size;
  final bool animate;
  final bool repeat;
  final Color? color;

  const LottieUploadIcon({
    super.key,
    this.size = 48.0,
    this.animate = true,
    this.repeat = true,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Lottie.asset(
        'assets/lottie/upload_icon.json',
        animate: animate,
        repeat: repeat,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) {
          return Icon(
            Icons.cloud_upload_rounded,
            size: size * 0.7,
            color: color ?? Theme.of(context).colorScheme.primary,
          );
        },
      ),
    );
  }
}
