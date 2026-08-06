import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/status_chip.dart';
import 'package:animate_do/animate_do.dart';

class PetHealthTrackerScreen extends StatelessWidget {
  final String petId;

  const PetHealthTrackerScreen({super.key, required this.petId});

  @override
  Widget build(BuildContext context) {
    final pet = context.select((AppStateRepository repo) => 
      repo.pets.firstWhere((p) => p.petID == petId));
    final records = context.select((AppStateRepository repo) => 
      repo.serviceRecords.where((r) => r.petId == petId).toList());

    return GlassScaffold(
      appBar: AppBar(
        title: Text('${pet.name}\'s Health Vault'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Vital Stats Summary
            FadeInDown(
              child: PremiumCard(
                opacity: 0.3,
                borderRadius: 32,
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('HEALTH INDEX', style: AppTypography.labelSmall.copyWith(
                                fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 0.8, fontSize: 10
                              )),
                              const SizedBox(height: 4),
                              Text('${pet.healthIndex}', style: AppTypography.displayLarge.copyWith(fontSize: 48, fontWeight: FontWeight.w700)),
                            ],
                          ),
                          StatusChip.health(pet.healthIndex),
                        ],
                      ),
                      const SizedBox(height: 28),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: pet.healthIndex / 100,
                          minHeight: 14,
                          backgroundColor: Colors.white.withOpacity(0.3),
                          valueColor: AlwaysStoppedAnimation<Color>(_getHealthColor(pet.healthIndex)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('0', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.textTertiary)),
                          Text('50', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.textTertiary)),
                          Text('100', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.textTertiary)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),

            // Wellness Goals
            Text('Wellness Tracking', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.3,
              children: [
                _buildGoalCard('Weight', pet.weight, Icons.monitor_weight_rounded, AppColors.primary),
                _buildGoalCard('Daily Mood', pet.mood, Icons.sentiment_satisfied_alt_rounded, AppColors.accentAmber),
                _buildGoalCard('Activity', 'Active', Icons.directions_run_rounded, AppColors.healthGreen),
                _buildGoalCard('Sleep', '8.5 hrs', Icons.bedtime_rounded, AppColors.tertiary),
              ],
            ),
            const SizedBox(height: 48),

            // Medical History List
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Medical History', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                  child: const Icon(Icons.history_edu_rounded, color: AppColors.primary, size: 20),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (records.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(child: Text('No medical records found.')),
              )
            else
              ...records.map((rec) => FadeInUp(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: PremiumCard(
                        opacity: 0.1,
                        borderRadius: 28,
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(rec.title, style: AppTypography.titleMedium.copyWith(fontSize: 17, fontWeight: FontWeight.w700)),
                                  Text(rec.date, style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.textTertiary)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                                child: Text('${rec.serviceType} • ${rec.providerName}', 
                                  style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 10)),
                              ),
                              const Divider(height: 32),
                              Text(rec.diagnosis ?? rec.description, style: AppTypography.bodyMedium.copyWith(fontSize: 14, color: AppColors.textPrimary, height: 1.5)),
                              if (rec.suggestion != null && rec.suggestion!.isNotEmpty) ...[
                                const SizedBox(height: 16),
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppColors.healthGreen.withOpacity(0.06),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: AppColors.healthGreen.withOpacity(0.1)),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Icon(Icons.lightbulb_outline_rounded, color: AppColors.healthGreen, size: 20),
                                      const SizedBox(width: 12),
                                      Expanded(child: Text(rec.suggestion!, style: AppTypography.bodyMedium.copyWith(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.green[900], height: 1.5))),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  )),
          ],
        ),
      ),
    );
  }

  Widget _buildGoalCard(String title, String value, IconData icon, Color color) {
    return PremiumCard(
      opacity: 0.1,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 20),
            ),
            const Spacer(),
            Text(value, style: AppTypography.titleMedium.copyWith(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text(title.toUpperCase(), style: AppTypography.labelSmall.copyWith(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textTertiary, letterSpacing: 0.8)),
          ],
        ),
      ),
    );
  }

  Color _getHealthColor(int index) {
    if (index >= 85) return AppColors.healthGreen;
    if (index >= 60) return AppColors.accentAmber;
    return AppColors.dangerRed;
  }
}
