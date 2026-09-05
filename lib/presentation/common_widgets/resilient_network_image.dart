import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// A robust network image widget that gracefully handles network dropouts,
/// Samsung One UI socket terminations, and Android 13 connection aborts.
/// It uses [CachedNetworkImage] under the hood for local disk persistence
/// and safe error containment.
class ResilientNetworkImage extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;
  final Widget? errorWidget;
  final IconData fallbackIcon;
  final Color? fallbackIconColor;
  final Color? backgroundColor;

  const ResilientNetworkImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
    this.errorWidget,
    this.fallbackIcon = Icons.broken_image_rounded,
    this.fallbackIconColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBg = backgroundColor ??
        Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4);

    if (imageUrl == null || imageUrl!.trim().isEmpty) {
      return _buildFallback(effectiveBg);
    }

    Widget imageWidget = CachedNetworkImage(
      imageUrl: imageUrl!.trim(),
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) =>
          placeholder ??
          Container(
            width: width,
            height: height,
            color: effectiveBg,
            child: const Center(child: CupertinoActivityIndicator()),
          ),
      errorWidget: (context, url, error) {
        debugPrint('[ResilientNetworkImage] Caught network image error: $error (URL: $url)');
        return errorWidget ?? _buildFallback(effectiveBg);
      },
    );

    if (borderRadius != null) {
      imageWidget = ClipRRect(
        borderRadius: borderRadius!,
        child: imageWidget,
      );
    }

    return imageWidget;
  }

  Widget _buildFallback(Color bgColor) {
    final iconSize = (width != null && height != null)
        ? (width! < height! ? width! * 0.4 : height! * 0.4).clamp(16.0, 48.0)
        : 28.0;

    return Container(
      width: width,
      height: height,
      color: bgColor,
      child: Center(
        child: Icon(
          fallbackIcon,
          color: fallbackIconColor ?? Colors.grey.shade400,
          size: iconSize,
        ),
      ),
    );
  }
}

