import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';

class AdminVerifyVetsScreen extends StatelessWidget {
  const AdminVerifyVetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final vets = state.vets;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('License Approvals', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
        itemCount: vets.length,
        physics: const BouncingScrollPhysics(),
        itemBuilder: (context, index) {
          final vet = vets[index];
          return FadeInUp(
            delay: Duration(milliseconds: 50 * index),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: PremiumCard(
                opacity: 0.25,
                borderRadius: 28,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                            child: CircleAvatar(
                              radius: 28,
                              backgroundColor: AppColors.primaryLight,
                              backgroundImage: vet.photoUrl != null ? NetworkImage(vet.photoUrl!) : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(vet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800)),
                                Text(vet.tag.toUpperCase(), style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 9)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: (vet.isVerified ? AppColors.healthGreen : AppColors.accentAmber).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              vet.isVerified ? 'VERIFIED' : 'PENDING',
                              style: TextStyle(
                                color: vet.isVerified ? AppColors.healthGreen : AppColors.accentAmber,
                                fontWeight: FontWeight.w900,
                                fontSize: 8,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text('CREDENTIALS', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w800, color: Colors.grey[500])),
                      const SizedBox(height: 6),
                      Text('VET-REG-2026-${vet.id.substring(0, 8).toUpperCase()}', 
                        style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700, fontFamily: 'monospace')),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: () {
                            HapticFeedback.mediumImpact();
                            state.toggleVetVerification(vet.id);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(vet.isVerified ? 'Provider unverified' : 'License Verified and Approved! ✅'),
                                backgroundColor: vet.isVerified ? AppColors.dangerRed : AppColors.healthGreen,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: vet.isVerified ? const Color(0xFFFF0055).withOpacity(0.1) : AppColors.healthGreen,
                            foregroundColor: vet.isVerified ? const Color(0xFFFF0055) : Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: Text(
                            vet.isVerified ? 'REVOKE APPROVAL' : 'APPROVE LICENSE',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.8),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
