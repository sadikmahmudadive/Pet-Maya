import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';

class AdminLogsScreen extends StatelessWidget {
  const AdminLogsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final logs = context.select((AppStateRepository repo) => repo.auditLogs);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('System Audit', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: logs.isEmpty
          ? const EmptyState(
              icon: Icons.history_rounded,
              title: 'No logs recorded',
              message: 'System audit trails will appear here as users interact with the app.',
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
              itemCount: logs.length,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context, index) {
                final log = logs[index];
                final time = log.length >= 9 ? log.substring(1, 9) : '--:--';
                final content = log.length >= 11 ? log.substring(11) : log;
                final parts = content.split(': ');
                final title = parts[0];
                final desc = parts.length > 1 ? parts[1] : '';

                return FadeInLeft(
                  delay: Duration(milliseconds: 30 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: PremiumCard(
                      opacity: 0.15,
                      borderRadius: 20,
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 4,
                              height: 44,
                              decoration: BoxDecoration(
                                color: _getLogColor(title),
                                borderRadius: BorderRadius.circular(10),
                                boxShadow: [BoxShadow(color: _getLogColor(title).withValues(alpha: 0.3), blurRadius: 8)],
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
                                      Text(title.toUpperCase(), 
                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: _getLogColor(title), letterSpacing: 0.5)),
                                      Text(time, style: AppTypography.labelSmall.copyWith(fontSize: 9, color: Colors.grey[500], fontWeight: FontWeight.w700)),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  Text(desc, 
                                    style: AppTypography.bodyMedium.copyWith(
                                      fontSize: 13, 
                                      fontWeight: FontWeight.w600,
                                      color: isDark ? Colors.white70 : Colors.black87,
                                    )),
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
    if (action.contains('Add') || action.contains('Create')) return AppColors.primary;
    if (action.contains('Sync')) return Colors.blue;
    return AppColors.tertiary;
  }
}
