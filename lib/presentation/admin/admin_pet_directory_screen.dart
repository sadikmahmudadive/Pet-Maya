import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/pet_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';

class AdminPetDirectoryScreen extends StatefulWidget {
  const AdminPetDirectoryScreen({super.key});

  @override
  State<AdminPetDirectoryScreen> createState() => _AdminPetDirectoryScreenState();
}

class _AdminPetDirectoryScreenState extends State<AdminPetDirectoryScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final pets = context.watch<AppStateRepository>().pets;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final filtered = pets.where((p) {
      final query = _searchQuery.toLowerCase();
      return p.name.toLowerCase().contains(query) || p.breed.toLowerCase().contains(query);
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Global Pet Directory', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: PremiumCard(
              opacity: 0.15,
              borderRadius: 20,
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                decoration: InputDecoration(
                  hintText: 'Search pets by name or breed...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 18),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: filtered.isEmpty
                ? const EmptyState(icon: Icons.pets_outlined, title: 'No pets found', message: 'Check back as users register their pets.')
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final pet = filtered[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 30 * index),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: PremiumCard(
                            opacity: 0.15,
                            borderRadius: 24,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    radius: 30,
                                    backgroundImage: pet.photoUrl != null ? NetworkImage(pet.photoUrl!) : null,
                                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                    child: pet.photoUrl == null ? const Icon(Icons.pets, color: AppColors.primary) : null,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(pet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800)),
                                        Text('${pet.breed} • ${pet.age} old', 
                                          style: TextStyle(fontSize: 12, color: Colors.grey[500], fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text('HEALTH INDEX', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: Colors.grey[400])),
                                      const SizedBox(height: 4),
                                      Text('${pet.healthIndex}%', 
                                        style: TextStyle(fontWeight: FontWeight.w900, color: _getHealthColor(pet.healthIndex), fontSize: 16)),
                                    ],
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

  Color _getHealthColor(int index) {
    if (index > 80) return AppColors.healthGreen;
    if (index > 50) return AppColors.accentAmber;
    return AppColors.dangerRed;
  }
}
