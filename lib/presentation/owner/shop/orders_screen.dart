import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/order_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';
import 'order_details_screen.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final orders = context.select((AppStateRepository repo) => repo.orders);

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('My Orders'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              final repo = context.read<AppStateRepository>();
              final user = repo.currentUser;
              if (user != null) await repo.syncFromFirebase(user);
            },
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
            sliver: orders.isEmpty
                ? SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.05), shape: BoxShape.circle),
                            child: Icon(Icons.receipt_long_rounded, size: 72, color: AppColors.primary.withOpacity(0.2)),
                          ),
                          const SizedBox(height: 24),
                          Text('No orders yet', style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 12),
                          Text('Your order history will appear here', style: AppTypography.bodyMedium.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
                        ],
                      ),
                    ),
                  )
                : SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final order = orders[index];
                        return FadeInUp(
                          delay: Duration(milliseconds: 50 * index),
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: PremiumCard(
                              opacity: 0.15,
                              borderRadius: 28,
                              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order))),
                              child: Padding(
                                padding: const EdgeInsets.all(20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(order.orderId, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, fontSize: 16)),
                                        _buildStatusBadge(order.status),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    Text('${order.items.length} items • Premium Supplies', 
                                      style: AppTypography.bodyMedium.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600, fontSize: 13)),
                                    const Divider(height: 32),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text('TOTAL AMOUNT', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.outline, fontSize: 9)),
                                            const SizedBox(height: 4),
                                            Text('\$${order.total.toStringAsFixed(2)}', 
                                              style: AppTypography.titleLarge.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 18)),
                                          ],
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                                          child: Row(
                                            children: [
                                              Text('View Details', style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
                                              const SizedBox(width: 4),
                                              const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: AppColors.primary),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                      childCount: orders.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(OrderStatus status) {
    Color color;
    switch (status) {
      case OrderStatus.pending: color = AppColors.accentAmber; break;
      case OrderStatus.processing: color = AppColors.primary; break;
      case OrderStatus.shipped: color = Colors.blue; break;
      case OrderStatus.delivered: color = AppColors.healthGreen; break;
      case OrderStatus.cancelled: color = AppColors.dangerRed; break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        status.displayName.toUpperCase(),
        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 9, letterSpacing: 0.5),
      ),
    );
  }
}
