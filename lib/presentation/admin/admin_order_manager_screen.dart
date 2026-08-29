import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:intl/intl.dart';
import '../../core/services/pdf_invoice_service.dart';
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
                            onTap: () => _showDispatchManifest(context, order),
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

  void _showDispatchManifest(BuildContext context, OrderModel order) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateStr = DateFormat('MMMM dd, yyyy • hh:mm a').format(DateTime.fromMillisecondsSinceEpoch(order.timestamp));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Consumer<AppStateRepository>(
        builder: (context, state, _) {
          // Try to get email from cache if missing in order
          String displayEmail = order.userEmail ?? order.userId;
          if (order.userEmail == null || order.userEmail!.isEmpty) {
            final cachedUser = state.userCache[order.userId];
            if (cachedUser != null) {
              displayEmail = cachedUser.email;
            } else {
              state.fetchAndCacheUser(order.userId);
            }
          }

          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)))),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('DISPATCH MANIFEST', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 1.5)),
                        Text(order.orderId, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, fontFamily: 'monospace')),
                      ],
                    ),
                    _buildStatusBadge(order.status),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => PdfInvoiceService.shareInvoice(order),
                        icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                        label: const Text('GENERATE INVOICE', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                          foregroundColor: AppColors.primary,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
                const Divider(height: 32),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _manifestSection('CUSTOMER DETAILS', [
                          _manifestRow('Name', order.userName),
                          _manifestRow('Phone', order.phone),
                          _manifestRow('Email', displayEmail),
                        ]),
                        const SizedBox(height: 32),
                        _manifestSection('DELIVERY LOGISTICS', [
                          _manifestRow('Address', order.address, isValueMultiline: true),
                          _manifestRow('Date', dateStr),
                          _manifestRow('Method', order.paymentMethod),
                        ]),
                        const SizedBox(height: 32),
                        _manifestSection('INVENTORY MANIFEST', [
                          ...order.items.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Row(
                              children: [
                                Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
                                const SizedBox(width: 12),
                                Text('${item.quantity}x ', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                                Expanded(child: Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
                                Text('৳${item.totalPrice.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                              ],
                            ),
                          )),
                        ]),
                        const Divider(height: 48),
                        _manifestRow('Subtotal', '৳${order.subtotal.toStringAsFixed(2)}'),
                        _manifestRow('Shipping', '৳${order.shippingCharges.toStringAsFixed(2)}'),
                        if (order.discount > 0)
                          _manifestRow('Discount', '- ৳${order.discount.toStringAsFixed(2)}'),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('TOTAL PAYOUT', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                            Text('৳${order.total.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: AppColors.healthGreen)),
                          ],
                        ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  height: 64,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? Colors.white10 : Colors.black87,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Text('CLOSE MANIFEST', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _manifestSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
        const SizedBox(height: 16),
        ...children,
      ],
    );
  }

  Widget _manifestRow(String label, String value, {bool isValueMultiline = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 80, child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey))),
          const SizedBox(width: 12),
          Expanded(
            child: Text(value, 
              textAlign: TextAlign.right,
              maxLines: isValueMultiline ? 3 : 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
          ),
        ],
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
