import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class AdminLogsScreen extends StatelessWidget {
  const AdminLogsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final logs = context.select((AppStateRepository repo) => repo.auditLogs);

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('System Audit Logs'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: logs.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history_rounded, size: 64, color: AppColors.textTertiary.withOpacity(0.3)),
                  const SizedBox(height: 16),
                  Text('No system logs recorded yet.', style: AppTypography.bodyMedium),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 20),
              itemCount: logs.length,
              itemBuilder: (context, index) {
                final log = logs[index];
                // Simple parsing for display: [12:34:56] Action: Details
                final time = log.substring(1, 9);
                final content = log.substring(11);
                final parts = content.split(': ');
                final title = parts[0];
                final desc = parts.length > 1 ? parts[1] : '';

                return FadeInLeft(
                  delay: Duration(milliseconds: 30 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: PremiumCard(
                      opacity: 0.2,
                      borderRadius: 16,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 6,
                              height: 40,
                              decoration: BoxDecoration(
                                color: _getLogColor(title),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(title, style: AppTypography.titleMedium.copyWith(fontSize: 14, fontWeight: FontWeight.bold)),
                                      Text(time, style: AppTypography.labelSmall.copyWith(fontSize: 10)),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(desc, style: AppTypography.bodyMedium.copyWith(fontSize: 12)),
                                ],
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

  Color _getLogColor(String action) {
    if (action.contains('Login')) return AppColors.healthGreen;
    if (action.contains('Logout')) return AppColors.accentAmber;
    if (action.contains('Delete')) return AppColors.dangerRed;
    if (action.contains('Add')) return AppColors.primary;
    return AppColors.tertiary;
  }
}
