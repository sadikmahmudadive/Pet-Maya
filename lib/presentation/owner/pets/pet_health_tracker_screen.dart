import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/bento_card.dart';
import '../../common_widgets/status_chip.dart';
import '../../common_widgets/empty_state.dart';
import 'vaccination_screen.dart';

class PetHealthTrackerScreen extends StatelessWidget {
  final String petId;

  const PetHealthTrackerScreen({super.key, required this.petId});

  @override
  Widget build(BuildContext context) {
    final pet = context.select(
      (AppStateRepository repo) =>
          repo.pets.firstWhere((p) => p.petID == petId),
    );
    final records = context.select(
      (AppStateRepository repo) =>
          repo.serviceRecords.where((r) => r.petId == petId).toList(),
    );
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          '${pet.name}\'s Health Vault',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Vitality Index Bento Card
            FadeInDown(
              child: BentoCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'VITALITY & CLINICAL INDEX',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w800,
                                color: const Color(0xFF1AB680),
                                letterSpacing: 1.2,
                                fontSize: 10,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  '${pet.healthIndex}',
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 48,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '/ 100',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[500],
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        StatusChip.health(pet.healthIndex),
                      ],
                    ),
                    const SizedBox(height: 20),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: pet.healthIndex / 100,
                        minHeight: 10,
                        backgroundColor: isDark
                            ? Colors.white10
                            : Colors.black.withValues(alpha: 0.06),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _getHealthColor(pet.healthIndex),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildLegend('ATTENTION', Colors.grey[500]!),
                        _buildLegend('OPTIMAL HEALTH', AppColors.healthGreen),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // 1b. Bento Quick Action: Vaccination Hub
            FadeInDown(
              delay: const Duration(milliseconds: 100),
              child: BentoCard(
                borderRadius: 22,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => VaccinationScreen(initialPet: pet),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00BFA5).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.vaccines_rounded,
                        color: Color(0xFF00BFA5),
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Vaccination & Booster Hub',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            '92% Compliance • Core Vaccines & Deworming',
                            style: TextStyle(fontSize: 11, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                    const Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 14,
                      color: Colors.grey,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // 2. Wellness Metrics Bento Grid
            _buildSectionHeader('Biometric Tracking'),
            const SizedBox(height: 16),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 14,
              crossAxisSpacing: 14,
              childAspectRatio: 1.25,
              children: [
                _buildGoalCard(
                  'Weight',
                  pet.weight,
                  Icons.monitor_weight_rounded,
                  AppColors.primary,
                ),
                _buildGoalCard(
                  'Mood',
                  pet.mood,
                  Icons.sentiment_satisfied_alt_rounded,
                  AppColors.accentAmber,
                ),
                _buildGoalCard(
                  'Activity',
                  'Optimal',
                  Icons.directions_run_rounded,
                  AppColors.healthGreen,
                ),
                _buildGoalCard(
                  'Hydration',
                  'Tracked',
                  Icons.water_drop_rounded,
                  AppColors.tertiary,
                ),
              ],
            ),
            const SizedBox(height: 32),

            // 3. Clinical Logs
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionHeader('Clinical History'),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.history_edu_rounded,
                    color: AppColors.primary,
                    size: 20,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (records.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: EmptyState(
                  icon: Icons.history_edu_rounded,
                  title: 'No medical logs',
                  message:
                      'When your vet adds a record, it will appear here in your secure vault.',
                ),
              )
            else
              ...records.map(
                (rec) => FadeInUp(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: PremiumCard(
                      opacity: 0.15,
                      borderRadius: 28,
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  rec.title,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                                Text(
                                  rec.date,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    color: Colors.grey[500],
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary.withValues(
                                      alpha: 0.1,
                                    ),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    rec.serviceType.toUpperCase(),
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 8,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'by ${rec.providerName}',
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w700,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 20),
                              child: Divider(height: 1),
                            ),
                            Text(
                              rec.diagnosis ?? rec.description,
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? Colors.white70 : Colors.black87,
                                height: 1.5,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (rec.suggestion != null &&
                                rec.suggestion!.isNotEmpty) ...[
                              const SizedBox(height: 20),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: AppColors.healthGreen.withValues(
                                    alpha: 0.08,
                                  ),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: AppColors.healthGreen.withValues(
                                      alpha: 0.1,
                                    ),
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(
                                      Icons.lightbulb_outline_rounded,
                                      color: AppColors.healthGreen,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        rec.suggestion!,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w700,
                                          color: isDark
                                              ? AppColors.healthGreenLight
                                              : Colors.green[900],
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w800,
        fontSize: 20,
        letterSpacing: -0.4,
      ),
    );
  }

  Widget _buildLegend(String label, Color color) {
    return Text(
      label,
      style: TextStyle(
        fontWeight: FontWeight.w800,
        color: color,
        fontSize: 9,
        letterSpacing: 0.8,
      ),
    );
  }

  Widget _buildGoalCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return BentoCard(
      borderRadius: 20,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const Spacer(),
          Text(
            value.isEmpty ? 'N/A' : value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              color: Colors.grey[500],
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Color _getHealthColor(int index) {
    if (index >= 85) return AppColors.healthGreen;
    if (index >= 60) return AppColors.accentAmber;
    return AppColors.dangerRed;
  }
}
