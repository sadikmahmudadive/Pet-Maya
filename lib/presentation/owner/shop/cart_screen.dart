import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
//
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/empty_state.dart';
import '../../common_widgets/premium_toast.dart';
import '../../common_widgets/resilient_network_image.dart';
import 'package:animate_do/animate_do.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final TextEditingController _couponController = TextEditingController();

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  void _applyCoupon(AppStateRepository state) {
    if (_couponController.text.isEmpty) return;
    try {
      state.applyCoupon(_couponController.text);
      state.showToast('Coupon applied successfully! 🎉');
      _couponController.clear();
    } catch (e) {
      state.showToast(e.toString(), type: ToastType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final items = state.cartItems;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Cart'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          if (items.isNotEmpty)
            TextButton(
              onPressed: () {
                HapticFeedback.mediumImpact();
                state.clearCart();
              },
              child: const Text('Clear All', style: TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.bold)),
            ),
          const SizedBox(width: 8),
        ],
      ),
      body: items.isEmpty
          ? EmptyState(
              icon: Icons.shopping_basket_rounded,
              title: 'Your basket is empty',
              message: 'Time to spoil your furry friend!',
              actionLabel: 'Back to Shop',
              onAction: () => Navigator.pop(context),
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 100, 20, 200),
              itemCount: items.length,
              physics: const BouncingScrollPhysics(),
              itemBuilder: (context, index) {
                final item = items[index];
                return FadeInRight(
                  delay: Duration(milliseconds: 50 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: PremiumCard(
                      opacity: 0.2,
                      borderRadius: 24,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                width: 80,
                                height: 80,
                                color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                                child: ResilientNetworkImage(
                                  imageUrl: item.product.imageUrl,
                                  fit: BoxFit.contain,
                                  fallbackIcon: Icons.inventory_2_outlined,
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.product.name, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 16, fontWeight: FontWeight.w700), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 4),
                                  Text('৳${item.product.price.toStringAsFixed(2)}', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ),
                            // Quantity selector
                            Container(
                              decoration: BoxDecoration(
                                color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                children: [
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    icon: const Icon(Icons.remove_rounded, size: 18),
                                    onPressed: () {
                                      HapticFeedback.lightImpact();
                                      state.updateCartQuantity(item.product.id, -1);
                                    },
                                  ),
                                  Text('${item.quantity}', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, fontSize: 14)),
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    icon: const Icon(Icons.add_rounded, size: 18, color: AppColors.primary),
                                    onPressed: () {
                                      HapticFeedback.lightImpact();
                                      state.updateCartQuantity(item.product.id, 1);
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
      bottomNavigationBar: items.isEmpty
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 40, offset: const Offset(0, -10)),
                ],
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Coupon Input
                    if (state.appliedCoupon == null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _couponController,
                                decoration: InputDecoration(
                                  hintText: 'Enter coupon code',
                                  filled: true,
                                  fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey[100],
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: () => _applyCoupon(state),
                              style: ElevatedButton.styleFrom(
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                              ),
                              child: const Text('APPLY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                            ),
                          ],
                        ),
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.healthGreen.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.healthGreen.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.confirmation_number_rounded, color: AppColors.healthGreen, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Coupon "${state.appliedCoupon!.code}" applied!',
                                  style: const TextStyle(color: AppColors.healthGreen, fontWeight: FontWeight.w700, fontSize: 13),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => state.removeCoupon(),
                                child: const Icon(Icons.close_rounded, color: AppColors.healthGreen, size: 20),
                              ),
                            ],
                          ),
                        ),
                      ),

                    _buildSummaryRow(context, 'Subtotal', state.cartSubtotal),
                    const SizedBox(height: 12),
                    _buildSummaryRow(context, 'Shipping', state.cartShipping),
                    if (state.cartPromoDiscount > 0) ...[
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${state.currentAppliedPromoName} (${state.currentAppliedDiscount}%)', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: const Color(0xFFFF5252), fontWeight: FontWeight.w600)),
                          Text('- ৳${state.cartPromoDiscount.toStringAsFixed(2)}', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: const Color(0xFFFF5252), fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ],
                    if (state.cartCouponDiscount > 0) ...[
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Coupon Discount', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.healthGreen, fontWeight: FontWeight.w600)),
                          Text('- ৳${state.cartCouponDiscount.toStringAsFixed(2)}', style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.healthGreen, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ],
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Divider(height: 1),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Total', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                        Text(
                          '৳${state.cartTotal.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 64,
                      child: ElevatedButton(
                        onPressed: () {
                          HapticFeedback.heavyImpact();
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const CheckoutScreen()),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                        child: const Text('PROCEED TO CHECKOUT', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryRow(BuildContext context, String label, double value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant, fontWeight: FontWeight.w600)),
        Text('৳${value.toStringAsFixed(2)}', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}

