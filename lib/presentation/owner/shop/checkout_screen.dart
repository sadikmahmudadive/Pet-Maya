import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
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
  bool _isPlacing = false;

  Future<void> _confirmOrder() async {
    final address = _addressController.text.trim();
    final phone = _phoneController.text.trim();

    if (address.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide shipping address and phone number'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isPlacing = true);

    final state = context.read<AppStateRepository>();
    try {
      final order = await state.placeOrder(
        address: address,
        phone: phone,
        paymentMethod: _paymentMethod,
      );

      if (!mounted) return;
      HapticFeedback.heavyImpact();

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.healthGreen.withOpacity(0.1), shape: BoxShape.circle),
                child: const Icon(Icons.check_circle_rounded, color: AppColors.healthGreen, size: 54),
              ),
              const SizedBox(height: 24),
              Text('Order Confirmed!', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              Text('Order ID: ${order.orderId}\nAmount: ৳${order.total.toStringAsFixed(2)}', 
                textAlign: TextAlign.center, style: AppTypography.bodyMedium.copyWith(color: Colors.grey[500], fontWeight: FontWeight.w600)),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const OrdersScreen()));
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                  child: const Text('VIEW ORDER STATUS', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                ),
              ),
            ],
          ),
        ),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.dangerRed));
    } finally {
      if (mounted) setState(() => _isPlacing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Checkout', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Shipping Info
            FadeInDown(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildPremiumField('Delivery Address', _addressController, Icons.home_rounded),
                  const SizedBox(height: 20),
                  _buildPremiumField('Contact Phone', _phoneController, Icons.phone_rounded, keyboardType: TextInputType.phone),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Payment Methods
            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Payment Method'),
                  const SizedBox(height: 12),
                  _buildPaymentOption('COD', 'Cash on Delivery', 'Pay when package arrives', Icons.payments_rounded),
                  const SizedBox(height: 12),
                  _buildPaymentOption('CARD', 'Credit / Debit Card', 'Secure online checkout', Icons.credit_card_rounded),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Order Summary
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Order Summary'),
                  const SizedBox(height: 12),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 28,
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          ...state.cartItems.map((item) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('${item.quantity}x ${item.product.name}', 
                                      style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: isDark ? Colors.white70 : Colors.black87)),
                                    Text('৳${item.totalPrice.toStringAsFixed(2)}', 
                                      style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 14)),
                                  ],
                                ),
                              )),
                          const Divider(height: 32),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Total Amount', style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800)),
                              Text('৳${state.cartTotal.toStringAsFixed(2)}',
                                style: AppTypography.headlineSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildSectionLabel(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(label.toUpperCase(), 
        style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1)),
    );
  }

  Widget _buildPremiumField(String label, TextEditingController controller, IconData icon, {TextInputType? keyboardType}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionLabel(label),
        const SizedBox(height: 8),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 20,
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
            decoration: InputDecoration(
              prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 20),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentOption(String value, String title, String subtitle, IconData icon) {
    final isSelected = _paymentMethod == value;
    return PremiumCard(
      onTap: () => setState(() => _paymentMethod = value),
      opacity: isSelected ? 0.25 : 0.05,
      borderRadius: 20,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
                  Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey[500], fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            Radio<String>(
              value: value,
              groupValue: _paymentMethod,
              onChanged: (val) => setState(() => _paymentMethod = val!),
              activeColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 40, offset: const Offset(0, -10))],
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: ElevatedButton(
            onPressed: _isPlacing ? null : _confirmOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF006684),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: _isPlacing 
              ? const CircularProgressIndicator(color: Colors.white)
              : const Text('CONFIRM ORDER', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1.2, fontSize: 13)),
          ),
        ),
      ),
    );
  }
}
