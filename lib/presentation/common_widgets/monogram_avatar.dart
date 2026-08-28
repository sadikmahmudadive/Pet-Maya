import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_colors.dart';

class MonogramAvatar extends StatelessWidget {
  final String name;
  final String? photoUrl;
  final double radius;
  final TextStyle? textStyle;

  const MonogramAvatar({
    super.key,
    required this.name,
    this.photoUrl,
    this.radius = 24,
    this.textStyle,
  });

  @override
  Widget build(BuildContext context) {
    if (photoUrl != null && photoUrl!.isNotEmpty) {
      return CircleAvatar(
        radius: radius,
        backgroundColor: AppColors.primaryLight.withValues(alpha: 0.3),
        backgroundImage: photoUrl!.startsWith('http')
            ? CachedNetworkImageProvider(photoUrl!) as ImageProvider
            : AssetImage(photoUrl!) as ImageProvider,
      );
    }

    // Generate Monogram
    final initials = name.trim().split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join().toUpperCase();
    
    // Pick a stable color based on name
    final colors = [
      Colors.blue[400]!,
      Colors.purple[400]!,
      Colors.orange[400]!,
      Colors.teal[400]!,
      Colors.pink[400]!,
      Colors.indigo[400]!,
    ];
    final color = colors[name.hashCode % colors.length];

    return CircleAvatar(
      radius: radius,
      backgroundColor: color.withValues(alpha: 0.2),
      child: Text(
        initials.isNotEmpty ? initials : 'PM',
        style: textStyle ?? TextStyle(
          color: color,
          fontWeight: FontWeight.w900,
          fontSize: radius * 0.8,
        ),
      ),
    );
  }
}
