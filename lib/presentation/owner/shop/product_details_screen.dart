import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
//
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/product_model.dart';
import '../../common_widgets/glass_scaffold.dart';
//
import 'cart_screen.dart';

class ProductDetailsScreen extends StatelessWidget {
  final ProductModel product;

  const ProductDetailsScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5), // High contrast
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 1.5),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10)],
                  ),
                  child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
                ),
              ),
            ),
            systemOverlayStyle: SystemUiOverlayStyle.light, // Always white icons for premium look on hero image
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    child: Hero(
                      tag: 'prod_${product.id}',
                      child: Image.network(product.imageUrl!, fit: BoxFit.cover),
                    ),
                  ),
                  // Substantial top gradient to ensure status bar icons are always visible
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: const Alignment(0, -0.5),
                        colors: [
                          Colors.black.withValues(alpha: 0.6), // Darker for white images
                          Colors.black.withValues(alpha: 0.1),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              _buildCartAction(context, state),
            ],
          ),
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildCategoryBadge(context, product.category),
                      if (product.stockQuantity < 10) _buildStockBadge(context, product.stockQuantity),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(product.name,
                      style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                  const SizedBox(height: 8),
                  Text(product.brand.toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 1.5, fontSize: 10)),

                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('PRICE', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.grey[500], fontSize: 9, letterSpacing: 1)),
                          const SizedBox(height: 6),
                          Text('৳${product.price.toStringAsFixed(2)}',
                              style: const TextStyle(fontSize: 38, fontWeight: FontWeight.w900, color: AppColors.primary)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(color: AppColors.accentAmber.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                        child: const Row(
                          children: [
                            Icon(Icons.star_rounded, color: AppColors.accentAmber, size: 20),
                            SizedBox(width: 6),
                            Text('4.8', style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.accentAmber, fontSize: 16)),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const Padding(padding: EdgeInsets.symmetric(vertical: 32), child: Divider(height: 1)),

                  const Text('Product Description', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                  const SizedBox(height: 12),
                  Text(
                    product.description.isNotEmpty ? product.description : 'Premium care essential for your pet, crafted with high-quality ingredients for optimal wellness.',
                    style: TextStyle(height: 1.7, color: isDark ? Colors.white70 : Colors.black87, fontSize: 15, fontWeight: FontWeight.w500),
                  ),

                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildHighlight(context, Icons.verified_user_rounded, 'Certified'),
                      _buildHighlight(context, Icons.local_shipping_rounded, 'Express'),
                      _buildHighlight(context, Icons.replay_rounded, '7 Day Return'),
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
      onTap: () {
        HapticFeedback.lightImpact();
        Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
      },
      child: Container(
        margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOutCubic,
              padding: EdgeInsets.symmetric(
                  horizontal: state.cartCount > 0 ? 12 : 10,
                  vertical: 8
              ),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3), // Sleek translucent dark base
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                    color: Colors.white.withValues(alpha: 0.25),
                    width: 1.2
                ),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 12,
                      offset: const Offset(0, 4)
                  )
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                      Icons.shopping_bag_outlined,
                      color: Colors.white,
                      size: 22
                  ),
                  if (state.cartCount > 0) ...[
                    const SizedBox(width: 8),
                    FadeInRight(
                      duration: const Duration(milliseconds: 350),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.accentAmber, Color(0xFFFFB300)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.accentAmber.withValues(alpha: 0.4),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            )
                          ],
                        ),
                        child: ElasticIn(
                          duration: const Duration(milliseconds: 500),
                          child: Text(
                            '${state.cartCount}',
                            style: const TextStyle(
                              color: Colors.black87,
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ]
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, AppStateRepository state) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 40),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 40, offset: const Offset(0, -10))],
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
                  content: const Text('Added to your basket! 🐾', style: TextStyle(fontWeight: FontWeight.w800)),
                  backgroundColor: AppColors.primary,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1AB680),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            child: const Text('ADD TO BASKET', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1, fontSize: 13)),
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryBadge(BuildContext context, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text(label.toUpperCase(),
          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
    );
  }

  Widget _buildStockBadge(BuildContext context, int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: AppColors.dangerRed.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
      child: Text('ONLY $count LEFT',
          style: const TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
    );
  }

  Widget _buildHighlight(BuildContext context, IconData icon, String text) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.05), shape: BoxShape.circle),
          child: Icon(icon, color: AppColors.primary, size: 24),
        ),
        const SizedBox(height: 8),
        Text(text, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.grey)),
      ],
    );
  }
}
