import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/order_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/resilient_network_image.dart';
import '../auth/login_screen.dart';
import 'package:animate_do/animate_do.dart';
import 'inventory_management_screen.dart';
import 'shop_orders_screen.dart';

class PetShopDashboardScreen extends StatelessWidget {
  const PetShopDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final user = state.currentUser;
    final products = state.products;
    final orders = state.orders;

    final double totalRevenue = orders.fold(0.0, (sum, o) => sum + o.total);
    final lowStockCount = products.where((p) => p.isLowStock).length;

    final size = MediaQuery.of(context).size;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Store Manager'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: AppColors.dangerRed),
            onPressed: () {
              HapticFeedback.mediumImpact();
              state.logout();
              Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (r) => false);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
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
                        Text('Hi, ${user?.name ?? 'Merchant'}', 
                          style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 28)),
                        const SizedBox(height: 4),
                        Text('Your store summary for today', 
                          style: AppTypography.bodyLarge.copyWith(color: Colors.grey[500], fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // KPI Cards
                  Row(
                    children: [
                      Expanded(child: FadeInLeft(child: _buildKpiCard(context, 'REVENUE', '৳${totalRevenue.toStringAsFixed(0)}', Icons.monetization_on_rounded, AppColors.healthGreen))),
                      const SizedBox(width: 10),
                      Expanded(child: FadeInUp(child: _buildKpiCard(context, 'ORDERS', '${orders.length}', Icons.local_shipping_rounded, AppColors.primary))),
                      const SizedBox(width: 10),
                      Expanded(child: FadeInRight(child: _buildKpiCard(context, 'LOW STOCK', '$lowStockCount', Icons.warning_amber_rounded, AppColors.dangerRed))),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick Actions
                  Row(
                    children: [
                      Expanded(
                        child: FadeInLeft(
                          child: PremiumCard(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InventoryManagementScreen())),
                            useGlass: false,
                            borderRadius: 24,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 22),
                              decoration: BoxDecoration(
                                color: const Color(0xFF1AB680), 
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [BoxShadow(color: const Color(0xFF1AB680).withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))],
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.inventory_2_rounded, color: Colors.white, size: 20),
                                  const SizedBox(width: 10),
                                  Text('CATALOG', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 1.2, fontSize: 11)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FadeInRight(
                          child: PremiumCard(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ShopOrdersScreen())),
                            opacity: 0.15,
                            borderRadius: 24,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 22),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.receipt_long_rounded, color: AppColors.primary, size: 20),
                                  const SizedBox(width: 10),
                                  Text('ORDERS', style: TextStyle(color: isDark ? Colors.white : AppColors.primary, fontWeight: FontWeight.w800, letterSpacing: 1.2, fontSize: 11)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 48),

                  // Alerts
                  if (lowStockCount > 0) ...[
                    FadeInDown(
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.dangerRed.withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: AppColors.dangerRed.withValues(alpha: 0.1)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: AppColors.dangerRed),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                '$lowStockCount items are running low on stock. Please update inventory.',
                                style: AppTypography.bodyMedium.copyWith(color: isDark ? AppColors.dangerRedLight : AppColors.dangerRedDeep, fontWeight: FontWeight.w700, fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],

                  // Active Customer Orders
                  Text('Recent Orders', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 20),
                  if (orders.isEmpty)
                    _buildEmptyState(context, 'No orders received yet.')
                  else
                    ...orders.take(3).map((ord) => FadeInUp(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: PremiumCard(
                              opacity: 0.2,
                              borderRadius: 24,
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(ord.orderId, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800)),
                                        const SizedBox(height: 4),
                                        Text('${ord.items.length} items • ৳${ord.total.toStringAsFixed(2)}',
                                          style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: Colors.grey[500])),
                                      ],
                                    ),
                                    _buildStatusBadge(ord.status),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        )),

                  const SizedBox(height: 48),

                  // Warehouse Overview
                  Text('Warehouse Overview', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 20),
                  ...products.take(4).map((p) => FadeInUp(
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: PremiumCard(
                            opacity: 0.1,
                            borderRadius: 20,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: Container(
                                      width: 50,
                                      height: 50,
                                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                      child: ResilientNetworkImage(
                                         imageUrl: p.imageUrl,
                                         fit: BoxFit.contain,
                                         fallbackIcon: Icons.inventory_2,
                                       ),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(p.name, style: AppTypography.titleMedium.copyWith(fontSize: 14, fontWeight: FontWeight.w800), maxLines: 1, overflow: TextOverflow.ellipsis),
                                        Text('Stock: ${p.stockQuantity} units', 
                                          style: AppTypography.labelSmall.copyWith(color: p.isLowStock ? AppColors.dangerRed : Colors.grey[500], fontWeight: FontWeight.w700)),
                                      ],
                                    ),
                                  ),
                                  Text('৳${p.price.toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.primary, fontSize: 16)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(OrderStatus status) {
    Color color = AppColors.primary;
    if (status == OrderStatus.delivered) color = AppColors.healthGreen;
    if (status == OrderStatus.pending) color = AppColors.accentAmber;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
      child: Text(status.displayName.toUpperCase(), 
        style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.8)),
    );
  }

  Widget _buildEmptyState(BuildContext context, String msg) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
      ),
      child: Center(child: Text(msg, style: AppTypography.bodyMedium)),
    );
  }

  Widget _buildKpiCard(BuildContext context, String title, String value, IconData icon, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return PremiumCard(
      opacity: 0.2,
      borderRadius: 24,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 14),
            Text(value, 
              style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: isDark ? Colors.white : Colors.black87),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(title, 
              style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: Colors.grey[500]),
              maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}
