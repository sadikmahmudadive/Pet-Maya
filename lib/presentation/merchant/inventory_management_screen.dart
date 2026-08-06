import 'package:flutter/material.dart';
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
        title: const Text('Inventory Catalog'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_box_rounded, color: AppColors.primary),
            onPressed: () => _showAddProductDialog(context, state),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final prod = products[index];
          return FadeInUp(
            delay: Duration(milliseconds: 50 * index),
            child: Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: PremiumCard(
                opacity: 0.3,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          width: 64,
                          height: 64,
                          color: Colors.white.withOpacity(0.5),
                          child: prod.imageUrl != null ? Image.network(prod.imageUrl!, fit: BoxFit.contain) : const Icon(Icons.inventory_2),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(prod.name, style: AppTypography.titleMedium.copyWith(fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                            Text('\$${prod.price.toStringAsFixed(2)} • ${prod.category}', style: AppTypography.bodyMedium.copyWith(fontSize: 12)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: (prod.stockQuantity > 5 ? AppColors.healthGreen : AppColors.dangerRed).withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    'Stock: ${prod.stockQuantity}',
                                    style: TextStyle(
                                      color: prod.stockQuantity > 5 ? AppColors.healthGreen : AppColors.dangerRed,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 10,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit_outlined, color: AppColors.primary, size: 20),
                        onPressed: () => _showEditStockDialog(context, state, prod),
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

  void _showAddProductDialog(BuildContext context, AppStateRepository state) {
    final nameController = TextEditingController();
    final priceController = TextEditingController();
    final stockController = TextEditingController(text: '20');
    final descController = TextEditingController(text: 'Quality pet essential guaranteed for wellness.');
    final brandController = TextEditingController(text: 'Tail Wagging Select');
    String category = 'Food';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text('Add Product'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Product Name')),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: ['Food', 'Toys', 'Accessories', 'Medicine'].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                  onChanged: (val) => setDialogState(() => category = val!),
                ),
                const SizedBox(height: 12),
                TextField(controller: priceController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price (\$)')),
                const SizedBox(height: 12),
                TextField(controller: stockController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Stock Qty')),
                const SizedBox(height: 12),
                TextField(controller: brandController, decoration: const InputDecoration(labelText: 'Brand')),
                const SizedBox(height: 12),
                TextField(controller: descController, maxLines: 2, decoration: const InputDecoration(labelText: 'Description')),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
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
                  imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=500&auto=format&fit=crop',
                ));
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product added! 📦')));
              },
              child: const Text('Add Product'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditStockDialog(BuildContext context, AppStateRepository state, ProductModel prod) {
    final stockController = TextEditingController(text: '${prod.stockQuantity}');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Update Stock: ${prod.name}'),
        content: TextField(
          controller: stockController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Current Stock Quantity'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final newStock = int.tryParse(stockController.text.trim()) ?? prod.stockQuantity;
              state.updateProductStock(prod.id, newStock);
              Navigator.pop(ctx);
            },
            child: const Text('Save Stock'),
          ),
        ],
      ),
    );
  }
}
