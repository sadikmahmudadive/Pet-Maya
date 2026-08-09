import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/order_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';

class ShopOrdersScreen extends StatefulWidget {
  const ShopOrdersScreen({super.key});

  @override
  State<ShopOrdersScreen> createState() => _ShopOrdersScreenState();
}

class _ShopOrdersScreenState extends State<ShopOrdersScreen> {
  int _selectedTabIndex = 0;
  final List<String> _tabs = ['Processing', 'Shipped', 'Delivered'];

  @override
  Widget build(BuildContext context) {
    final orders = context.select((AppStateRepository state) => state.orders);
    final state = context.read<AppStateRepository>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filteredOrders = orders.where((o) {
      if (_selectedTabIndex == 0) return o.status == OrderStatus.pending || o.status == OrderStatus.processing;
      if (_selectedTabIndex == 1) return o.status == OrderStatus.shipped;
      return o.status == OrderStatus.delivered;
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Store Orders', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          // Premium Tab Switcher
          Container(
            height: 54,
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.05) : Colors.white.withOpacity(0.4),
              borderRadius: BorderRadius.circular(27),
              border: Border.all(color: Colors.white.withOpacity(0.1)),
            ),
            child: Row(
              children: List.generate(_tabs.length, (index) {
                final isSelected = _selectedTabIndex == index;
                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedTabIndex = index);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutCubic,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(22),
                        boxShadow: isSelected ? [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))] : null,
                      ),
                      child: Text(
                        _tabs[index],
                        style: TextStyle(
                          color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppColors.textPrimary),
                          fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                          fontSize: 10,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 24),

          Expanded(
            child: filteredOrders.isEmpty
                ? EmptyState(
                    icon: Icons.receipt_long_rounded,
                    title: 'No ${_tabs[_selectedTabIndex]} orders',
                    message: 'All your customer orders in this category will appear here.',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filteredOrders.length,
                    itemBuilder: (context, index) {
                      final order = filteredOrders[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 50 * index),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: PremiumCard(
                            opacity: 0.2,
                            borderRadius: 28,
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(order.orderId, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w900, color: AppColors.primary)),
                                      _buildStatusBadge(order.status),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  Text('CUSTOMER', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey[500], fontSize: 9, letterSpacing: 1)),
                                  const SizedBox(height: 4),
                                  Text(order.userName, style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w800)),
                                  const SizedBox(height: 12),
                                  Text('DELIVERY TO', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.grey[500], fontSize: 9, letterSpacing: 1)),
                                  const SizedBox(height: 4),
                                  Text(order.address, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: isDark ? Colors.white70 : Colors.black54)),
                                  const Divider(height: 40),
                                  ...order.items.map((it) => Padding(
                                        padding: const EdgeInsets.only(bottom: 8),
                                        child: Row(
                                          children: [
                                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                                            const SizedBox(width: 12),
                                            Text('${it.quantity}x ', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13)),
                                            Expanded(child: Text(it.product.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
                                          ],
                                        ),
                                      )),
                                  const SizedBox(height: 20),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('TOTAL PAYOUT', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 8, color: Colors.grey)),
                                          Text('৳${order.total.toStringAsFixed(2)}',
                                            style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.healthGreen, fontSize: 18)),
                                        ],
                                      ),
                                      if (order.status == OrderStatus.pending || order.status == OrderStatus.processing)
                                        SizedBox(
                                          height: 44,
                                          child: ElevatedButton(
                                            onPressed: () {
                                              state.updateOrderStatus(order.orderId, OrderStatus.shipped);
                                              HapticFeedback.mediumImpact();
                                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Dispatched successfully! 🚚'), behavior: SnackBarBehavior.floating, backgroundColor: AppColors.healthGreen));
                                            },
                                            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF006684), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                                            child: const Text('DISPATCH', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 0.5, fontSize: 11)),
                                          ),
                                        )
                                      else if (order.status == OrderStatus.shipped)
                                        SizedBox(
                                          height: 44,
                                          child: OutlinedButton(
                                            onPressed: () {
                                              state.updateOrderStatus(order.orderId, OrderStatus.delivered);
                                              HapticFeedback.mediumImpact();
                                            },
                                            style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.healthGreen), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                                            child: const Text('MARK DELIVERED', style: TextStyle(color: AppColors.healthGreen, fontWeight: FontWeight.w900, fontSize: 10)),
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
      child: Text(status.displayName.toUpperCase(), 
        style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.8)),
    );
  }
}
