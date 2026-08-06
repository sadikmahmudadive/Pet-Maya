import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/user_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';

class AdminUserListScreen extends StatefulWidget {
  const AdminUserListScreen({super.key});

  @override
  State<AdminUserListScreen> createState() => _AdminUserListScreenState();
}

class _AdminUserListScreenState extends State<AdminUserListScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final allUsers = context.select((AppStateRepository repo) => repo.allUsers);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    final filteredUsers = allUsers.where((user) {
      final query = _searchQuery.toLowerCase();
      return user.name.toLowerCase().contains(query) || 
             user.email.toLowerCase().contains(query) ||
             user.role.displayName.toLowerCase().contains(query);
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('User Directory', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          // Premium Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: PremiumCard(
              opacity: 0.2,
              borderRadius: 20,
              child: TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                decoration: InputDecoration(
                  hintText: 'Search name, email or role...',
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
            child: filteredUsers.isEmpty
                ? const EmptyState(
                    icon: Icons.people_outline_rounded,
                    title: 'No users found',
                    message: 'No users match your search criteria.',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: filteredUsers.length,
                    itemBuilder: (context, index) {
                      final user = filteredUsers[index];
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
                                    radius: 26,
                                    backgroundColor: _getRoleColor(user.role).withOpacity(0.1),
                                    child: Icon(_getRoleIcon(user.role), color: _getRoleColor(user.role), size: 22),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(user.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800)),
                                        const SizedBox(height: 2),
                                        Text(user.email, style: TextStyle(fontSize: 12, color: Colors.grey[500], fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: _getRoleColor(user.role).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                        child: Text(user.role.displayName.toUpperCase(), 
                                          style: TextStyle(color: _getRoleColor(user.role), fontWeight: FontWeight.w900, fontSize: 8)),
                                      ),
                                      const SizedBox(height: 8),
                                      if (user.isVerified)
                                        const Icon(Icons.verified_rounded, color: AppColors.healthGreen, size: 16)
                                      else
                                        const Icon(Icons.hourglass_empty_rounded, color: AppColors.accentAmber, size: 16),
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

  Color _getRoleColor(UserRole role) {
    switch (role) {
      case UserRole.admin: return AppColors.dangerRed;
      case UserRole.veterinarian: return AppColors.primary;
      case UserRole.petShop: return AppColors.accentAmber;
      default: return AppColors.healthGreen;
    }
  }

  IconData _getRoleIcon(UserRole role) {
    switch (role) {
      case UserRole.admin: return Icons.admin_panel_settings_rounded;
      case UserRole.veterinarian: return Icons.medical_services_rounded;
      case UserRole.petShop: return Icons.storefront_rounded;
      default: return Icons.person_rounded;
    }
  }
}
