import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/order_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class ShopOrdersScreen extends StatefulWidget {
  const ShopOrdersScreen({super.key});

  @override
  State<ShopOrdersScreen> createState() => _ShopOrdersScreenState();
}

class _ShopOrdersScreenState extends State<ShopOrdersScreen> {
  int _selectedTabIndex = 0;
  final List<String> _tabs = ['New', 'Shipped', 'Delivered'];

  @override
  Widget build(BuildContext context) {
    final orders = context.select((AppStateRepository state) => state.orders);
    final state = context.read<AppStateRepository>();

    final filteredOrders = orders.where((o) {
      if (_selectedTabIndex == 0) return o.status == OrderStatus.pending || o.status == OrderStatus.processing;
      if (_selectedTabIndex == 1) return o.status == OrderStatus.shipped;
      return o.status == OrderStatus.delivered;
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Store Orders'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          // Tab Switcher
          Container(
            height: 50,
            margin: const EdgeInsets.symmetric(horizontal: 20),
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.3),
              borderRadius: BorderRadius.circular(25),
            ),
            child: Row(
              children: List.generate(_tabs.length, (index) {
                final isSelected = _selectedTabIndex == index;
                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedTabIndex = index),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(21),
                      ),
                      child: Text(
                        _tabs[index],
                        style: AppTypography.labelSmall.copyWith(
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: filteredOrders.isEmpty
                ? Center(child: Text('No orders found in this category.', style: AppTypography.bodyMedium))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filteredOrders.length,
                    itemBuilder: (context, index) {
                      final order = filteredOrders[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 50 * index),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: PremiumCard(
                            opacity: 0.3,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Order: ${order.orderId}', style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.bold)),
                                      _buildStatusChip(order.status),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Customer: ${order.userName}', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                                  Text('Address: ${order.address}', style: AppTypography.bodyMedium.copyWith(fontSize: 12)),
                                  const Divider(height: 24),
                                  ...order.items.map((it) => Padding(
                                        padding: const EdgeInsets.only(bottom: 4),
                                        child: Text('${it.quantity}x ${it.product.name}', style: AppTypography.bodyMedium.copyWith(fontSize: 13)),
                                      )),
                                  const SizedBox(height: 8),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Total: \$${order.total.toStringAsFixed(2)}', 
                                        style: AppTypography.titleMedium.copyWith(color: AppColors.healthGreen)),
                                      if (order.status == OrderStatus.pending || order.status == OrderStatus.processing)
                                        ElevatedButton(
                                          onPressed: () {
                                            state.updateOrderStatus(order.orderId, OrderStatus.shipped);
                                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Dispatched! 🚚')));
                                          },
                                          style: ElevatedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 16),
                                            minimumSize: const Size(0, 36),
                                          ),
                                          child: const Text('DISPATCH'),
                                        )
                                      else if (order.status == OrderStatus.shipped)
                                        OutlinedButton(
                                          onPressed: () {
                                            state.updateOrderStatus(order.orderId, OrderStatus.delivered);
                                          },
                                          style: OutlinedButton.styleFrom(
                                            padding: const EdgeInsets.symmetric(horizontal: 16),
                                            minimumSize: const Size(0, 36),
                                          ),
                                          child: const Text('MARK DELIVERED'),
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

  Widget _buildStatusChip(OrderStatus status) {
    Color color = AppColors.primary;
    if (status == OrderStatus.delivered) color = AppColors.healthGreen;
    if (status == OrderStatus.pending) color = AppColors.accentAmber;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }
}
