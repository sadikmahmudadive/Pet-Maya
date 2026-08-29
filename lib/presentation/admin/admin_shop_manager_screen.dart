import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/product_model.dart';
import '../../../core/services/firebase_storage_service.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';
import '../common_widgets/lottie_upload_icon.dart';
import '../../data/models/coupon_model.dart';
import '../../data/models/promo_model.dart';
import '../../presentation/common_widgets/premium_toast.dart';

class AdminShopManagerScreen extends StatefulWidget {
  const AdminShopManagerScreen({super.key});

  @override
  State<AdminShopManagerScreen> createState() => _AdminShopManagerScreenState();
}

class _AdminShopManagerScreenState extends State<AdminShopManagerScreen> {
  String _searchQuery = '';
  String _filterCategory = 'ALL';
  final List<String> _categories = ['ALL', 'Food', 'Toys', 'Health', 'Gear', 'Grooming'];

  @override
  Widget build(BuildContext context) {
    final products = context.watch<AppStateRepository>().products;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = products.where((p) {
      final matchesSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesCat = _filterCategory == 'ALL' || p.category == _filterCategory;
      return matchesSearch && matchesCat;
    }).toList();

    // Stats for e-commerce overview
    final totalValue = products.fold(0.0, (sum, p) => sum + (p.price * p.stockQuantity));
    final lowStockCount = products.where((p) => p.stockQuantity < 5).length;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Inventory Command', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.campaign_rounded, color: AppColors.primary),
            onPressed: () => _showPromoManager(context),
            tooltip: 'Global Promo',
          ),
          IconButton(
            icon: const Icon(Icons.confirmation_number_rounded, color: AppColors.primary),
            onPressed: () => _showCouponManager(context),
            tooltip: 'Manage Coupons',
          ),
          _buildAddButton(context),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          
          // ─── E-COMMERCE INTELLIGENCE DOCK ─────────────────────────────────
          _buildStatsHeader(totalValue, products.length, lowStockCount),
          
          const SizedBox(height: 24),

          // ─── SEARCH & FILTER DOCK ─────────────────────────────────────────
          _buildControlPanel(isDark),

          const SizedBox(height: 16),

