import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import 'orders_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _addressController = TextEditingController(text: '742 Evergreen Terrace, Springfield');
  final _phoneController = TextEditingController(text: '+1 (555) 987-6543');
  String _paymentMethod = 'COD';
  bool _placing = false;

  Future<void> _confirmOrder() async {
    final address = _addressController.text.trim();
    final phone = _phoneController.text.trim();

    if (address.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide shipping address and phone number')),
      );
      return;
    }

    setState(() => _placing = true);

    final state = context.read<AppStateRepository>();
    final order = await state.placeOrder(
      address: address,
      phone: phone,
      paymentMethod: _paymentMethod,
    );

    if (!mounted) return;
    setState(() => _placing = false);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: AppColors.healthGreenLight,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.check_circle_rounded, color: AppColors.healthGreen, size: 48),
            ),
            const SizedBox(height: 16),
            Text('Order Confirmed!', style: AppTypography.headlineMedium),
            const SizedBox(height: 8),
            Text('Order ID: ${order.orderId}\nTotal: \$${order.total.toStringAsFixed(2)}', textAlign: TextAlign.center, style: AppTypography.bodyMedium),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(context); // close dialog
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (_) => const OrdersScreen()),
                  );
                },
                child: const Text('View Order Status'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Checkout'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Delivery Address', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            TextField(controller: _addressController, decoration: const InputDecoration(prefixIcon: Icon(Icons.home_outlined))),
            const SizedBox(height: 16),

            Text('Contact Phone', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            TextField(controller: _phoneController, decoration: const InputDecoration(prefixIcon: Icon(Icons.phone_outlined))),
            const SizedBox(height: 24),

            Text('Payment Method', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            RadioListTile<String>(
              value: 'COD',
              groupValue: _paymentMethod,
              title: const Text('Cash on Delivery (COD)'),
              subtitle: const Text('Pay when the package arrives at your doorstep'),
              onChanged: (val) => setState(() => _paymentMethod = val!),
            ),
            RadioListTile<String>(
              value: 'CARD',
              groupValue: _paymentMethod,
              title: const Text('Credit / Debit Card'),
              subtitle: const Text('Visa, MasterCard, Amex secure checkout'),
              onChanged: (val) => setState(() => _paymentMethod = val!),
            ),
            const SizedBox(height: 24),

            // Order Summary
            Text('Order Summary', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                children: [
                  ...state.cartItems.map((item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('${item.quantity}x ${item.product.name}', style: AppTypography.bodyMedium),
                            Text('\$${item.totalPrice.toStringAsFixed(2)}', style: AppTypography.titleMedium.copyWith(fontSize: 13)),
                          ],
                        ),
                      )),
                  const Divider(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Total Payable', style: AppTypography.titleLarge),
                      Text('\$${state.cartTotal.toStringAsFixed(2)}', style: AppTypography.headlineMedium.copyWith(color: AppColors.primary)),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _confirmOrder,
                child: const Text('Place Order Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
