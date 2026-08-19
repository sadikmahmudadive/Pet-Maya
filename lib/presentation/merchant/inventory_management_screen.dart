import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/product_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class InventoryManagementScreen extends StatelessWidget {
  const InventoryManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final products = context.select((AppStateRepository state) => state.products);
    final state = context.read<AppStateRepository>();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Store Inventory'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary, size: 28),
            onPressed: () => _showAddProductModal(context, state),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
        itemCount: products.length,
        physics: const BouncingScrollPhysics(),
        itemBuilder: (context, index) {
          final prod = products[index];
          return FadeInUp(
            delay: Duration(milliseconds: 50 * index),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: PremiumCard(
                opacity: 0.25,
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
                          child: prod.imageUrl != null 
                            ? Image.network(prod.imageUrl!, fit: BoxFit.contain) 
                            : const Icon(Icons.inventory_2_rounded, color: Colors.grey),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(prod.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800), maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            Text('৳${prod.price.toStringAsFixed(2)} • ${prod.category}',
                              style: AppTypography.labelSmall.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: (prod.stockQuantity > 5 ? AppColors.healthGreen : AppColors.dangerRed).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${prod.stockQuantity} IN STOCK',
                                style: TextStyle(
                                  color: prod.stockQuantity > 5 ? AppColors.healthGreen : AppColors.dangerRed,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 8,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_note_rounded, color: AppColors.primary, size: 24),
                        onPressed: () => _showEditStockModal(context, state, prod),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showAddProductModal(BuildContext context, AppStateRepository state) {
    final nameController = TextEditingController();
    final priceController = TextEditingController();
    final stockController = TextEditingController(text: '20');
    final descController = TextEditingController(text: 'Quality pet essential guaranteed for wellness.');
    final brandController = TextEditingController(text: 'Pet Maya Premium');
    String category = 'Food';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          padding: EdgeInsets.only(top: 24, left: 24, right: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 32),
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)))),
                const SizedBox(height: 24),
                Text('Add Product', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 32),
                
                _buildPremiumInput(context, 'Product Name', nameController, hint: 'e.g., Premium Kibble'),
                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(child: _buildCategoryDropdown(context, category, (val) => setModalState(() => category = val!))),
                    const SizedBox(width: 12),
                    Expanded(child: _buildPremiumInput(context, 'Price (৳)', priceController, hint: '19.99', keyboardType: TextInputType.number)),
                  ],
                ),
                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(child: _buildPremiumInput(context, 'Stock Qty', stockController, hint: '20', keyboardType: TextInputType.number)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildPremiumInput(context, 'Brand', brandController, hint: 'Brand Name')),
                  ],
                ),
                const SizedBox(height: 20),

                _buildPremiumInput(context, 'Description', descController, hint: 'Enter details...', maxLines: 3),
                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  height: 64,
                  child: ElevatedButton(
                    onPressed: () {
                      if (nameController.text.isEmpty || priceController.text.isEmpty) return;
                      state.addProduct(ProductModel(
                        id: 'prod_${const Uuid().v4().substring(0, 6)}',
                        name: nameController.text.trim(),
                        description: descController.text.trim(),
                        price: double.tryParse(priceController.text.trim()) ?? 19.99,
                        category: category,
                        brand: brandController.text.trim(),
                        stockQuantity: int.tryParse(stockController.text.trim()) ?? 10,
                        imageGallery: const ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop'],
                      ));
                      HapticFeedback.mediumImpact();
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product added to catalog! 📦'), backgroundColor: AppColors.healthGreen));
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1AB680), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18))),
                    child: const Text('CREATE LISTING', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 1)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showEditStockModal(BuildContext context, AppStateRepository state, ProductModel prod) {
    final stockController = TextEditingController(text: '${prod.stockQuantity}');
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(top: 24, left: 24, right: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 32),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 24),
            Text('Update Stock', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(prod.name, style: AppTypography.bodyMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
            const SizedBox(height: 32),

            _buildPremiumInput(context, 'Current Inventory', stockController, hint: 'Qty', keyboardType: TextInputType.number),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 60,
              child: ElevatedButton(
                onPressed: () {
                  final newStock = int.tryParse(stockController.text.trim()) ?? prod.stockQuantity;
                  state.updateProductStock(prod.id, newStock);
                  HapticFeedback.mediumImpact();
                  Navigator.pop(ctx);
                },
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1AB680), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                child: const Text('SAVE STOCK LEVEL', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumInput(BuildContext context, String label, TextEditingController controller, {String? hint, int maxLines = 1, TextInputType? keyboardType}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(label.toUpperCase(), style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, letterSpacing: 0.5)),
        ),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 16,
          child: TextField(
            controller: controller,
            maxLines: maxLines,
            keyboardType: keyboardType,
            style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white24 : Colors.grey),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryDropdown(BuildContext context, String current, Function(String?) onChanged) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text('CATEGORY', style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 11, letterSpacing: 0.5)),
        ),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: current,
                isExpanded: true,
                dropdownColor: isDark ? const Color(0xFF1A1A1A) : Colors.white,
                style: TextStyle(fontSize: 13, color: isDark ? Colors.white : Colors.black87, fontWeight: FontWeight.w700),
                items: ['Food', 'Toys', 'Accessories', 'Medicine'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                onChanged: onChanged,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
