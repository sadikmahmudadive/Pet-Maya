import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/product_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';
import 'cart_screen.dart';

class ProductDetailsScreen extends StatelessWidget {
  final ProductModel product;

  const ProductDetailsScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();

    return GlassScaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            leading: IconButton(
              icon: Icon(Icons.arrow_back_ios_new_rounded, color: Theme.of(context).colorScheme.onSurface),
              onPressed: () => Navigator.pop(context),
            ),
            backgroundColor: Theme.of(context).scaffoldBackgroundColor,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: Theme.of(context).scaffoldBackgroundColor,
                padding: const EdgeInsets.all(40),
                child: Hero(
                  tag: 'prod_${product.id}',
                  child: Image.network(product.imageUrl!, fit: BoxFit.contain),
                ),
              ),
            ),
            actions: [
              _buildCartAction(context, state),
              const SizedBox(width: 8),
            ],
          ),
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildCategoryBadge(context, product.category),
                      if (product.isLowStock) _buildStockBadge(context, product.stockQuantity),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(product.name, 
                    style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(product.brand.toUpperCase(), 
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary, letterSpacing: 0.8)),
                  
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('PRICE', style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.outline)),
                          const SizedBox(height: 4),
                          Text('\$${product.price.toStringAsFixed(2)}', 
                            style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 34, fontWeight: FontWeight.w700, color: AppColors.primary)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(color: AppColors.accentAmber.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                        child: Row(
                          children: [
                            const Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 18),
                            const SizedBox(width: 4),
                            Text('4.8', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: AppColors.accentAmber, fontSize: 15)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const Padding(padding: EdgeInsets.symmetric(vertical: 32), child: Divider(height: 1)),

                  Text('Description', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 12),
                  Text(
                    product.description.isNotEmpty ? product.description : 'Premium care essential for your pet.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(height: 1.7, color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 15),
                  ),
                  
                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildHighlight(context, Icons.verified_user_rounded, 'Authentic'),
                      _buildHighlight(context, Icons.local_shipping_rounded, 'Fast Ship'),
                      _buildHighlight(context, Icons.replay_rounded, 'Easy Return'),
                    ],
                  ),
                  const SizedBox(height: 120),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(context, state),
    );
  }

  Widget _buildCartAction(BuildContext context, AppStateRepository state) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
      child: Container(
        margin: const EdgeInsets.all(8),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(Icons.shopping_bag_outlined, color: AppColors.primary),
            if (state.cartCount > 0)
              Positioned(
                top: 8,
                right: 0,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: AppColors.dangerRed, shape: BoxShape.circle),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, AppStateRepository state) {
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
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              HapticFeedback.heavyImpact();
              state.addToCart(product);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Added to basket! 🐾'),
                  backgroundColor: AppColors.primary,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              );
            },
            style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
            child: const Text('ADD TO BASKET', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryBadge(BuildContext context, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(label.toUpperCase(), 
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 10, letterSpacing: 0.5)),
    );
  }

  Widget _buildStockBadge(BuildContext context, int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: AppColors.dangerRed.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Text('ONLY $count LEFT', 
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: AppColors.dangerRed, fontWeight: FontWeight.w700, fontSize: 10, letterSpacing: 0.5)),
    );
  }

  Widget _buildHighlight(BuildContext context, IconData icon, String text) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 26),
        const SizedBox(height: 4),
        Text(text, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}
