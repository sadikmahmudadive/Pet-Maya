import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class AdminAnalyticsScreen extends StatelessWidget {
  const AdminAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final petsCount = context.select((AppStateRepository repo) => repo.pets.length);
    final usersCount = context.select((AppStateRepository repo) => repo.allUsers.length);
    final ordersCount = context.select((AppStateRepository repo) => repo.orders.length);
    final vetsCount = context.select((AppStateRepository repo) => repo.vets.length);

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Ecosystem Analytics'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeInUp(
              child: Text('Growth Metrics', style: AppTypography.headlineMedium),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _buildMetricCard('Total Users', '$usersCount', Icons.people_rounded, AppColors.primary)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard('Registered Pets', '$petsCount', Icons.pets_rounded, AppColors.healthGreen)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildMetricCard('Providers', '$vetsCount', Icons.medical_services_rounded, AppColors.accentAmber)),
                const SizedBox(width: 12),
                Expanded(child: _buildMetricCard('Sales Volume', '$ordersCount', Icons.shopping_bag_rounded, AppColors.tertiary)),
              ],
            ),
            const SizedBox(height: 32),
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Text('Platform Engagement', style: AppTypography.headlineMedium),
            ),
            const SizedBox(height: 16),
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: PremiumCard(
                opacity: 0.2,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      _buildStatBar('Daily Active Users', 0.85, AppColors.primary),
                      const SizedBox(height: 16),
                      _buildStatBar('New Pet Profiles', 0.62, AppColors.healthGreen),
                      const SizedBox(height: 16),
                      _buildStatBar('Clinic Booking Rate', 0.45, AppColors.accentAmber),
                      const SizedBox(height: 16),
                      _buildStatBar('Shop Conversion', 0.28, AppColors.dangerRed),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return PremiumCard(
      opacity: 0.3,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 16),
            Text(value, style: AppTypography.displayLarge.copyWith(fontSize: 28)),
            Text(title, style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatBar(String label, double progress, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: AppTypography.titleMedium.copyWith(fontSize: 14)),
            Text('${(progress * 100).toInt()}%', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}
