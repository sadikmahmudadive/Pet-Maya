import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/order_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';

class AdminOrderManagerScreen extends StatefulWidget {
  const AdminOrderManagerScreen({super.key});

  @override
  State<AdminOrderManagerScreen> createState() => _AdminOrderManagerScreenState();
}

class _AdminOrderManagerScreenState extends State<AdminOrderManagerScreen> {
  OrderStatus? _filterStatus;

  @override
  Widget build(BuildContext context) {
    final orders = context.watch<AppStateRepository>().orders;
    final state = context.read<AppStateRepository>();

    final filtered = _filterStatus == null 
        ? orders 
        : orders.where((o) => o.status == _filterStatus).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Global Orders', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          _buildStatusFilter(),
          const SizedBox(height: 16),
          Expanded(
            child: filtered.isEmpty
                ? const EmptyState(icon: Icons.shopping_bag_outlined, title: 'No orders found', message: 'Check back later for new sales.')
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final order = filtered[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 30 * index),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: PremiumCard(
                            opacity: 0.15,
                            borderRadius: 24,
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(order.orderId, style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'monospace')),
                                      _buildStatusBadge(order.status),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(order.userName, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800)),
                                  Text(DateFormat('MMM dd, yyyy • hh:mm a').format(DateTime.fromMillisecondsSinceEpoch(order.timestamp)), 
                                    style: TextStyle(fontSize: 11, color: Colors.grey[500], fontWeight: FontWeight.w600)),
                                  const Divider(height: 32),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('৳${order.total.toStringAsFixed(2)}', style: AppTypography.titleLarge.copyWith(color: AppColors.healthGreen, fontWeight: FontWeight.w900)),
                                      DropdownButton<OrderStatus>(
                                        value: order.status,
                                        underline: const SizedBox(),
                                        items: OrderStatus.values.map((s) => DropdownMenuItem(value: s, child: Text(s.displayName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)))).toList(),
                                        onChanged: (newStatus) {
                                          if (newStatus != null) state.updateOrderStatus(order.orderId, newStatus);
                                        },
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

  Widget _buildStatusFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _filterChip('ALL', null),
          ...OrderStatus.values.map((s) => _filterChip(s.displayName.toUpperCase(), s)),
        ],
      ),
    );
  }

  Widget _filterChip(String label, OrderStatus? status) {
    final isSelected = _filterStatus == status;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: PremiumCard(
        onTap: () => setState(() => _filterStatus = status),
        opacity: isSelected ? 0.4 : 0.1,
        borderRadius: 12,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: isSelected ? AppColors.primary : Colors.grey)),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(OrderStatus status) {
    Color color = AppColors.primary;
    if (status == OrderStatus.delivered) color = AppColors.healthGreen;
    if (status == OrderStatus.cancelled) color = AppColors.dangerRed;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status.displayName.toUpperCase(), style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 8)),
    );
  }
}
