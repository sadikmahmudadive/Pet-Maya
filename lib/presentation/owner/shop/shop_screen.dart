import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/product_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
            expandedHeight: 220,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF006684),
            elevation: 0,
            systemOverlayStyle: SystemUiOverlayStyle.light,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF006684), Color(0xFF004D63)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                  Positioned(
                    right: -40,
                    top: -20,
                    child: Icon(Icons.shopping_bag_rounded, size: 280, color: Colors.white.withOpacity(0.05)),
                  ),
                  Positioned(
                    bottom: 80,
                    left: 24,
                    child: FadeInLeft(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Pet Marketplace', 
                            style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                          const SizedBox(height: 4),
                          Text('Premium supplies for your companion', 
                            style: TextStyle(color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.w600, fontSize: 14)),
                        ],
                      ),
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

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text('CATEGORIES', style: TextStyle(
                    fontWeight: FontWeight.w900, letterSpacing: 1.5, color: isDark ? Colors.white38 : Colors.grey[500], fontSize: 10
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
                    style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w800, fontSize: 22)),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),

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
                      childAspectRatio: 0.72,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => FadeInUp(
                        delay: Duration(milliseconds: 50 * index),
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
      opacity: 0.15,
      borderRadius: 16,
      backgroundColor: Colors.white,
      child: TextField(
        style: const TextStyle(color: Color(0xFF006684), fontWeight: FontWeight.w700),
        decoration: InputDecoration(
          hintText: 'Search premium treats...',
          hintStyle: TextStyle(color: const Color(0xFF006684).withOpacity(0.5), fontWeight: FontWeight.w600),
          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF006684), size: 22),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _buildCategoryCard(String category) {
    final isSelected = _selectedCategory == category;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: PremiumCard(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _selectedCategory = category);
        },
        opacity: isSelected ? 0.3 : 0.05,
        borderRadius: 18,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          child: Text(
            category,
            style: TextStyle(
              color: isSelected ? AppColors.primary : (isDark ? Colors.white60 : Colors.black54),
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
              fontSize: 11,
              letterSpacing: 0.5,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductCard(BuildContext context, ProductModel product) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PremiumCard(
      opacity: 0.2,
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
                    color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF3F9FF),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
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
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(product.brand.toUpperCase(), 
                      style: TextStyle(color: Colors.grey[500], fontWeight: FontWeight.w800, fontSize: 8, letterSpacing: 0.5)),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '\$${product.price.toStringAsFixed(0)}',
                          style: const TextStyle(color: AppColors.primary, fontSize: 18, fontWeight: FontWeight.w900),
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(color: Color(0xFF006684), shape: BoxShape.circle),
                          child: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
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
                ),
                child: const Text('LOW STOCK', style: TextStyle(color: AppColors.dangerRed, fontSize: 7, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
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
        backgroundColor: const Color(0xFF006684),
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
                    color: AppColors.accentAmber, 
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
