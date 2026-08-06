import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';

class AdminVerifyVetsScreen extends StatelessWidget {
  const AdminVerifyVetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final vets = state.vets;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('License & Vet Approvals'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: vets.length,
        itemBuilder: (context, index) {
          final vet = vets[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: AppColors.primaryLight,
                      backgroundImage: vet.photoUrl != null ? NetworkImage(vet.photoUrl!) : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(vet.name, style: AppTypography.titleMedium),
                          Text(vet.qualification, style: AppTypography.bodyMedium),
                          Text(vet.tag, style: AppTypography.labelSmall.copyWith(color: AppColors.primary)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: vet.isVerified ? AppColors.healthGreenLight : AppColors.accentAmber.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        vet.isVerified ? 'VERIFIED' : 'PENDING REVIEW',
                        style: TextStyle(
                          color: vet.isVerified ? AppColors.healthGreen : Colors.orange[800],
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 20),
                Text('License Credential: VET-REG-2026-${vet.id.toUpperCase()}', style: AppTypography.labelSmall),
                const SizedBox(height: 12),
                Row(
                  children: [
                    ElevatedButton.icon(
                      onPressed: () {
                        state.toggleVetVerification(vet.id);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(vet.isVerified ? 'Provider unverified' : 'License Verified and Approved! ✅')),
                        );
                      },
                      icon: Icon(vet.isVerified ? Icons.close : Icons.verified_user),
                      label: Text(vet.isVerified ? 'Revoke Approval' : 'Approve & Verify License'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: vet.isVerified ? AppColors.dangerRed : AppColors.healthGreen,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
