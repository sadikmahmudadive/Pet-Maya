import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/premium_toast.dart';
import 'admin_service_pricing_screen.dart';

class SuperAdminSettingsModal extends StatefulWidget {
  const SuperAdminSettingsModal({super.key});

  static Future<void> show(BuildContext context) {
    HapticFeedback.mediumImpact();
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (_) => const SuperAdminSettingsModal(),
    );
  }

  @override
  State<SuperAdminSettingsModal> createState() => _SuperAdminSettingsModalState();
}

class _SuperAdminSettingsModalState extends State<SuperAdminSettingsModal> {
  late TextEditingController _shippingFeeController;
  late TextEditingController _bannerController;
  bool _isResyncing = false;
  bool _isEditingBanner = false;

  @override
  void initState() {
    super.initState();
    final repo = context.read<AppStateRepository>();
    _shippingFeeController = TextEditingController(
      text: repo.baseShippingFee.toStringAsFixed(2),
    );
    _bannerController = TextEditingController(
      text: repo.systemBanner ?? '',
    );
  }

  @override
  void dispose() {
    _shippingFeeController.dispose();
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<AppStateRepository>();
    final user = repo.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return RepaintBoundary(
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            constraints: BoxConstraints(
              maxHeight: size.height * 0.92,
            ),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: isDark
                    ? [
                        const Color(0xF0161B22),
                        const Color(0xE80D1117),
                        const Color(0xF510151C),
                      ]
                    : [
                        const Color(0xF8FFFFFF),
                        const Color(0xEEF4F8FA),
                        const Color(0xF5FFFFFF),
                      ],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.14)
                    : Colors.white.withValues(alpha: 0.9),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark ? Colors.black.withValues(alpha: 0.6) : AppColors.primary.withValues(alpha: 0.08),
                  blurRadius: 40,
                  spreadRadius: -4,
                  offset: const Offset(0, -12),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Specular Grabber Handle
                  const SizedBox(height: 12),
                  Center(
                    child: Container(
                      width: 48,
                      height: 5,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isDark
                              ? [Colors.white38, Colors.white12]
                              : [Colors.black26, Colors.black12],
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Header with glowing badge
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppColors.primary, AppColors.secondary],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.35),
                                blurRadius: 16,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.settings_suggest_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    'Overlord Controls',
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 19,
                                          letterSpacing: -0.3,
                                        ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: AppColors.primary.withValues(alpha: 0.3),
                                        width: 0.8,
                                      ),
                                    ),
                                    child: const Text(
                                      'SUPER ADMIN',
                                      style: TextStyle(
                                        color: AppColors.primary,
                                        fontSize: 8.5,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Live ecosystem parameters & killswitches',
                                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: isDark ? Colors.white54 : Colors.grey.shade600,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 11.5,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        InkWell(
                          onTap: () => Navigator.pop(context),
                          borderRadius: BorderRadius.circular(20),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isDark ? Colors.white12 : Colors.black12,
                                width: 0.6,
                              ),
                            ),
                            child: Icon(
                              Icons.close_rounded,
                              size: 18,
                              color: isDark ? Colors.white70 : Colors.black54,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Divider(
                    height: 1,
                    color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.06),
                  ),

                  // Scrollable Content
                  Flexible(
                    child: ListView(
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                      children: [
                        // SECTION 1: SYSTEM & ECOSYSTEM KILLSWITCHES
                        FadeInUp(
                          duration: const Duration(milliseconds: 300),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionHeader(
                                context,
                                title: 'Ecosystem Controls',
                                icon: Icons.shield_rounded,
                                color: AppColors.primary,
                              ),
                              const SizedBox(height: 12),

                              // Maintenance Mode Switch
                              _buildGlassSwitchTile(
                                context,
                                title: 'Maintenance Mode',
                                subtitle: 'Restricts platform access during upgrades',
                                icon: Icons.construction_rounded,
                                iconColor: AppColors.dangerRed,
                                glowColor: AppColors.dangerRed,
                                value: repo.isMaintenanceMode,
                                badgeText: repo.isMaintenanceMode ? 'LOCK ACTIVE' : null,
                                badgeColor: AppColors.dangerRed,
                                onChanged: (val) {
                                  if (val) {
                                    _showMaintenanceConfirmation(context, repo);
                                  } else {
                                    HapticFeedback.mediumImpact();
                                    repo.setMaintenanceMode(false);
                                    PremiumToast.show(
                                      context,
                                      'Maintenance Mode Disabled. Platform is live.',
                                      type: ToastType.success,
                                    );
                                  }
                                },
                              ),
                              const SizedBox(height: 10),

                              // AI Diagnostic Engine Switch
                              _buildGlassSwitchTile(
                                context,
                                title: 'AI Diagnostic Engine',
                                subtitle: 'Vision AI symptom scanner & OpenAI proxy',
                                icon: Icons.auto_awesome_rounded,
                                iconColor: AppColors.accentAmber,
                                glowColor: AppColors.accentAmber,
                                value: repo.isAiEnabled,
                                badgeText: repo.isAiEnabled ? 'ONLINE' : 'PAUSED',
                                badgeColor: repo.isAiEnabled ? AppColors.healthGreen : Colors.grey,
                                onChanged: (val) {
                                  HapticFeedback.lightImpact();
                                  repo.setAiEnabled(val);
                                  PremiumToast.show(
                                    context,
                                    val ? 'AI Diagnostics Online' : 'AI Diagnostics Paused',
                                    type: ToastType.info,
                                  );
                                },
                              ),
                              const SizedBox(height: 10),

                              // User Registrations Switch
                              _buildGlassSwitchTile(
                                context,
                                title: 'New Registrations',
                                subtitle: 'Allow new user onboarding & sign-ups',
                                icon: Icons.person_add_rounded,
                                iconColor: AppColors.secondary,
                                glowColor: AppColors.secondary,
                                value: repo.isRegistrationAllowed,
                                onChanged: (val) {
                                  HapticFeedback.lightImpact();
                                  repo.setRegistrationAllowed(val);
                                  PremiumToast.show(
                                    context,
                                    val ? 'New registrations enabled' : 'New registrations locked',
                                    type: ToastType.info,
                                  );
                                },
                              ),
                              const SizedBox(height: 10),

                              // Global System Banner Tile
                              _buildGlassBannerTile(context, repo, isDark),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // SECTION 2: COMMERCE & MONETIZATION
                        FadeInUp(
                          duration: const Duration(milliseconds: 350),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionHeader(
                                context,
                                title: 'Commerce & Platform Rates',
                                icon: Icons.payments_rounded,
                                color: AppColors.healthGreen,
                              ),
                              const SizedBox(height: 12),

                              // Base Shipping Fee Editor
                              _buildGlassShippingFeeTile(context, repo, isDark),
                              const SizedBox(height: 10),

                              // Service Pricing & Commissions Shortcut
                              _buildGlassActionTile(
                                context,
                                title: 'Service Pricing & Commissions',
                                subtitle: 'Configure provider rates & booking fees',
                                icon: Icons.tune_rounded,
                                iconColor: AppColors.accentAmber,
                                glowColor: AppColors.accentAmber,
                                onTap: () {
                                  Navigator.pop(context);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const AdminServicePricingScreen()),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // SECTION 3: DIAGNOSTICS & SYSTEM UTILITIES
                        FadeInUp(
                          duration: const Duration(milliseconds: 400),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildSectionHeader(
                                context,
                                title: 'Diagnostics & System Utilities',
                                icon: Icons.terminal_rounded,
                                color: AppColors.secondary,
                              ),
                              const SizedBox(height: 12),

                              // App Theme Switcher
                              _buildGlassThemeSelector(context, repo, isDark),
                              const SizedBox(height: 10),

                              // Force Cloud Resync
                              _buildGlassActionTile(
                                context,
                                title: 'Force Cloud Data Resync',
                                subtitle: 'Fetch fresh state from Firestore & Realtime DB',
                                icon: _isResyncing ? Icons.sync_rounded : Icons.cloud_sync_rounded,
                                iconColor: AppColors.primary,
                                glowColor: AppColors.primary,
                                trailing: _isResyncing
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                      )
                                    : const Icon(Icons.refresh_rounded, size: 20, color: AppColors.primary),
                                onTap: _isResyncing
                                    ? null
                                    : () async {
                                        setState(() => _isResyncing = true);
                                        HapticFeedback.mediumImpact();
                                        try {
                                          if (user != null) {
                                            await repo.syncFromFirebase(user);
                                          }
                                          if (context.mounted) {
                                            PremiumToast.show(
                                              context,
                                              'Ecosystem state synced successfully! ⚡',
                                              type: ToastType.success,
                                            );
                                          }
                                        } catch (e) {
                                          if (context.mounted) {
                                            PremiumToast.show(
                                              context,
                                              'Sync error: $e',
                                              type: ToastType.error,
                                            );
                                          }
                                        } finally {
                                          if (mounted) setState(() => _isResyncing = false);
                                        }
                                      },
                              ),
                              const SizedBox(height: 10),

                              // Clear Local Audit Logs
                              _buildGlassActionTile(
                                context,
                                title: 'Clear Local Audit Logs',
                                subtitle: 'Reset in-memory buffer (${repo.auditLogs.length} logs recorded)',
                                icon: Icons.cleaning_services_rounded,
                                iconColor: Colors.grey,
                                glowColor: Colors.grey,
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  repo.clearAuditLogs();
                                  PremiumToast.show(
                                    context,
                                    'Audit log buffer cleared.',
                                    type: ToastType.info,
                                  );
                                },
                              ),
                              const SizedBox(height: 16),

                              // Environment Info Badge
                              _buildGlassEnvironmentCard(context, user?.email, isDark),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(icon, size: 13, color: color),
        ),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
            fontSize: 11,
          ),
        ),
      ],
    );
  }

  Widget _buildGlassContainer({
    required Widget child,
    required bool isDark,
    double borderRadius = 20,
    EdgeInsetsGeometry padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    Color? glowColor,
    VoidCallback? onTap,
  }) {
    final baseDecoration = BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: isDark
            ? [
                Colors.white.withValues(alpha: 0.08),
                Colors.white.withValues(alpha: 0.03),
              ]
            : [
                Colors.white.withValues(alpha: 0.85),
                Colors.white.withValues(alpha: 0.55),
              ],
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: isDark
            ? (glowColor?.withValues(alpha: 0.3) ?? Colors.white.withValues(alpha: 0.1))
            : (glowColor?.withValues(alpha: 0.25) ?? Colors.white),
        width: 1.0,
      ),
      boxShadow: [
        BoxShadow(
          color: glowColor != null
              ? glowColor.withValues(alpha: isDark ? 0.12 : 0.06)
              : (isDark ? Colors.black.withValues(alpha: 0.2) : Colors.black.withValues(alpha: 0.03)),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ],
    );

    if (onTap == null) {
      return Container(
        padding: padding,
        decoration: baseDecoration,
        child: child,
      );
    }

    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(borderRadius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: Container(
          padding: padding,
          decoration: baseDecoration,
          child: child,
        ),
      ),
    );
  }

  Widget _buildGlassSwitchTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color glowColor,
    required bool value,
    required ValueChanged<bool> onChanged,
    String? badgeText,
    Color? badgeColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _buildGlassContainer(
      isDark: isDark,
      glowColor: value ? glowColor : null,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  iconColor.withValues(alpha: isDark ? 0.25 : 0.15),
                  iconColor.withValues(alpha: isDark ? 0.1 : 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: iconColor.withValues(alpha: 0.3),
                width: 0.8,
              ),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                            ),
                      ),
                    ),
                    if (badgeText != null) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: (badgeColor ?? AppColors.primary).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: (badgeColor ?? AppColors.primary).withValues(alpha: 0.35),
                            width: 0.6,
                          ),
                        ),
                        child: Text(
                          badgeText,
                          style: TextStyle(
                            color: badgeColor ?? AppColors.primary,
                            fontSize: 8.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark ? Colors.white54 : Colors.black45,
                        fontSize: 11,
                      ),
                ),
              ],
            ),
          ),
          Transform.scale(
            scale: 0.85,
            child: CupertinoSwitch(
              value: value,
              activeTrackColor: AppColors.primary,
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassBannerTile(
    BuildContext context,
    AppStateRepository repo,
    bool isDark,
  ) {
    final hasBanner = repo.systemBanner != null && repo.systemBanner!.isNotEmpty;

    return _buildGlassContainer(
      isDark: isDark,
      glowColor: hasBanner ? AppColors.primary : null,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primary.withValues(alpha: 0.25),
                      AppColors.primary.withValues(alpha: 0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    width: 0.8,
                  ),
                ),
                child: const Icon(
                  Icons.campaign_rounded,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Global Broadcast Banner',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                              ),
                        ),
                        if (hasBanner) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: AppColors.primary.withValues(alpha: 0.4),
                                width: 0.6,
                              ),
                            ),
                            child: const Text(
                              'LIVE',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 8.5,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Displays real-time ticker across all customer apps',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: isDark ? Colors.white54 : Colors.black45,
                            fontSize: 11,
                          ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: () {
                  if (_isEditingBanner) {
                    HapticFeedback.mediumImpact();
                    final text = _bannerController.text.trim();
                    repo.setSystemBanner(text.isEmpty ? null : text);
                    setState(() => _isEditingBanner = false);
                    PremiumToast.show(
                      context,
                      text.isEmpty ? 'Banner cleared' : 'Banner updated live',
                      type: ToastType.success,
                    );
                  } else {
                    setState(() => _isEditingBanner = true);
                  }
                },
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      width: 0.6,
                    ),
                  ),
                  child: Icon(
                    _isEditingBanner ? Icons.check_rounded : Icons.edit_rounded,
                    size: 18,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          if (_isEditingBanner) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _bannerController,
              maxLines: 2,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                hintText: 'Enter announcement text or leave blank to clear...',
                hintStyle: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white24 : Colors.black26,
                ),
                filled: true,
                fillColor: isDark ? Colors.black.withValues(alpha: 0.25) : Colors.white.withValues(alpha: 0.7),
                contentPadding: const EdgeInsets.all(12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: isDark ? Colors.white12 : Colors.black12,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary, width: 1.2),
                ),
              ),
            ),
          ] else if (hasBanner) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.primary.withValues(alpha: 0.12),
                    AppColors.primary.withValues(alpha: 0.04),
                  ],
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  width: 0.8,
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, size: 15, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      repo.systemBanner!,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      repo.setSystemBanner(null);
                      _bannerController.clear();
                      PremiumToast.show(
                        context,
                        'Banner cleared',
                        type: ToastType.info,
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        Icons.delete_outline_rounded,
                        size: 16,
                        color: isDark ? Colors.white60 : Colors.black54,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildGlassShippingFeeTile(
    BuildContext context,
    AppStateRepository repo,
    bool isDark,
  ) {
    return _buildGlassContainer(
      isDark: isDark,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.healthGreen.withValues(alpha: isDark ? 0.25 : 0.15),
                  AppColors.healthGreen.withValues(alpha: isDark ? 0.1 : 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.healthGreen.withValues(alpha: 0.3),
                width: 0.8,
              ),
            ),
            child: const Icon(Icons.local_shipping_rounded, color: AppColors.healthGreen, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Default Shipping Fee',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Base delivery charge for store orders',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark ? Colors.white54 : Colors.black45,
                        fontSize: 11,
                      ),
                ),
              ],
            ),
          ),
          Container(
            width: 86,
            height: 40,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.white12 : Colors.black12,
                width: 0.8,
              ),
            ),
            child: TextField(
              controller: _shippingFeeController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13),
              decoration: InputDecoration(
                prefixText: '৳',
                prefixStyle: TextStyle(
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
                contentPadding: EdgeInsets.zero,
                filled: true,
                fillColor: isDark ? Colors.black.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.7),
                border: InputBorder.none,
              ),
              onSubmitted: (val) {
                final fee = double.tryParse(val);
                if (fee != null && fee >= 0) {
                  HapticFeedback.lightImpact();
                  repo.setBaseShippingFee(fee);
                  PremiumToast.show(
                    context,
                    'Shipping rate updated to ৳${fee.toStringAsFixed(2)}',
                    type: ToastType.success,
                  );
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassActionTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color glowColor,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _buildGlassContainer(
      isDark: isDark,
      glowColor: glowColor,
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  iconColor.withValues(alpha: isDark ? 0.25 : 0.15),
                  iconColor.withValues(alpha: isDark ? 0.1 : 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: iconColor.withValues(alpha: 0.3),
                width: 0.8,
              ),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark ? Colors.white54 : Colors.black45,
                        fontSize: 11,
                      ),
                ),
              ],
            ),
          ),
          trailing ??
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 13,
                  color: isDark ? Colors.white38 : Colors.black38,
                ),
              ),
        ],
      ),
    );
  }

  Widget _buildGlassThemeSelector(
    BuildContext context,
    AppStateRepository repo,
    bool isDark,
  ) {
    return _buildGlassContainer(
      isDark: isDark,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.secondary.withValues(alpha: isDark ? 0.25 : 0.15),
                  AppColors.secondary.withValues(alpha: isDark ? 0.1 : 0.05),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.secondary.withValues(alpha: 0.3),
                width: 0.8,
              ),
            ),
            child: const Icon(Icons.palette_rounded, color: AppColors.secondary, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Interface Theme',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Light, dark, or system mode',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: isDark ? Colors.white54 : Colors.black45,
                        fontSize: 11,
                      ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(2),
            decoration: BoxDecoration(
              color: isDark ? Colors.black.withValues(alpha: 0.35) : Colors.black.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDark ? Colors.white10 : Colors.black12,
                width: 0.6,
              ),
            ),
            child: CupertinoSlidingSegmentedControl<ThemeMode>(
              groupValue: repo.themeMode,
              backgroundColor: Colors.transparent,
              thumbColor: isDark ? const Color(0xFF2C323D) : Colors.white,
              children: const {
                ThemeMode.light: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  child: Icon(Icons.light_mode_rounded, size: 15, color: AppColors.accentAmber),
                ),
                ThemeMode.dark: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  child: Icon(Icons.dark_mode_rounded, size: 15, color: AppColors.secondary),
                ),
                ThemeMode.system: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                  child: Icon(Icons.brightness_auto_rounded, size: 15, color: AppColors.primary),
                ),
              },
              onValueChanged: (val) {
                if (val != null) {
                  HapticFeedback.selectionClick();
                  repo.setThemeMode(val);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlassEnvironmentCard(
    BuildContext context,
    String? email,
    bool isDark,
  ) {
    return _buildGlassContainer(
      isDark: isDark,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.healthGreen,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.healthGreen.withValues(alpha: 0.6),
                      blurRadius: 8,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'SYSTEM ENVIRONMENT',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                  color: Colors.grey,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'v1.0.16+18',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Cloud Engine',
                style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
              ),
              Text(
                'Firebase (us-central1)',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 5),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Active Session',
                style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
              ),
              Text(
                email ?? 'Super Admin',
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showMaintenanceConfirmation(BuildContext context, AppStateRepository repo) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed),
            SizedBox(width: 10),
            Text('Enable Maintenance?', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
          ],
        ),
        content: const Text(
          'Enabling Maintenance Mode will flag the platform as undergoing scheduled maintenance. Non-administrator users will see a maintenance screen.',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CANCEL', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.dangerRed,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            ),
            onPressed: () {
              HapticFeedback.heavyImpact();
              repo.setMaintenanceMode(true);
              Navigator.pop(ctx);
              PremiumToast.show(
                context,
                'Maintenance Mode Activated 🚨',
                type: ToastType.warning,
              );
            },
            child: const Text('ENABLE LOCK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