          // ─── PRODUCT INVENTORY LIST ───────────────────────────────────────
          Expanded(
            child: filtered.isEmpty
                ? const EmptyState(
                    icon: Icons.inventory_2_rounded, 
                    title: 'No inventory matched', 
                    message: 'Try adjusting your filters or add a new SKU.')
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) => _buildProductProfessionalTile(filtered[index]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsHeader(double totalValue, int skuCount, int lowStock) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _statItem('VALUATION', '৳${totalValue.toStringAsFixed(0)}', AppColors.healthGreen),
          const SizedBox(width: 8),
          _statItem('TOTAL SKU', '$skuCount', AppColors.primary),
          const SizedBox(width: 8),
          _statItem('LOW STOCK', '$lowStock', AppColors.dangerRed),
        ],
      ),
    );
  }

  Widget _statItem(String label, String value, Color color) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: PremiumCard(
        opacity: 0.15,
        borderRadius: 20,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 4),
          child: Column(
            children: [
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(label, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey[500], letterSpacing: 1)),
              ),
              const SizedBox(height: 4),
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildControlPanel(bool isDark) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: PremiumCard(
            opacity: 0.1,
            borderRadius: 20,
            child: TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              style: const TextStyle(fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                hintText: 'Search SKU, Brand or Name...',
                hintStyle: TextStyle(color: Colors.grey[500], fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 18),
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: _categories.map((c) => _filterChip(c)).toList(),
          ),
        ),
      ],
    );
  }

  Widget _filterChip(String cat) {
    final isSelected = _filterCategory == cat;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => setState(() => _filterCategory = cat),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? AppColors.primary : Colors.grey.withValues(alpha: 0.3)),
          ),
          child: Text(cat, style: TextStyle(
            fontSize: 11, 
            fontWeight: FontWeight.w800, 
            color: isSelected ? Colors.white : Colors.grey[500])),
        ),
      ),
    );
  }

  Widget _buildProductProfessionalTile(ProductModel p) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isLowStock = p.stockQuantity < 5;

    return FadeInUp(
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: PremiumCard(
          opacity: 0.2,
          borderRadius: 24,
          onTap: () => _showProfessionalEditModal(context, product: p),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                // Product Visual
                Stack(
                  children: [
                    Container(
                      width: 80, height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: Colors.white,
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: CachedNetworkImage(
                          imageUrl: p.imageUrl ?? '',
                          fit: BoxFit.cover,
                          errorWidget: (c, u, e) => const Icon(Icons.inventory_2_rounded, color: Colors.grey),
                        ),
                      ),
                    ),
                    if (isLowStock)
                      Positioned(
                        top: 4, left: 4,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(color: AppColors.dangerRed, shape: BoxShape.circle),
                          child: const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 10),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 16),
                // Data
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.brand?.toUpperCase() ?? 'GENERIC', 
                        style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 1)),
                      Text(p.name, 
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 15)),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          _badge('৳${p.price.toStringAsFixed(0)}', AppColors.healthGreen),
                          _badge('STOCK: ${p.stockQuantity}', isLowStock ? AppColors.dangerRed : Colors.blueGrey),
                          if (p.isRxRequired)
                            _badge('Rx', AppColors.primary),
                        ],
                      ),
                    ],
                  ),
                ),
                // Actions
                Column(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.more_vert_rounded, color: Colors.grey),
                      onPressed: () => _showQuickActions(p),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 9)),
    );
  }

  void _showQuickActions(ProductModel p) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => CupertinoActionSheet(
        title: Text('Manage ${p.name}'),
        actions: [
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(ctx);
              _showProfessionalEditModal(context, product: p);
            },
            child: const Text('Edit Product Details'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(ctx);
              _quickStockUpdate(p);
            },
            child: const Text('Quick Stock Update'),
          ),
          CupertinoActionSheetAction(
            isDestructiveAction: true,
            onPressed: () {
              Navigator.pop(ctx);
              _confirmDelete(p);
            },
            child: const Text('Delete from Inventory'),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
      ),
    );
  }

  void _quickStockUpdate(ProductModel p) {
    final controller = TextEditingController(text: p.stockQuantity.toString());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: const Text('Update Stock'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'New Stock Quantity'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () {
              final newStock = int.tryParse(controller.text) ?? p.stockQuantity;
              context.read<AppStateRepository>().updateProductStock(p.id, newStock);
              Navigator.pop(ctx);
            },
            child: const Text('UPDATE'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(ProductModel p) {
     showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: const Text('Delete Product?'),
        content: Text('Are you sure you want to remove ${p.name} from the store? This action is permanent.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.dangerRed),
            onPressed: () {
              context.read<AppStateRepository>().deleteProduct(p.id);
              Navigator.pop(ctx);
            },
            child: const Text('DELETE', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildAddButton(BuildContext context) {
    return GestureDetector(
      onTap: () => _showProfessionalEditModal(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: const Row(
          children: [
            Icon(Icons.add_rounded, color: Colors.white, size: 18),
            SizedBox(width: 4),
            Text('ADD SKU', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  void _showPromoManager(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _PromoManagerSheet(),
    );
  }

  void _showCouponManager(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _CouponManagerSheet(),
    );
  }

  void _showProfessionalEditModal(BuildContext context, {ProductModel? product}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ProductEditorSheet(product: product),
    );
  }
}

class _PromoManagerSheet extends StatefulWidget {
  const _PromoManagerSheet();

  @override
  State<_PromoManagerSheet> createState() => _PromoManagerSheetState();
}

class _PromoManagerSheetState extends State<_PromoManagerSheet> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _headerController = TextEditingController();
  final TextEditingController _footerController = TextEditingController();
  final TextEditingController _discountController = TextEditingController();
  PromoModel? _editingPromo;

  @override
  void initState() {
    super.initState();
    // Manual refresh when opening the sheet to ensure latest data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppStateRepository>().refreshPromos();
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _headerController.dispose();
    _footerController.dispose();
    _discountController.dispose();
    super.dispose();
  }

  void _savePromo() async {
    if (_nameController.text.isEmpty || _discountController.text.isEmpty) return;

    final state = context.read<AppStateRepository>();
    final promo = PromoModel(
      id: _editingPromo?.id ?? 'promo_${DateTime.now().millisecondsSinceEpoch}',
      name: _nameController.text.trim(),
      header: _headerController.text.trim(),
      footer: _footerController.text.trim(),
      discountPercent: int.tryParse(_discountController.text) ?? 0,
      isActive: _editingPromo?.isActive ?? true,
      timestamp: _editingPromo?.timestamp ?? DateTime.now().millisecondsSinceEpoch,
    );

    await state.savePromo(promo);
    _clearFields();
    state.showToast(_editingPromo == null ? 'Campaign created! 🎁' : 'Campaign updated! ✨');
  }

  void _clearFields() {
    setState(() {
      _editingPromo = null;
      _nameController.clear();
      _headerController.clear();
      _footerController.clear();
      _discountController.clear();
    });
  }

  void _editPromo(PromoModel p) {
    setState(() {
      _editingPromo = p;
      _nameController.text = p.name;
      _headerController.text = p.header;
      _footerController.text = p.footer;
      _discountController.text = p.discountPercent.toString();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final promos = state.promos;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('PROMO COMMAND', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w900, fontSize: 16)),
              IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const Divider(height: 32),
          
          // Form Section
          PremiumCard(
            opacity: 0.1,
            borderRadius: 20,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _input('CAMPAIGN NAME', _nameController, hint: 'e.g. Eid Special'),
                  const SizedBox(height: 12),
                  _input('HEADER TEXT', _headerController, hint: 'e.g. Save up to'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _input('DISCOUNT (%)', _discountController, keyboardType: TextInputType.number)),
                      const SizedBox(width: 12),
                      Expanded(child: _input('FOOTER TEXT', _footerController, hint: 'e.g. off for you')),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      if (_editingPromo != null)
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _clearFields,
                            child: const Text('CANCEL'),
                          ),
                        ),
                      if (_editingPromo != null) const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _savePromo,
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                          child: Text(_editingPromo == null ? 'CREATE CAMPAIGN' : 'UPDATE CAMPAIGN', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),
          Text('CAMPAIGN HISTORY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey[500], letterSpacing: 1)),
          const SizedBox(height: 12),
          
          Expanded(
            child: promos.isEmpty
              ? const Center(child: Text('No promo campaigns created yet.'))
              : ListView.builder(
                  itemCount: promos.length,
                  itemBuilder: (context, index) {
                    final p = promos[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: PremiumCard(
                        opacity: 0.15,
                        borderRadius: 20,
                        onTap: () => _editPromo(p),
                        child: ListTile(
                          title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
                          subtitle: Text(
                            '${p.header} ${p.discountPercent}% ${p.footer}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Switch(
                                value: p.isActive,
                                activeColor: AppColors.primary,
                                onChanged: (val) async {
                                  await state.savePromo(p.copyWith(isActive: val));
                                },
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed),
                                onPressed: () => state.deletePromo(p.id),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }

  Widget _input(String label, TextEditingController controller, {String? hint, TextInputType? keyboardType}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey)),
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12)),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            decoration: InputDecoration(
              hintText: hint,
              border: InputBorder.none, 
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)
            ),
          ),
        ),
      ],
    );
  }
}

class _CouponManagerSheet extends StatefulWidget {
  const _CouponManagerSheet();

  @override
  State<_CouponManagerSheet> createState() => _CouponManagerSheetState();
}

class _CouponManagerSheetState extends State<_CouponManagerSheet> {
  final TextEditingController _codeController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _minAmountController = TextEditingController();
  bool _isPercentage = true;
  int _daysValid = 30;

  @override
  void dispose() {
    _codeController.dispose();
    _amountController.dispose();
    _minAmountController.dispose();
    super.dispose();
  }

  void _addCoupon() async {
    if (_codeController.text.isEmpty || _amountController.text.isEmpty) return;
    
    final state = context.read<AppStateRepository>();
    final coupon = CouponModel(
      code: _codeController.text.trim().toUpperCase(),
      discountAmount: double.tryParse(_amountController.text) ?? 0.0,
      isPercentage: _isPercentage,
      minOrderAmount: double.tryParse(_minAmountController.text) ?? 0.0,
      expiryTimestamp: DateTime.now().add(Duration(days: _daysValid)).millisecondsSinceEpoch,
    );

    await state.addCoupon(coupon);
    _codeController.clear();
    _amountController.clear();
    _minAmountController.clear();
    state.showToast('Coupon added! 🎟️');
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final coupons = state.coupons;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('COUPON COMMAND', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w900, fontSize: 16)),
              IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const Divider(height: 32),
          
          // Add Coupon Section
          PremiumCard(
            opacity: 0.1,
            borderRadius: 20,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(child: _input('CODE', _codeController)),
                      const SizedBox(width: 12),
                      Expanded(child: _input('AMOUNT', _amountController, keyboardType: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _input('MIN ORDER', _minAmountController, keyboardType: TextInputType.number)),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('TYPE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey)),
                          Row(
                            children: [
                              const Text('%', style: TextStyle(fontWeight: FontWeight.bold)),
                              Switch(value: !_isPercentage, onChanged: (v) => setState(() => _isPercentage = !v)),
                              const Text('৳', style: TextStyle(fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _addCoupon,
                      child: const Text('CREATE COUPON', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),
          Text('ACTIVE COUPONS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey[500], letterSpacing: 1)),
          const SizedBox(height: 12),
          
          Expanded(
            child: coupons.isEmpty
              ? const Center(child: Text('No active coupons found.'))
              : ListView.builder(
                  itemCount: coupons.length,
                  itemBuilder: (context, index) {
                    final c = coupons[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: PremiumCard(
                        opacity: 0.15,
                        borderRadius: 16,
                        child: ListTile(
                          title: Text(c.code, style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
                          subtitle: Text(
                            '${c.isPercentage ? "${c.discountAmount}%" : "৳${c.discountAmount}"} off • Min ৳${c.minOrderAmount}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                          trailing: IconButton(
                            icon: const Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed),
                            onPressed: () => state.deleteCoupon(c.code),
                          ),
                        ),
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }

  Widget _input(String label, TextEditingController controller, {TextInputType? keyboardType}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey)),
        const SizedBox(height: 4),
        Container(
          decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(12)),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            decoration: const InputDecoration(border: InputBorder.none, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
          ),
        ),
      ],
    );
  }
}

class _ProductEditorSheet extends StatefulWidget {
  final ProductModel? product;
  const _ProductEditorSheet({this.product});

  @override
  State<_ProductEditorSheet> createState() => _ProductEditorSheetState();
}

class _ProductEditorSheetState extends State<_ProductEditorSheet> {
  late TextEditingController _nameController;
  late TextEditingController _priceController;
  late TextEditingController _oldPriceController;
  late TextEditingController _stockController;
  late TextEditingController _brandController;
  late TextEditingController _descController;
  String _category = 'Food';
  final List<String> _imageGallery = [];
  bool _isUploading = false;
  bool _isSaving = false;
  bool _isRxRequired = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.product?.name ?? '');
    _priceController = TextEditingController(text: widget.product?.price.toString() ?? '');
    _oldPriceController = TextEditingController(text: widget.product?.oldPrice?.toString() ?? '');
    _stockController = TextEditingController(text: widget.product?.stockQuantity.toString() ?? '');
    _brandController = TextEditingController(text: widget.product?.brand ?? '');
    _descController = TextEditingController(text: widget.product?.description ?? '');
    _category = widget.product?.category ?? 'Food';
    _isRxRequired = widget.product?.isRxRequired ?? false;
    if (widget.product != null) {
      _imageGallery.addAll(widget.product!.imageGallery);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null) {
      setState(() => _isUploading = true);
      final url = await FirebaseStorageService().uploadImage(File(picked.path), 'shop_products');
      if (url != null) {
        setState(() {
          _imageGallery.add(url);
          _isUploading = false;
        });
      } else {
        setState(() => _isUploading = false);
      }
    }
  }

  void _removeImage(int index) {
    setState(() => _imageGallery.removeAt(index));
  }

  void _save() async {
    if (_nameController.text.isEmpty || _priceController.text.isEmpty) return;
    setState(() => _isSaving = true);
    
    final p = ProductModel(
      id: widget.product?.id ?? 'sku_${DateTime.now().millisecondsSinceEpoch}',
      shopId: widget.product?.shopId ?? 'main_store',
      name: _nameController.text,
      category: _category,
      price: double.tryParse(_priceController.text) ?? 0.0,
      oldPrice: double.tryParse(_oldPriceController.text),
      stockQuantity: int.tryParse(_stockController.text) ?? 0,
      imageGallery: _imageGallery.isNotEmpty ? _imageGallery : ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400'],
      description: _descController.text,
      brand: _brandController.text,
      isRxRequired: _isRxRequired,
    );

    if (widget.product == null) {
      await context.read<AppStateRepository>().addProduct(p);
    } else {
      await context.read<AppStateRepository>().updateProduct(p);
    }
    
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(36)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(widget.product == null ? 'NEW CATALOG ENTRY' : 'EDIT SKU DETAILS', 
                style: TextStyle(
                  fontSize: 16, 
                  fontWeight: FontWeight.w900, 
                  letterSpacing: 1,
                  color: isDark ? Colors.white : Colors.black87
                )),
              IconButton(
                icon: Icon(Icons.close_rounded, color: isDark ? Colors.white70 : Colors.black54), 
                onPressed: () => Navigator.pop(context)
              ),
            ],
          ),
          const Divider(height: 32),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image Gallery Manager
                  Text('PRODUCT GALLERY', 
                    style: TextStyle(
                      fontSize: 9, 
                      fontWeight: FontWeight.w900, 
                      color: isDark ? Colors.white38 : Colors.grey, 
                      letterSpacing: 1
                    )),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 120,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      itemCount: _imageGallery.length + 1,
                      itemBuilder: (context, index) {
                        if (index == _imageGallery.length) {
                          return _buildAddImageCard(isDark);
                        }
                        return _buildGalleryItem(_imageGallery[index], index, isDark);
                      },
                    ),
                  ),
                  const SizedBox(height: 32),
                  _input('PRODUCT NAME', _nameController),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(child: _input('LIST PRICE (৳)', _priceController, keyboardType: TextInputType.number)),
                      const SizedBox(width: 16),
                      Expanded(child: _input('OLD PRICE (৳)', _oldPriceController, keyboardType: TextInputType.number)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _input('CURRENT STOCK', _stockController, keyboardType: TextInputType.number),
                  const SizedBox(height: 20),
                  _input('BRAND / MANUFACTURER', _brandController),
                  const SizedBox(height: 20),
                  Text('CATEGORY', 
                    style: TextStyle(
                      fontSize: 9, 
                      fontWeight: FontWeight.w900, 
                      color: isDark ? Colors.white38 : Colors.grey, 
                      letterSpacing: 1
                    )),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: ['Food', 'Toys', 'Health', 'Gear', 'Grooming'].map((c) => ChoiceChip(
                      label: Text(c, style: TextStyle(
                        fontSize: 11, 
                        fontWeight: FontWeight.w800, 
                        color: _category == c ? Colors.white : (isDark ? Colors.white70 : Colors.black87)
                      )),
                      selected: _category == c,
                      selectedColor: AppColors.primary,
                      backgroundColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
                      onSelected: (val) => setState(() => _category = c),
                    )).toList(),
                  ),
                  const SizedBox(height: 24),
                  
                  // Rx Required Toggle
                  _buildToggleTile(
                    label: 'Rx REQUIRED (VETERINARY MEDICINE)',
                    value: _isRxRequired,
                    onChanged: (v) => setState(() => _isRxRequired = v),
                  ),
                  const SizedBox(height: 24),

                  _input('MARKETING DESCRIPTION', _descController, maxLines: 4),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            height: 64,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              ),
              child: _isSaving 
                ? const CupertinoActivityIndicator(color: Colors.white)
                : const Text('FINALIZE SKU', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddImageCard(bool isDark) {
    return GestureDetector(
      onTap: _isUploading ? null : _pickImage,
      child: Container(
        width: 100,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), width: 2, style: BorderStyle.solid),
        ),
        child: Center(
          child: _isUploading 
            ? const CupertinoActivityIndicator()
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const LottieUploadIcon(size: 34),
                  const SizedBox(height: 2),
                  Text('ADD', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.primary)),
                ],
              ),
        ),
      ),
    );
  }

  Widget _buildGalleryItem(String url, int index, bool isDark) {
    return Stack(
      children: [
        Container(
          width: 100,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            image: DecorationImage(image: CachedNetworkImageProvider(url), fit: BoxFit.cover),
          ),
        ),
        Positioned(
          top: 4, right: 16,
          child: GestureDetector(
            onTap: () => _removeImage(index),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
              child: const Icon(Icons.close_rounded, color: Colors.white, size: 14),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildToggleTile({required String label, required bool value, required ValueChanged<bool> onChanged}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
          CupertinoSwitch(
            value: value,
            activeColor: AppColors.primary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _input(String label, TextEditingController controller, {TextInputType? keyboardType, int maxLines = 1}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, 
          style: TextStyle(
            fontSize: 9, 
            fontWeight: FontWeight.w900, 
            color: isDark ? Colors.white38 : Colors.grey, 
            letterSpacing: 1
          )),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05), 
            borderRadius: BorderRadius.circular(18)
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            maxLines: maxLines,
            style: TextStyle(
              fontWeight: FontWeight.w700, 
              fontSize: 14,
              color: isDark ? Colors.white : Colors.black87
            ),
            decoration: const InputDecoration(
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(vertical: 18, horizontal: 20),
              filled: false, // Prevents secondary background from global theme
            ),
          ),
        ),
      ],
    );
  }
}
