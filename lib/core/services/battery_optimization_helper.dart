import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';

/// Helper utility to request battery optimization exemptions (Doze Mode Whitelist)
/// and guide users through OEM-specific Autostart / Background settings (Xiaomi, Samsung, Oppo, Vivo, Huawei).
class BatteryOptimizationHelper {
  /// Request Android Doze Mode Battery Optimization Exemption
  static Future<bool> requestBatteryOptimizationExemption(BuildContext context) async {
    try {
      final status = await Permission.ignoreBatteryOptimizations.status;
      if (status.isGranted) {
        return true;
      }
      final result = await Permission.ignoreBatteryOptimizations.request();
      return result.isGranted;
    } catch (e) {
      debugPrint('[BatteryOptimizationHelper] Error requesting exemption: $e');
      return false;
    }
  }

  /// Open DontKillMyApp.com or OEM-specific autostart settings guide
  static Future<void> openOemSettingsGuide() async {
    final url = Uri.parse('https://dontkillmyapp.com');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('[BatteryOptimizationHelper] Could not launch guide: $e');
    }
  }

  /// Displays an interactive onboarding sheet guiding users to enable background notifications
  static void showOptimizationGuideModal(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: EdgeInsets.fromLTRB(
            24,
            20,
            24,
            MediaQuery.of(ctx).viewInsets.bottom + 28,
          ),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Title
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.bolt_rounded, color: AppColors.primary, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Unrestricted Background Alerts',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              Text(
                'To guarantee you never miss critical vaccination alerts, medication times, or emergency vet messages during Android Doze mode:',
                style: TextStyle(
                  fontSize: 12.5,
                  height: 1.4,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              ),

              const SizedBox(height: 18),

              // Step 1: Whitelist
              _buildStepRow(
                step: '1',
                title: 'Allow Unrestricted Battery Usage',
                subtitle: 'Prevents Android Doze mode from putting Pet Maya alerts to sleep.',
                isDark: isDark,
              ),

              const SizedBox(height: 12),

              // Step 2: OEM Autostart
              _buildStepRow(
                step: '2',
                title: 'Enable Autostart (Xiaomi, Oppo, Vivo, Samsung)',
                subtitle: 'Allows background message handlers to wake up when notifications arrive.',
                isDark: isDark,
              ),

              const SizedBox(height: 24),

              // Buttons
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    HapticFeedback.heavyImpact();
                    final granted = await requestBatteryOptimizationExemption(ctx);
                    if (ctx.mounted) {
                      ScaffoldMessenger.of(ctx).showSnackBar(
                        SnackBar(
                          content: Text(
                            granted
                                ? 'Battery Optimization Exemption Granted! ⚡'
                                : 'Check Android Settings -> Apps -> Pet Maya -> Battery -> Unrestricted',
                          ),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.offline_bolt_rounded, color: Colors.white, size: 20),
                  label: const Text(
                    'ALLOW UNRESTRICTED BACKGROUND RUN',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),

              const SizedBox(height: 10),

              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    openOemSettingsGuide();
                  },
                  icon: const Icon(Icons.open_in_new_rounded, size: 16, color: AppColors.primary),
                  label: const Text(
                    'View Manufacturer Device Settings Guide (DontKillMyApp.com)',
                    style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  static Widget _buildStepRow({
    required String step,
    required String title,
    required String subtitle,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.grey[100],
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 12,
            backgroundColor: AppColors.primary.withValues(alpha: 0.2),
            child: Text(
              step,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primary),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    height: 1.3,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
