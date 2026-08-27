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
import '../common_widgets/monogram_avatar.dart';
import 'package:intl/intl.dart';

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
                            opacity: user.isSuspended ? 0.05 : 0.15,
                            borderRadius: 24,
                            onTap: () => _showUserDossier(context, user),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  MonogramAvatar(
                                    name: user.name,
                                    photoUrl: user.photoUrl,
                                    radius: 26,
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Expanded(
                                              child: Text(user.name, 
                                                maxLines: 1, overflow: TextOverflow.ellipsis,
                                                style: AppTypography.titleMedium.copyWith(
                                                  fontWeight: FontWeight.w800, 
                                                  fontSize: 14,
                                                  decoration: user.isSuspended ? TextDecoration.lineThrough : null,
                                                )),
                                            ),
                                            if (user.isVerified)
                                              const Icon(Icons.verified_rounded, color: AppColors.healthGreen, size: 14),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(user.email, 
                                          maxLines: 1, overflow: TextOverflow.ellipsis,
                                          style: TextStyle(fontSize: 11, color: Colors.grey[500], fontWeight: FontWeight.w600)),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          IconButton(
                                            icon: Icon(
                                              user.isSuspended ? Icons.play_circle_outline_rounded : Icons.pause_circle_outline_rounded, 
                                              color: user.isSuspended ? AppColors.healthGreen : AppColors.accentAmber, 
                                              size: 20
                                            ),
                                            onPressed: () {
                                              HapticFeedback.mediumImpact();
                                              context.read<AppStateRepository>().toggleUserSuspension(user.uid);
                                            },
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                          ),
                                          const SizedBox(width: 8),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed, size: 18),
                                            onPressed: () => _showDeleteConfirm(context, user),
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: _getRoleColor(user.role).withValues(alpha: 0.1), 
                                          borderRadius: BorderRadius.circular(6)
                                        ),
                                        child: Text(user.role.displayName.toUpperCase(), 
                                          style: TextStyle(color: _getRoleColor(user.role), fontWeight: FontWeight.w900, fontSize: 7, letterSpacing: 0.5)),
                                      ),
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

  void _showUserDossier(BuildContext context, UserModel user) {
    final state = context.read<AppStateRepository>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final joinedDate = DateFormat('MMM dd, yyyy').format(DateTime.fromMillisecondsSinceEpoch(user.joinedTimestamp));
    final petsCount = state.pets.where((p) => p.ownerID == user.uid).length;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        ),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)))),
              const SizedBox(height: 24),
              
              // Header
              Row(
                children: [
                  MonogramAvatar(name: user.name, photoUrl: user.photoUrl, radius: 36),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                        Text(user.email, style: TextStyle(color: Colors.grey[500], fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // KYC & Safety Controls
              _buildSectionLabel('IDENTITY & SAFETY'),
              Row(
                children: [
                  Expanded(
                    child: _buildActionTile(
                      label: user.isVerified ? 'VERIFIED' : 'NOT VERIFIED',
                      icon: user.isVerified ? Icons.verified_rounded : Icons.verified_user_outlined,
                      color: user.isVerified ? AppColors.healthGreen : Colors.grey,
                      onTap: () {
                        HapticFeedback.mediumImpact();
                        state.toggleUserVerification(user.uid);
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildActionTile(
                      label: user.isSuspended ? 'SUSPENDED' : 'ACTIVE',
                      icon: user.isSuspended ? Icons.block_rounded : Icons.check_circle_rounded,
                      color: user.isSuspended ? AppColors.dangerRed : AppColors.healthGreen,
                      onTap: () => state.toggleUserSuspension(user.uid),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Role Management
              _buildSectionLabel('ROLE BASED ACCESS CONTROL'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: UserRole.values.map((role) {
                  final isSelected = user.role == role;
                  return ChoiceChip(
                    label: Text(role.displayName, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: isSelected ? Colors.white : null)),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    onSelected: (val) {
                      if (val) state.updateUserRole(user.uid, role);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 32),

              // User Dossier Data
              _buildSectionLabel('USER DOSSIER'),
              PremiumCard(
                opacity: 0.1,
                borderRadius: 20,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      _buildDossierRow('Joined Date', joinedDate),
                      const Divider(height: 24),
                      _buildDossierRow('Registered Pets', '$petsCount'),
                      const Divider(height: 24),
                      _buildDossierRow('Points Balance', '${user.points} PM'),
                      const Divider(height: 24),
                      _buildDossierRow('Referral Code', user.referralCode ?? 'N/A'),
                      const Divider(height: 24),
                      _buildDossierRow('Phone', user.phone ?? 'Not set'),
                      const Divider(height: 24),
                      _buildDossierRow('Address', user.address ?? 'Not set', maxLines: 2),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.2)),
    );
  }

  Widget _buildActionTile({required String label, required IconData icon, required Color color, required VoidCallback onTap}) {
    return PremiumCard(
      onTap: onTap,
      opacity: 0.1,
      borderRadius: 16,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildDossierRow(String label, String value, {int maxLines = 1}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey)),
        const Spacer(),
        Expanded(
          flex: 2,
          child: Text(value, 
            textAlign: TextAlign.right,
            maxLines: maxLines,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
        ),
      ],
    );
  }

  void _showDeleteConfirm(BuildContext context, UserModel user) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: const Text('Delete User Account?'),
        content: Text('Are you sure you want to permanently delete the account for ${user.name}? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () {
              // Implementation would involve calling a deleteUser method in repository
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User deletion restricted in demo mode.')));
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.dangerRed),
            child: const Text('DELETE', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Color _getRoleColor(UserRole role) {
    switch (role) {
      case UserRole.admin:
      case UserRole.superAdmin:
        return AppColors.dangerRed;
      case UserRole.veterinarian:
        return AppColors.primary;
      case UserRole.petShop:
        return AppColors.accentAmber;
      case UserRole.grooming:
        return AppColors.healthGreen;
      case UserRole.boarding:
      case UserRole.shelter:
        return AppColors.secondary;
      case UserRole.petOwner:
        return Colors.blueGrey;
    }
  }

  IconData _getRoleIcon(UserRole role) {
    switch (role) {
      case UserRole.admin:
      case UserRole.superAdmin:
        return Icons.admin_panel_settings_rounded;
      case UserRole.veterinarian:
        return Icons.medical_services_rounded;
      case UserRole.petShop:
        return Icons.storefront_rounded;
      case UserRole.grooming:
        return Icons.content_cut_rounded;
      case UserRole.boarding:
        return Icons.hotel_rounded;
      case UserRole.shelter:
        return Icons.maps_home_work_rounded;
      case UserRole.petOwner:
        return Icons.person_rounded;
    }
  }
}
