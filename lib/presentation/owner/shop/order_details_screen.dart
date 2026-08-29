import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/services/pdf_invoice_service.dart';
import '../../../core/theme/app_colors.dart';
//
import '../../../data/models/order_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';

class OrderDetailsScreen extends StatelessWidget {
  final OrderModel order;

  const OrderDetailsScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat.yMMMd().add_jm().format(DateTime.fromMillisecondsSinceEpoch(order.timestamp));
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text('Order Details', style: const TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Status Banner
            FadeInDown(
              child: PremiumCard(
                opacity: 0.2,
                borderRadius: 36,
                backgroundColor: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFEDF4F8),
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('REFERENCE ID: ${order.orderId}', style: TextStyle(
                            fontWeight: FontWeight.w900, color: const Color(0xFF1AB680), letterSpacing: 1.5, fontSize: 10
                          )),
                          const SizedBox(height: 12),
                          Text(order.status.displayName.toUpperCase(), 
                            style: TextStyle(color: _getStatusColor(order.status), fontWeight: FontWeight.w900, fontSize: 28)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: _getStatusColor(order.status).withValues(alpha: 0.1), shape: BoxShape.circle),
                        child: Icon(_getStatusIcon(order.status), color: _getStatusColor(order.status), size: 36),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 48),

            // 2. Tracking Timeline
            _buildSectionHeader('Shipment Tracking'),
            const SizedBox(height: 24),
            _buildTimeline(context, order.status, dateStr),
            const SizedBox(height: 48),

            // 3. Items
            _buildSectionHeader('Package Contents'),
            const SizedBox(height: 20),
            ...order.items.asMap().entries.map((entry) => FadeInUp(
                  delay: Duration(milliseconds: 100 * entry.key),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: PremiumCard(
                      opacity: 0.15,
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
                                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                                child: entry.value.product.imageUrl != null
                                    ? Image.network(entry.value.product.imageUrl!, fit: BoxFit.contain)
                                    : const Icon(Icons.shopping_bag_rounded, color: Colors.grey),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(entry.value.product.name, 
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                    maxLines: 1, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 4),
                                  Text('Quantity: ${entry.value.quantity}', 
                                    style: TextStyle(color: Colors.grey[500], fontWeight: FontWeight.w700, fontSize: 12)),
                                ],
                              ),
                            ),
                            Text('৳${entry.value.totalPrice.toStringAsFixed(2)}', 
                              style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary, fontSize: 16)),
                          ],
                        ),
                      ),
                    ),
                  ),
                )),
            
            const SizedBox(height: 48),

            // 4. Logistics & Payment
            _buildSectionHeader('Logistics & Payment'),
            const SizedBox(height: 20),
            PremiumCard(
              opacity: 0.15,
              borderRadius: 28,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    _buildInfoRow(context, Icons.location_on_rounded, 'DELIVERY DESTINATION', order.address),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1)),
                    _buildInfoRow(context, Icons.phone_rounded, 'CONTACT NUMBER', order.phone),
                    const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Divider(height: 1)),
                    _buildInfoRow(context, Icons.payments_rounded, 'PAYMENT METHOD', order.paymentMethod.toUpperCase()),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 48),

            // 5. Financial Summary
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionHeader('Financial Summary'),
                TextButton.icon(
                  onPressed: () => PdfInvoiceService.shareInvoice(order),
                  icon: const Icon(Icons.download_rounded, size: 16),
                  label: const Text('INVOICE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                  style: TextButton.styleFrom(foregroundColor: AppColors.primary),
                ),
              ],
            ),
            const SizedBox(height: 20),
            PremiumCard(
              opacity: 0.25,
              borderRadius: 28,
              child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(
                  children: [
                    _buildSummaryRow('Cart Subtotal', order.subtotal),
                    const SizedBox(height: 14),
                    _buildSummaryRow('Shipping & Handling', order.shippingCharges),
                    if (order.discount > 0) ...[
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Discount (${order.couponCode ?? "Coupon"})', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.healthGreen, fontSize: 14)),
                          Text('- ৳${order.discount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.healthGreen)),
                        ],
                      ),
                    ],
                    const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Divider(height: 1)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Paid', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                        Text('৳${order.total.toStringAsFixed(2)}',
                          style: const TextStyle(color: AppColors.primary, fontSize: 32, fontWeight: FontWeight.w900)),
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

  Widget _buildSectionHeader(String title) {
    return Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, letterSpacing: -0.5));
  }

  Widget _buildTimeline(BuildContext context, OrderStatus currentStatus, String orderDate) {
    return Column(
      children: [
        _buildTimelineStep(context, 'Order Placed', orderDate, true),
        _buildTimelineStep(context, 'Processing', 'Validation & QC Check', currentStatus.index >= 1),
        _buildTimelineStep(context, 'Shipped', 'Handed to Logistics', currentStatus.index >= 2),
        _buildTimelineStep(context, 'Delivered', 'Completed', currentStatus.index >= 3, isLast: true),
      ],
    );
  }

  Widget _buildTimelineStep(BuildContext context, String title, String subtitle, bool isCompleted, {bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Icon(isCompleted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, 
              color: isCompleted ? AppColors.healthGreen : Theme.of(context).dividerColor, size: 22),
            if (!isLast) Container(width: 2, height: 40, color: Theme.of(context).dividerColor.withValues(alpha: 0.3)),
          ],
        ),
        const SizedBox(width: 20),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: isCompleted ? Theme.of(context).colorScheme.onSurface : Colors.grey[500])),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey[500], letterSpacing: 0.2)),
          ],
        ),
      ],
    );
  }

  Widget _buildInfoRow(BuildContext context, IconData icon, String label, String value) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 8, color: Colors.grey[500], letterSpacing: 1)),
              const SizedBox(height: 4),
              Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryRow(String label, double value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontWeight: FontWeight.w700, color: Colors.grey[600], fontSize: 14)),
        Text('৳${value.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
      ],
    );
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending: return AppColors.accentAmber;
      case OrderStatus.processing: return AppColors.primary;
      case OrderStatus.dispatched: return Colors.blue;
      case OrderStatus.delivered: return AppColors.healthGreen;
      case OrderStatus.cancelled: return AppColors.dangerRed;
    }
  }

  IconData _getStatusIcon(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending: return Icons.timer_outlined;
      case OrderStatus.processing: return Icons.sync_rounded;
      case OrderStatus.dispatched: return Icons.local_shipping_outlined;
      case OrderStatus.delivered: return Icons.check_circle_outline;
      case OrderStatus.cancelled: return Icons.cancel_outlined;
    }
  }
}

