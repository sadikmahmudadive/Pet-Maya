import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/vet_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';

class AdminServicePricingScreen extends StatefulWidget {
  const AdminServicePricingScreen({super.key});

  @override
  State<AdminServicePricingScreen> createState() => _AdminServicePricingScreenState();
}

class _AdminServicePricingScreenState extends State<AdminServicePricingScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final vets = state.vets;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filteredVets = vets.where((vet) {
      return vet.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
             vet.tag.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Service Pricing', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: PremiumCard(
              opacity: 0.1,
              borderRadius: 20,
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  hintText: 'Search provider name...',
                  hintStyle: TextStyle(color: isDark ? Colors.white24 : Colors.grey),
                  prefixIcon: Icon(Icons.search_rounded, color: isDark ? Colors.white54 : Colors.grey),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 18),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          
          Expanded(
            child: filteredVets.isEmpty
                ? const EmptyState(
                    icon: Icons.payments_outlined,
                    title: 'No providers found',
                    message: 'Register service providers to manage their pricing.',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filteredVets.length,
                    itemBuilder: (context, index) {
                      final vet = filteredVets[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 30 * index),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: PremiumCard(
                            opacity: 0.15,
                            borderRadius: 24,
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 28,
                                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                    backgroundImage: vet.photoUrl != null ? NetworkImage(vet.photoUrl!) : null,
                                    child: vet.photoUrl == null ? const Icon(Icons.person, color: AppColors.primary) : null,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(vet.name, 
                                          maxLines: 1, overflow: TextOverflow.ellipsis,
                                          style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 14)),
                                        Text(vet.tag.toUpperCase(), 
                                          maxLines: 1, overflow: TextOverflow.ellipsis,
                                          style: TextStyle(fontSize: 9, color: Colors.grey[500], fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  GestureDetector(
                                    onTap: () => _showPriceEditModal(context, state, vet),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppColors.healthGreen.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: AppColors.healthGreen.withValues(alpha: 0.2)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Flexible(
                                            child: Text(vet.price, 
                                              maxLines: 1, overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(color: AppColors.healthGreen, fontWeight: FontWeight.w900, fontSize: 12)),
                                          ),
                                          const SizedBox(width: 4),
                                          const Icon(Icons.edit_rounded, color: AppColors.healthGreen, size: 12),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
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

  void _showPriceEditModal(BuildContext context, AppStateRepository state, VetModel vet) {
    final controller = TextEditingController(text: vet.price);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.only(top: 24, left: 24, right: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 32),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)))),
            const SizedBox(height: 24),
            Text('Set Visit Price', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            Text('Update official pricing for ${vet.name}', style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
            const SizedBox(height: 32),
            
            _buildInputLabel('VISIT PRICE VALUE'),
            Container(
              decoration: BoxDecoration(
                color: Theme.of(context).brightness == Brightness.dark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: controller,
                autofocus: true,
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                decoration: const InputDecoration(
                  hintText: 'e.g. ৳35/visit',
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                ),
              ),
            ),
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              height: 64,
              child: ElevatedButton(
                onPressed: () {
                  final newPrice = controller.text.trim();
                  if (newPrice.isNotEmpty) {
                    state.updateVetPrice(vet.id, newPrice);
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Price updated to $newPrice for ${vet.name}! 💰'), backgroundColor: AppColors.healthGreen, behavior: SnackBarBehavior.floating),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                ),
                child: const Text('UPDATE PRICING', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
    );
  }
}
