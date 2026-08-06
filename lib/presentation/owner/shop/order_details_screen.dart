import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/order_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class OrderDetailsScreen extends StatelessWidget {
  final OrderModel order;

  const OrderDetailsScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat.yMMMd().add_jm().format(DateTime.fromMillisecondsSinceEpoch(order.timestamp));

    return GlassScaffold(
      appBar: AppBar(
        title: Text('Order ${order.orderId}'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner
            FadeInDown(
              child: PremiumCard(
                opacity: 0.25,
                borderRadius: 32,
                child: Padding(
                  padding: const EdgeInsets.all(28),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('ORDER STATUS', style: AppTypography.labelSmall.copyWith(
                            fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.outline, letterSpacing: 0.8, fontSize: 10
                          )),
                          const SizedBox(height: 8),
                          Text(order.status.displayName.toUpperCase(), 
                            style: AppTypography.titleLarge.copyWith(color: _getStatusColor(order.status), fontWeight: FontWeight.w700, fontSize: 24)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: _getStatusColor(order.status).withOpacity(0.1), shape: BoxShape.circle),
                        child: Icon(_getStatusIcon(order.status), color: _getStatusColor(order.status), size: 32),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),

            // Order Timeline
            Text('TRACKING TIMELINE', style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700, letterSpacing: 0.8, color: Theme.of(context).colorScheme.outline, fontSize: 10
            )),
            const SizedBox(height: 24),
            _buildTimeline(context, order.status, dateStr),
            const SizedBox(height: 48),

            // Items
            Text('ITEMS PURCHASED', style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700, letterSpacing: 0.8, color: Theme.of(context).colorScheme.outline, fontSize: 10
            )),
            const SizedBox(height: 20),
            ...order.items.asMap().entries.map((entry) => FadeInUp(
                  delay: Duration(milliseconds: 100 * entry.key),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: PremiumCard(
                      opacity: 0.1,
                      borderRadius: 24,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                width: 70,
                                height: 70,
                                color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.5),
                                child: entry.value.product.imageUrl != null
                                    ? Image.network(entry.value.product.imageUrl!, fit: BoxFit.contain)
                                    : const Icon(Icons.shopping_bag_outlined),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(entry.value.product.name, 
                                    style: AppTypography.titleMedium.copyWith(fontSize: 16, fontWeight: FontWeight.w700),
                                    maxLines: 1, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 4),
                                  Text('Qty: ${entry.value.quantity}', 
                                    style: AppTypography.bodyMedium.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
                                ],
                              ),
                            ),
                            Text('\$${entry.value.totalPrice.toStringAsFixed(2)}', 
                              style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary)),
                          ],
                        ),
                      ),
                    ),
                  ),
                )),
            
            const SizedBox(height: 48),

            // Shipping & Payment
            Text('LOGISTICS & PAYMENT', style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700, letterSpacing: 0.8, color: Theme.of(context).colorScheme.outline, fontSize: 10
            )),
            const SizedBox(height: 20),
            PremiumCard(
              opacity: 0.15,
              borderRadius: 28,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _buildInfoRow(context, Icons.location_on_rounded, 'DELIVERY ADDRESS', order.address),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1)),
                    _buildInfoRow(context, Icons.phone_rounded, 'CONTACT PHONE', order.phone),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1)),
                    _buildInfoRow(context, Icons.payment_rounded, 'PAYMENT METHOD', order.paymentMethod.toUpperCase()),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 48),

            // Summary
            Text('SUMMARY', style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700, letterSpacing: 0.8, color: Theme.of(context).colorScheme.outline, fontSize: 10
            )),
            const SizedBox(height: 20),
            PremiumCard(
              opacity: 0.3,
              borderRadius: 28,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _buildSummaryRow('Subtotal', order.subtotal),
                    const SizedBox(height: 12),
                    _buildSummaryRow('Shipping', order.shippingCharges),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Total', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w700)),
                        Text('\$${order.total.toStringAsFixed(2)}', 
                          style: AppTypography.displayLarge.copyWith(color: AppColors.primary, fontSize: 28, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeline(BuildContext context, OrderStatus currentStatus, String orderDate) {
    return Column(
      children: [
        _buildTimelineStep(context, 'Order Placed', orderDate, true),
        _buildTimelineStep(context, 'Processing', 'Usually within 24 hours', currentStatus.index >= 1),
        _buildTimelineStep(context, 'Shipped', 'Out for delivery', currentStatus.index >= 2),
        _buildTimelineStep(context, 'Delivered', 'Enjoy your treats!', currentStatus.index >= 3),
      ],
    );
  }

  Widget _buildTimelineStep(BuildContext context, String title, String subtitle, bool isCompleted) {
    return Row(
      children: [
        Column(
          children: [
            Icon(isCompleted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, 
              color: isCompleted ? AppColors.healthGreen : Theme.of(context).dividerColor, size: 20),
            Container(width: 2, height: 30, color: Theme.of(context).dividerColor),
          ],
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppTypography.titleMedium.copyWith(fontSize: 14, color: isCompleted ? Theme.of(context).colorScheme.onSurface : Theme.of(context).colorScheme.onSurfaceVariant)),
            Text(subtitle, style: AppTypography.labelSmall.copyWith(fontSize: 10)),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoRow(BuildContext context, IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTypography.labelSmall),
              Text(value, style: AppTypography.bodyMedium.copyWith(color: Theme.of(context).colorScheme.onSurface)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, double value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: isTotal ? AppTypography.titleLarge : AppTypography.bodyMedium),
          Text('\$${value.toStringAsFixed(2)}', style: isTotal ? AppTypography.titleLarge.copyWith(color: AppColors.primary) : AppTypography.titleMedium),
        ],
      ),
    );
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending: return AppColors.accentAmber;
      case OrderStatus.delivered: return AppColors.healthGreen;
      case OrderStatus.cancelled: return AppColors.dangerRed;
      default: return AppColors.primary;
    }
  }

  IconData _getStatusIcon(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending: return Icons.timer_outlined;
      case OrderStatus.delivered: return Icons.check_circle_outline;
      case OrderStatus.cancelled: return Icons.cancel_outlined;
      default: return Icons.local_shipping_outlined;
    }
  }
}
