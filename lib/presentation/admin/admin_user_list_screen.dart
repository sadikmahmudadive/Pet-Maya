import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/user_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

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
    
    final filteredUsers = allUsers.where((user) {
      final query = _searchQuery.toLowerCase();
      return user.name.toLowerCase().contains(query) || 
             user.email.toLowerCase().contains(query) ||
             user.role.displayName.toLowerCase().contains(query);
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 100, 20, 20),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: InputDecoration(
                hintText: 'Search by name, email or role...',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: Colors.white.withOpacity(0.4),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: filteredUsers.length,
              itemBuilder: (context, index) {
                final user = filteredUsers[index];
                return FadeInUp(
                  delay: Duration(milliseconds: 50 * index),
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: PremiumCard(
                      opacity: 0.3,
                      borderRadius: 20,
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: _getRoleColor(user.role).withOpacity(0.2),
                          child: Icon(_getRoleIcon(user.role), color: _getRoleColor(user.role), size: 20),
                        ),
                        title: Text(user.name, style: AppTypography.titleMedium),
                        subtitle: Text('${user.email}\nRole: ${user.role.displayName}', style: AppTypography.bodyMedium.copyWith(fontSize: 12)),
                        isThreeLine: true,
                        trailing: user.isVerified 
                          ? const Icon(Icons.verified_rounded, color: AppColors.healthGreen, size: 20)
                          : const Icon(Icons.pending_actions_rounded, color: AppColors.accentAmber, size: 20),
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
