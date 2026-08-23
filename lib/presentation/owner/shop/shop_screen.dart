import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
//
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/product_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/tail_wagging_loader.dart';
import 'cart_screen.dart';
import 'product_details_screen.dart';
import '../../common_widgets/skeleton_loader.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  String _selectedCategory = 'All';
  final List<String> _categories = ['All', 'Food', 'Toys', 'Medicine', 'Grooming', 'Accessories'];
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = "";

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    

    final products = state.products.where((p) {
      final matchesCategory = _selectedCategory == 'All' || p.category.toLowerCase() == _selectedCategory.toLowerCase();
      final matchesSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase()) || p.brand.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();

    return GlassScaffold(
      floatingActionButton: _buildCartFab(context, state),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          // ─── PREMIUM REFRESH ───────────────────────────────────────────
          CupertinoSliverRefreshControl(
            refreshIndicatorExtent: 100,
            refreshTriggerPullDistance: 140,
            builder: (context, refreshState, pulledExtent, refreshTriggerPullDistance, refreshIndicatorExtent) {
              return const TailWaggingLoader(size: 350, useBottomPosition: true);
            },
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              final user = state.currentUser;
              if (user != null) await state.syncFromFirebase(user);
            },
          ),

          // ─── HERO APP BAR ──────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            stretch: true,
            backgroundColor: AppColors.primary,
            systemOverlayStyle: SystemUiOverlayStyle.light,
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground, StretchMode.blurBackground],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  // Abstract Background
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
                    right: -50,
                    top: -20,
                    child: Opacity(
                      opacity: 0.1,
                      child: const Icon(Icons.shopping_bag_rounded, size: 320, color: Colors.white),
                    ),
                  ),
                  // Content
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        FadeInLeft(
                          duration: const Duration(milliseconds: 600),
                          child: Text('Pet Marketplace', 
                            style: GoogleFonts.plusJakartaSans(
                              color: Colors.white, 
                              fontSize: 34, 
                              fontWeight: FontWeight.w700, 
                              letterSpacing: -0.5
                            )),
                        ),
                        const SizedBox(height: 4),
                        FadeInLeft(
                          delay: const Duration(milliseconds: 200),
                          child: Text('Premium curated supplies for your companion', 
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7), 
                              fontWeight: FontWeight.w500, 
                              fontSize: 14,
                              letterSpacing: 0.2
                            )),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(80),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                child: _buildSearchBar(context),
              ),
            ),
          ),

          // ─── CATEGORY NAVIGATION ───────────────────────────────────────
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionLabel('SHOP BY CATEGORY'),
                      if (_selectedCategory != 'All')
                        GestureDetector(
                          onTap: () => setState(() => _selectedCategory = 'All'),
                          child: Text('CLEAR', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: _categories.map((cat) => _buildCategoryChip(cat)).toList(),
                  ),
                ),
                const SizedBox(height: 40),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: _buildSectionHeader('Curated Selection'),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),

          // ─── PRODUCT GRID ──────────────────────────────────────────────
          state.isLoading && products.isEmpty
              ? _buildSkeletonGrid()
              : products.isEmpty
                  ? _buildEmptyState()
                  : SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                      maxCrossAxisExtent: 220, // Responsive sizing for small/large screens
                      mainAxisSpacing: 16,
                      crossAxisSpacing: 16,
                      childAspectRatio: 0.72,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => FadeInUp(
                        duration: const Duration(milliseconds: 500),
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

  Widget _buildSectionLabel(String label) {
    return Text(label, style: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, color: Colors.grey, fontSize: 10));
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 24, letterSpacing: -0.2));
  }

  Widget _buildSearchBar(BuildContext context) {
    return PremiumCard(
      opacity: 0.95,
      borderRadius: 20,
      backgroundColor: Colors.white,
      child: TextField(
        controller: _searchController,
        onChanged: (val) => setState(() => _searchQuery = val),
        style: GoogleFonts.plusJakartaSans(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 15),
        decoration: InputDecoration(
          hintText: 'Search treats, toys, meds...',
          hintStyle: TextStyle(color: AppColors.primary.withValues(alpha: 0.4), fontWeight: FontWeight.w500),
          prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary, size: 22),
          suffixIcon: _searchQuery.isNotEmpty 
            ? IconButton(
                icon: const Icon(Icons.close_rounded, size: 18, color: AppColors.primary),
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchQuery = "");
                },
              )
            : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 18),
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String category) {
    final isSelected = _selectedCategory == category;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    

    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: PremiumCard(
        onTap: () {
          HapticFeedback.selectionClick();
          setState(() => _selectedCategory = category);
        },
        opacity: isSelected ? 0.4 : 0.08,
        borderRadius: 22,
        borderSide: isSelected ? BorderSide(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5) : null,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
          child: Text(
            category,
            style: TextStyle(
              color: isSelected ? AppColors.primary : (isDark ? Colors.white60 : Colors.black87),
              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
              fontSize: 12,
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
      opacity: 0.15,
      borderRadius: 28,
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProductDetailsScreen(product: product))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Container
          Expanded(
            child: Container(
              width: double.infinity,
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF8FCFF),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Positioned.fill(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(24),
                      child: Hero(
                        tag: 'prod_${product.id}',
                        child: CachedNetworkImage(
                          imageUrl: product.imageUrl ?? '',
                          fit: BoxFit.cover,
                          placeholder: (c, u) => const Center(child: CupertinoActivityIndicator()),
                          errorWidget: (c, u, e) => const Icon(Icons.shopping_bag_outlined, color: Colors.grey),
                        ),
                      ),
                    ),
                  ),
                  if (product.stockQuantity < 10)
                    Positioned(
                      top: 10, left: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.dangerRed.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text('LIMITED', style: GoogleFonts.plusJakartaSans(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                      ),
                    ),
                ],
              ),
            ),
          ),
          // Product Info
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: GoogleFonts.plusJakartaSans(fontSize: 15, fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(product.brand.toUpperCase(), 
                  style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w800, fontSize: 8, letterSpacing: 1)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('৳${product.price.toStringAsFixed(0)}',
                          style: GoogleFonts.plusJakartaSans(color: AppColors.primary, fontSize: 20, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    _buildAddButton(context, product),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddButton(BuildContext context, ProductModel product) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        context.read<AppStateRepository>().addToCart(product);
        context.read<AppStateRepository>().showToast('Added to basket! 🐾');
      },
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary, 
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))],
        ),
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _buildCartFab(BuildContext context, AppStateRepository state) {
    return AnimatedScale(
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutBack,
      scale: state.cartCount > 0 ? 1.0 : 0.0,
      child: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
        backgroundColor: AppColors.primary,
        elevation: 8,
        label: Text('VIEW BASKET', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1)),
        icon: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.shopping_bag_rounded, color: Colors.white, size: 20),
            Positioned(
              top: -8, right: -8,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: AppColors.accentAmber, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 1.5)),
                child: Text('${state.cartCount}', style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkeletonGrid() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      sliver: SliverGrid(
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 220,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          childAspectRatio: 0.7,
        ),
        delegate: SliverChildBuilderDelegate(
          (context, index) => const SkeletonLoader(width: double.infinity, height: double.infinity, borderRadius: 28),
          childCount: 6,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const SliverToBoxAdapter(
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(60),
          child: Opacity(
            opacity: 0.5,
            child: Column(
              children: [
                Icon(Icons.search_off_rounded, size: 60, color: Colors.grey),
                SizedBox(height: 16),
                Text('No products match your search.', style: TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}



