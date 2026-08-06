import 'package:flutter/cupertino.dart';
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
import 'product_details_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  String _selectedCategory = 'All';
  final List<String> _categories = ['All', 'Food', 'Toys', 'Medicine', 'Grooming', 'Accessories'];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final products = state.products.where((p) {
      if (_selectedCategory == 'All') return true;
      return p.category.toLowerCase() == _selectedCategory.toLowerCase();
    }).toList();

    return GlassScaffold(
      floatingActionButton: _buildCartFab(context, state),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              final user = state.currentUser;
              if (user != null) await state.syncFromFirebase(user);
            },
          ),
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.primary,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary, AppColors.primaryDark],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 80,
                    left: 24,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Pet Shop', 
                          style: Theme.of(context).textTheme.displayLarge?.copyWith(color: Colors.white, fontSize: 34, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('Premium supplies for your companion', 
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white.withOpacity(0.8), fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(80),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: _buildSearchBar(context),
              ),
            ),
          ),

          // Interactive Category Chips
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text('CATEGORIES', style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: Theme.of(context).colorScheme.outline, fontSize: 10
                  )),
                ),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: _categories.map((cat) => _buildCategoryCard(cat)).toList(),
                  ),
                ),
                const SizedBox(height: 40),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text('Featured Products', 
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700, fontSize: 22)),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),

          // Modern Commerce Product Grid
          products.isEmpty
              ? const SliverToBoxAdapter(
                  child: Center(child: Padding(padding: EdgeInsets.all(40), child: Text('No products found.'))))
              : SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 0.7,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => FadeInUp(
                        delay: Duration(milliseconds: 100 * index),
                        child: _buildProductCard(context, products[index]),
                      ),
                      childCount: products.length,
                    ),
                  ),
                ),
          const SliverToBoxAdapter(child: SizedBox(height: 160)),
        ],
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return PremiumCard(
      opacity: 0.2,
      borderRadius: 16,
      child: TextField(
        style: TextStyle(color: Theme.of(context).colorScheme.onPrimary, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: 'Search products...',
          hintStyle: TextStyle(color: Theme.of(context).colorScheme.onPrimary.withOpacity(0.6)),
          prefixIcon: Icon(Icons.search_rounded, color: Theme.of(context).colorScheme.onPrimary, size: 22),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }

  Widget _buildCategoryCard(String category) {
    final isSelected = _selectedCategory == category;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: PremiumCard(
        onTap: () => setState(() => _selectedCategory = category),
        opacity: isSelected ? 0.4 : 0.1,
        borderRadius: 18,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          child: Text(
            category,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: isSelected ? AppColors.primary : Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, ProductModel product) {
    return PremiumCard(
      opacity: 0.15,
      borderRadius: 28,
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailsScreen(product: product))),
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Hero(
                        tag: 'prod_${product.id}',
                        child: Image.network(
                          product.imageUrl ?? 'https://via.placeholder.com/150',
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15, fontWeight: FontWeight.w700),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(product.brand ?? 'Pet Maya Select', 
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(color: Theme.of(context).colorScheme.outline, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '\$${product.price.toStringAsFixed(2)}',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.primary, fontSize: 18, fontWeight: FontWeight.w700),
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                          child: Icon(Icons.add_rounded, color: Theme.of(context).colorScheme.onPrimary, size: 18),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (product.stockQuantity < 10)
            Positioned(
              top: 18,
              left: 18,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.dangerRed.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.dangerRed.withOpacity(0.2)),
                ),
                child: const Text('LOW STOCK', style: TextStyle(color: AppColors.dangerRed, fontSize: 8, fontWeight: FontWeight.w700)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCartFab(BuildContext context, AppStateRepository state) {
    return AnimatedScale(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutBack,
      scale: state.cartCount > 0 ? 1.0 : 0.0,
      child: FloatingActionButton(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
        backgroundColor: AppColors.primary,
        elevation: 10,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 26),
            if (state.cartCount > 0)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.secondary, 
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: Text(
                    '${state.cartCount}',
                    style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
