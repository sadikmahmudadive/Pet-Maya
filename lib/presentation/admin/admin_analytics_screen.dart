import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';

class AdminAnalyticsScreen extends StatelessWidget {
  const AdminAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final petsCount = context.select((AppStateRepository repo) => repo.pets.length);
    final usersCount = context.select((AppStateRepository repo) => repo.allUsers.length);
    final ordersCount = context.select((AppStateRepository repo) => repo.orders.length);
    final vetsCount = context.select((AppStateRepository repo) => repo.vets.length);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Insights Console', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeInDown(
              child: Text('Growth Metrics', style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: _buildMetricCard(context, 'Total Users', '$usersCount', Icons.people_rounded, AppColors.primary)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard(context, 'Active Pets', '$petsCount', Icons.pets_rounded, AppColors.healthGreen)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildMetricCard(context, 'Providers', '$vetsCount', Icons.medical_services_rounded, AppColors.accentAmber)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard(context, 'Sales', '$ordersCount', Icons.shopping_bag_rounded, AppColors.tertiary)),
              ],
            ),
            const SizedBox(height: 48),
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Text('Platform Engagement', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 20),
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: PremiumCard(
                opacity: 0.15,
                borderRadius: 28,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      _buildStatBar(context, 'Daily Active Users', 0.85, AppColors.primary),
                      const SizedBox(height: 24),
                      _buildStatBar(context, 'New Pet Onboarding', 0.62, AppColors.healthGreen),
                      const SizedBox(height: 24),
                      _buildStatBar(context, 'Clinic Booking Rate', 0.45, AppColors.accentAmber),
                      const SizedBox(height: 24),
                      _buildStatBar(context, 'Shop Conversion', 0.28, AppColors.dangerRed),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(BuildContext context, String title, String value, IconData icon, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return PremiumCard(
      opacity: 0.2,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 20),
            Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: isDark ? Colors.white : Colors.black87)),
            const SizedBox(height: 4),
            Text(title.toUpperCase(), 
              style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: isDark ? Colors.white38 : Colors.grey[600], letterSpacing: 1)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBar(BuildContext context, String label, double progress, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black87)),
            Text('${(progress * 100).toInt()}%', style: TextStyle(fontWeight: FontWeight.w900, color: color, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 10,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
