import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/location_picker_screen.dart';
import 'package:animate_do/animate_do.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _photoUrlController = TextEditingController();
  final _addressController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AppStateRepository>().currentUser;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone ?? '';
      _photoUrlController.text = user.photoUrl ?? '';
      _addressController.text = user.address ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _photoUrlController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name cannot be empty')),
      );
      return;
    }

    setState(() => _isSaving = true);
    
    try {
      await context.read<AppStateRepository>().updateProfile(
        name: name,
        phone: _phoneController.text.trim(),
        photoUrl: _photoUrlController.text.trim(),
        address: _addressController.text.trim(),
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully! ✨'), backgroundColor: AppColors.healthGreen),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating profile: $e'), backgroundColor: AppColors.dangerRed),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          children: [
            FadeInDown(
              child: Center(
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.15), blurRadius: 30, offset: const Offset(0, 15))],
                      ),
                      child: CircleAvatar(
                        radius: 64,
                        backgroundColor: AppColors.primaryLight.withOpacity(0.3),
                        backgroundImage: _photoUrlController.text.isNotEmpty 
                          ? NetworkImage(_photoUrlController.text) 
                          : null,
                        child: _photoUrlController.text.isEmpty 
                          ? const Icon(Icons.person, size: 60, color: AppColors.primary) 
                          : null,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 4,
                      child: GestureDetector(
                        onTap: () {
                          // TODO: Implement image picker
                        },
                        child: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 20),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 48),
            FadeInUp(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('PERSONAL DETAILS', style: AppTypography.labelSmall.copyWith(
                    fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary, fontSize: 10
                  )),
                  const SizedBox(height: 16),
                  _buildPremiumField(
                    controller: _nameController,
                    label: 'Full Name',
                    icon: Icons.person_rounded,
                  ),
                  const SizedBox(height: 16),
                  _buildPremiumField(
                    controller: _phoneController,
                    label: 'Phone Number',
                    icon: Icons.phone_rounded,
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 16),
                  _buildPremiumField(
                    controller: _photoUrlController,
                    label: 'Profile Photo URL',
                    icon: Icons.link_rounded,
                    onChanged: (_) => setState(() {}),
                  ),
                  const SizedBox(height: 16),
                  _buildLocationField(),
                ],
              ),
            ),
            const SizedBox(height: 48),
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _handleSave,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: _isSaving 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('SAVE CHANGES', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    Function(String)? onChanged,
  }) {
    return PremiumCard(
      opacity: 0.15,
      borderRadius: 20,
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        onChanged: onChanged,
        style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
        decoration: InputDecoration(
          labelText: label.toUpperCase(),
          labelStyle: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary, fontSize: 9, letterSpacing: 0.5),
          prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          floatingLabelBehavior: FloatingLabelBehavior.always,
        ),
      ),
    );
  }

  Widget _buildLocationField() {
    return PremiumCard(
      opacity: 0.15,
      borderRadius: 20,
      onTap: () async {
        final address = await Navigator.push(
          context, 
          MaterialPageRoute(builder: (_) => const LocationPickerScreen())
        );
        if (address != null && address is String) {
          setState(() => _addressController.text = address);
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
        child: Row(
          children: [
            const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('LOCATION', style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary, fontSize: 9, letterSpacing: 0.5)),
                  const SizedBox(height: 4),
                  Text(
                    _addressController.text.isEmpty ? 'Select your address' : _addressController.text,
                    style: AppTypography.bodyLarge.copyWith(
                      fontWeight: FontWeight.w700,
                      color: _addressController.text.isEmpty ? AppColors.textTertiary : null,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary, size: 20),
          ],
        ),
      ),
    );
  }
}
