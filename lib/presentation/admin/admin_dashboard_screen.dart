import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../auth/login_screen.dart';
import 'admin_verify_vets_screen.dart';
import 'admin_broadcast_screen.dart';
import 'admin_user_list_screen.dart';
import 'admin_logs_screen.dart';
import 'admin_analytics_screen.dart';
import 'admin_shop_manager_screen.dart';
import 'admin_order_manager_screen.dart';
import 'admin_pet_directory_screen.dart';
import 'admin_service_manager_screen.dart';
import 'admin_service_pricing_screen.dart';
import 'admin_blog_manager_screen.dart';
import 'package:animate_do/animate_do.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.select((AppStateRepository repo) => repo.currentUser);
    final isSuper = user?.role == UserRole.superAdmin;

    final vets = context.select((AppStateRepository repo) => repo.vets);
    final usersCount = context.select(
      (AppStateRepository repo) => repo.allUsers.length,
    );
    final ordersCount = context.select(
      (AppStateRepository repo) => repo.orders.length,
    );
    final logs = context.select((AppStateRepository repo) => repo.auditLogs);
    final state = context.read<AppStateRepository>();

    final unverifiedVetsCount = vets.where((v) => !v.isVerified).length;
    final size = MediaQuery.of(context).size;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(isSuper ? 'Overlord Console' : 'Master Console'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (isSuper)
            IconButton(
              icon: const Icon(
                Icons.settings_suggest_rounded,
                color: AppColors.primary,
              ),
              onPressed: () {},
            ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.dangerRed),
            onPressed: () {
              state.logout();
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (r) => false,
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              if (user != null) await state.syncFromFirebase(user);
            },
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, size.height * 0.1, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Welcome Header
                  FadeInDown(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Hi, ${user?.name ?? 'Admin'}',
                          style: Theme.of(context).textTheme.displayLarge
                              ?.copyWith(
                                fontSize: 26,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Ecosystem performance is stable',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Ecosystem Analytics
                  Row(
                    children: [
                      Expanded(
                        child: FadeInLeft(
                          child: _buildKpiCard(
                            context,
                            'USERS',
                            '$usersCount',
                            Icons.people_rounded,
                            AppColors.primary,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const AdminUserListScreen(),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: FadeInDown(
                          child: _buildKpiCard(
                            context,
                            'SALES',
                            '$ordersCount',
                            Icons.shopping_bag_rounded,
                            AppColors.tertiary,
                            () => _navigateToOrderManager(context),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: FadeInRight(
                          child: _buildKpiCard(
                            context,
                            'VERIFY',
                            '$unverifiedVetsCount',
                            Icons.verified_user_rounded,
                            AppColors.accentAmber,
                            () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const AdminVerifyVetsScreen(),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick Access Grid
                  FadeInUp(
                    delay: const Duration(milliseconds: 100),
                    child: GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: size.width < 360
                          ? 1
                          : 2, // 1 column on tiny screens, 2 on others
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 2.8,
                      children: [
                        _buildQuickActionTile(
                          context,
                          'Shop Manager',
                          Icons.inventory_2_rounded,
                          AppColors.primary,
                          () => _navigateToShopManager(context),
                        ),
                        _buildQuickActionTile(
                          context,
                          'Clinics & Services',
                          Icons.medical_services_rounded,
                          AppColors.tertiary,
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => AdminServiceManagerScreen(),
                            ),
                          ),
                        ),
                        _buildQuickActionTile(
                          context,
                          'Insights Console',
                          Icons.insights_rounded,
                          AppColors.accentAmber,
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => AdminAnalyticsScreen(),
                            ),
                          ),
                        ),
                        _buildQuickActionTile(
                          context,
                          'Blog Manager',
                          Icons.article_rounded,
                          AppColors.secondary,
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => AdminBlogManagerScreen(),
                            ),
                          ),
                        ),
                        _buildQuickActionTile(
                          context,
                          'Pet Directory',
                          Icons.pets_rounded,
                          AppColors.healthGreen,
                          () => _navigateToPetDirectory(context),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Broadcast & Banner Control
                  FadeInUp(
                    delay: const Duration(milliseconds: 200),
                    child: PremiumCard(
                      useGlass: false,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AdminBroadcastScreen(),
                        ),
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primary, AppColors.primaryDark],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  Icons.campaign_rounded,
                                  color: Colors.white,
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'GLOBAL BROADCAST CENTER',
                                  style: AppTypography.titleMedium.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.8,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                            if (state.systemBanner != null &&
                                state.systemBanner!.isNotEmpty) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.info_outline_rounded,
                                      color: Colors.white,
                                      size: 14,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Active Banner: "${state.systemBanner}"',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
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
                  const SizedBox(height: 48),

                  // Pending Approvals
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Verification Pipeline',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 22,
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const AdminVerifyVetsScreen(),
                          ),
                        ),
                        child: Text(
                          'VIEW ALL',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                                letterSpacing: 0.5,
                              ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (unverifiedVetsCount == 0)
                    _buildEmptyState(
                      context,
                      'No pending verification requests.',
                    )
                  else
                    ...vets
                        .where((v) => !v.isVerified)
                        .take(2)
                        .map(
                          (v) => FadeInUp(
                            child: Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: PremiumCard(
                                opacity: 0.2,
                                borderRadius: 24,
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: AppColors.accentAmber
                                              .withValues(alpha: 0.1),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.assignment_ind_rounded,
                                          color: AppColors.accentAmber,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              v.name,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleMedium
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.w700,
                                                    fontSize: 16,
                                                  ),
                                            ),
                                            Text(
                                              v.tag.toUpperCase(),
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .labelSmall
                                                  ?.copyWith(
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 9,
                                                  ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      ElevatedButton(
                                        onPressed: () {
                                          HapticFeedback.mediumImpact();
                                          state.toggleVetVerification(v.id);
                                        },
                                        style: ElevatedButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 16,
                                          ),
                                          minimumSize: const Size(0, 36),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              12,
                                            ),
                                          ),
                                        ),
                                        child: const Text(
                                          'APPROVE',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                  const SizedBox(height: 48),

                  // Audit Logs
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Audit Trail',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 22,
                        ),
                      ),
                      TextButton(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const AdminLogsScreen(),
                          ),
                        ),
                        child: Text(
                          'FULL AUDIT',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                                letterSpacing: 0.5,
                              ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (logs.isEmpty)
                    _buildEmptyState(context, 'No system logs generated yet.')
                  else
                    ...logs
                        .take(4)
                        .map(
                          (log) => FadeInUp(child: _buildLogTile(context, log)),
                        ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, String msg) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: Theme.of(
            context,
          ).colorScheme.outlineVariant.withValues(alpha: 0.5),
        ),
      ),
      child: Center(
        child: Text(msg, style: Theme.of(context).textTheme.bodyMedium),
      ),
    );
  }

  Widget _buildKpiCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return PremiumCard(
      onTap: onTap,
      opacity: 0.2,
      borderRadius: 20,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(height: 12),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
            ),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                title,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionTile(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return PremiumCard(
      onTap: onTap,
      opacity: 0.15,
      borderRadius: 18,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 12,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToOrderManager(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => AdminOrderManagerScreen()),
    );
  }

  void _navigateToShopManager(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => AdminShopManagerScreen()),
    );
  }

  void _navigateToPetDirectory(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => AdminPetDirectoryScreen()),
    );
  }

  void _navigateToServicePricing(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => AdminServicePricingScreen()),
    );
  }

  Widget _buildLogTile(BuildContext context, String log) {
    final time = log.length >= 9 ? log.substring(1, 9) : '--:--';
    final content = log.length >= 11 ? log.substring(11) : log;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: PremiumCard(
        opacity: 0.1,
        borderRadius: 16,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  content,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                time,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
