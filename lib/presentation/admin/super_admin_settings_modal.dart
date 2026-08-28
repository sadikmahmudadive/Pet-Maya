import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/premium_card.dart';
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

    return Container(
      constraints: BoxConstraints(
        maxHeight: size.height * 0.9,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF14181F) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 30,
            offset: const Offset(0, -10),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            const SizedBox(height: 12),
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Modal Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.settings_suggest_rounded,
                      color: AppColors.primary,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Super Admin Settings',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w800,
                                fontSize: 19,
                              ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Overlord Ecosystem Parameters & Killswitches',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: isDark ? Colors.white54 : Colors.grey.shade600,
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                        shape: BoxShape.circle,
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
            const Divider(height: 24),

            // Scrollable Content
            Flexible(
              child: ListView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                children: [
                  // SECTION 1: SYSTEM & ECOSYSTEM KILLSWITCHES
                  _buildSectionHeader(
                    context,
                    title: 'System & Ecosystem Controls',
                    icon: Icons.shield_rounded,
                    color: AppColors.primary,
                  ),
                  const SizedBox(height: 12),

                  // Maintenance Mode Switch
                  _buildSwitchTile(
                    context,
                    title: 'Maintenance Mode',
                    subtitle: 'Places the platform in maintenance lock for customers',
                    icon: Icons.construction_rounded,
                    iconColor: AppColors.dangerRed,
                    value: repo.isMaintenanceMode,
                    badgeText: repo.isMaintenanceMode ? 'ACTIVE' : null,
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
                  _buildSwitchTile(
                    context,
                    title: 'AI Diagnostic Engine',
                    subtitle: 'Vision AI symptom scanner & OpenAI Cloud proxy',
                    icon: Icons.auto_awesome_rounded,
                    iconColor: AppColors.accentAmber,
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
                  _buildSwitchTile(
                    context,
                    title: 'New Registrations',
                    subtitle: 'Allow new user onboarding & sign-ups',
                    icon: Icons.person_add_rounded,
                    iconColor: AppColors.secondary,
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
                  _buildBannerTile(context, repo, isDark),

                  const SizedBox(height: 24),

                  // SECTION 2: COMMERCE & MONETIZATION
                  _buildSectionHeader(
                    context,
                    title: 'Commerce & Platform Rates',
                    icon: Icons.payments_rounded,
                    color: AppColors.healthGreen,
                  ),
                  const SizedBox(height: 12),

                  // Base Shipping Fee Editor
                  _buildShippingFeeTile(context, repo, isDark),
                  const SizedBox(height: 10),

                  // Service Pricing & Commissions Shortcut
                  _buildActionLinkTile(
                    context,
                    title: 'Service Pricing & Commissions',
                    subtitle: 'Manage vet/groomer booking fees & revenue share',
                    icon: Icons.tune_rounded,
                    iconColor: AppColors.accentAmber,
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const AdminServicePricingScreen()),
                      );
                    },
                  ),

                  const SizedBox(height: 24),

                  // SECTION 3: DIAGNOSTICS & SYSTEM UTILITIES
                  _buildSectionHeader(
                    context,
                    title: 'Diagnostics & System Utilities',
                    icon: Icons.terminal_rounded,
                    color: AppColors.secondary,
                  ),
                  const SizedBox(height: 12),

                  // App Theme Switcher
                  _buildThemeSelector(context, repo, isDark),
                  const SizedBox(height: 10),

                  // Force Cloud Resync
                  _buildActionLinkTile(
                    context,
                    title: 'Force Cloud Data Resync',
                    subtitle: 'Fetch fresh state from Firestore & Realtime DB',
                    icon: _isResyncing ? Icons.sync_rounded : Icons.cloud_sync_rounded,
                    iconColor: AppColors.primary,
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
                  _buildActionLinkTile(
                    context,
                    title: 'Clear Local Audit Logs',
                    subtitle: 'Reset in-memory log buffer (${repo.auditLogs.length} logs)',
                    icon: Icons.cleaning_services_rounded,
                    iconColor: Colors.grey,
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
                  _buildEnvironmentCard(context, user?.email, isDark),
                ],
              ),
            ),
          ],
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
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: color,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.2,
                fontSize: 11,
              ),
        ),
      ],
    );
  }

  Widget _buildSwitchTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required bool value,
    required ValueChanged<bool> onChanged,
    String? badgeText,
    Color? badgeColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PremiumCard(
      opacity: isDark ? 0.08 : 0.04,
      borderRadius: 18,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
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
                                fontWeight: FontWeight.w700,
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
                          ),
                          child: Text(
                            badgeText,
                            style: TextStyle(
                              color: badgeColor ?? AppColors.primary,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
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
      ),
    );
  }

  Widget _buildBannerTile(
    BuildContext context,
    AppStateRepository repo,
    bool isDark,
  ) {
    final hasBanner = repo.systemBanner != null && repo.systemBanner!.isNotEmpty;

    return PremiumCard(
      opacity: isDark ? 0.08 : 0.04,
      borderRadius: 18,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
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
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                          ),
                          if (hasBanner) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'LIVE',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Displays a persistent banner across all client app screens',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: isDark ? Colors.white54 : Colors.black45,
                              fontSize: 11,
                            ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(
                    _isEditingBanner ? Icons.check_circle_rounded : Icons.edit_rounded,
                    size: 20,
                    color: AppColors.primary,
                  ),
                  onPressed: () {
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
                  hintText: 'Enter urgent announcement or leave blank to clear...',
                  hintStyle: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white24 : Colors.black26,
                  ),
                  filled: true,
                  fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                  contentPadding: const EdgeInsets.all(12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ] else if (hasBanner) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline_rounded, size: 14, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        repo.systemBanner!,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
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
                      child: const Padding(
                        padding: EdgeInsets.all(4),
                        child: Icon(Icons.delete_outline_rounded, size: 16, color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildShippingFeeTile(
    BuildContext context,
    AppStateRepository repo,
    bool isDark,
  ) {
    return PremiumCard(
      opacity: isDark ? 0.08 : 0.04,
      borderRadius: 18,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.healthGreen.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
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
                          fontWeight: FontWeight.w700,
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
            SizedBox(
              width: 80,
              height: 38,
              child: TextField(
                controller: _shippingFeeController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                decoration: InputDecoration(
                  prefixText: '৳',
                  contentPadding: EdgeInsets.zero,
                  filled: true,
                  fillColor: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
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
      ),
    );
  }

  Widget _buildActionLinkTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    VoidCallback? onTap,
    Widget? trailing,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PremiumCard(
      opacity: isDark ? 0.08 : 0.04,
      borderRadius: 18,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
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
                          fontWeight: FontWeight.w700,
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
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 14,
                  color: isDark ? Colors.white30 : Colors.black26,
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildThemeSelector(
    BuildContext context,
    AppStateRepository repo,
    bool isDark,
  ) {
    return PremiumCard(
      opacity: isDark ? 0.08 : 0.04,
      borderRadius: 18,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.secondary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.palette_rounded, color: AppColors.secondary, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'App Interface Theme',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Select clinical light, dark, or system mode',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: isDark ? Colors.white54 : Colors.black45,
                          fontSize: 11,
                        ),
                  ),
                ],
              ),
            ),
            CupertinoSlidingSegmentedControl<ThemeMode>(
              groupValue: repo.themeMode,
              children: const {
                ThemeMode.light: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Icon(Icons.light_mode_rounded, size: 16),
                ),
                ThemeMode.dark: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Icon(Icons.dark_mode_rounded, size: 16),
                ),
                ThemeMode.system: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  child: Icon(Icons.brightness_auto_rounded, size: 16),
                ),
              },
              onValueChanged: (val) {
                if (val != null) {
                  HapticFeedback.selectionClick();
                  repo.setThemeMode(val);
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEnvironmentCard(
    BuildContext context,
    String? email,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.02),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.black12,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.healthGreen,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'SYSTEM ENVIRONMENT',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.0,
                  color: Colors.grey,
                ),
              ),
              const Spacer(),
              Text(
                'v1.0.16+18',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
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
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
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
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppColors.dangerRed),
            SizedBox(width: 10),
            Text('Enable Maintenance?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          ],
        ),
        content: const Text(
          'Enabling Maintenance Mode will flag the platform as undergoing scheduled maintenance. Only administrators will have normal access.',
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
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
