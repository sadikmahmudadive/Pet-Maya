import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../auth/login_screen.dart';
import 'package:animate_do/animate_do.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/user_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../core/services/firebase_storage_service.dart';
import '../../../core/services/connectivity_service.dart';
import '../../common_widgets/premium_toast.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/location_picker_screen.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _bioController = TextEditingController();
  final _specializationController = TextEditingController();
  final _clinicNameController = TextEditingController();
  final _yearsExpController = TextEditingController();
  
  String? _photoUrl;
  bool _isSaving = false;
  bool _isUploadingPhoto = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AppStateRepository>().currentUser;
    if (user != null) {
      _nameController.text = user.name;
      _phoneController.text = user.phone ?? '';
      _addressController.text = user.address ?? '';
      _bioController.text = user.bio ?? '';
      _specializationController.text = user.specialization ?? '';
      _clinicNameController.text = user.clinicName ?? '';
      _yearsExpController.text = user.yearsExperience?.toString() ?? '';
      _photoUrl = user.photoUrl;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _bioController.dispose();
    _specializationController.dispose();
    _clinicNameController.dispose();
    _yearsExpController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    // Requirement: Cloudinary uploads strictly require connectivity
    final isOnline = await ConnectivityService().isConnected();
    if (!isOnline) {
      if (mounted) {
        context.read<AppStateRepository>().showToast(
          'Photo upload requires an internet connection 🌐',
          type: ToastType.error,
        );
      }
      return;
    }

    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    
    if (pickedFile != null) {
      setState(() => _isUploadingPhoto = true);
      HapticFeedback.mediumImpact();
      
      final file = File(pickedFile.path);
      final uploadedUrl = await FirebaseStorageService().uploadImage(file, 'profile_pics');
      
      if (uploadedUrl != null) {
        setState(() {
          _photoUrl = uploadedUrl;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Photo uploaded! Save changes to apply. ✨'), backgroundColor: AppColors.healthGreen),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to upload photo.'), backgroundColor: AppColors.dangerRed),
          );
        }
      }
      
      if (mounted) setState(() => _isUploadingPhoto = false);
    }
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
      final yrs = int.tryParse(_yearsExpController.text.trim());
      await context.read<AppStateRepository>().updateProfile(
        name: name,
        phone: _phoneController.text.trim(),
        photoUrl: _photoUrl,
        address: _addressController.text.trim(),
        bio: _bioController.text.trim().isEmpty ? null : _bioController.text.trim(),
        specialization: _specializationController.text.trim().isEmpty ? null : _specializationController.text.trim(),
        clinicName: _clinicNameController.text.trim().isEmpty ? null : _clinicNameController.text.trim(),
        yearsExperience: yrs,
      );
      if (!mounted) return;
      HapticFeedback.mediumImpact();
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
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
                        boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.15), blurRadius: 30, offset: const Offset(0, 15))],
                      ),
                      child: CircleAvatar(
                        radius: 64,
                        backgroundColor: AppColors.primaryLight.withValues(alpha: 0.3),
                        backgroundImage: (_photoUrl != null && _photoUrl!.isNotEmpty) 
                          ? NetworkImage(_photoUrl!) 
                          : null,
                        child: (_photoUrl == null || _photoUrl!.isEmpty) 
                          ? const Icon(Icons.person, size: 60, color: AppColors.primary) 
                          : null,
                      ),
                    ),
                    if (_isUploadingPhoto)
                      const Positioned.fill(
                        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                      ),
                    Positioned(
                      bottom: 0,
                      right: 4,
                      child: GestureDetector(
                        onTap: _isUploadingPhoto ? null : _pickAndUploadImage,
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
                  _buildPremiumField(
                    label: 'Full Name',
                    controller: _nameController,
                    hintText: 'Pet Maya User',
                    icon: Icons.person_rounded,
                  ),
                  const SizedBox(height: 24),
                  _buildPremiumField(
                    label: 'Phone Number',
                    controller: _phoneController,
                    hintText: '+1 234 567 890',
                    icon: Icons.phone_rounded,
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 24),
                  _buildLocationField(),
                  // ── Provider-only fields ──
                  Consumer<AppStateRepository>(
                    builder: (_, state, _) {
                      final role = state.currentUser?.role;
                      final isProvider = role != null && role != UserRole.petOwner && role != UserRole.admin;
                      if (!isProvider) return const SizedBox.shrink();

                      final roleLabel = role == UserRole.veterinarian ? 'Veterinarian'
                          : role == UserRole.grooming ? 'Grooming Specialist'
                          : role == UserRole.boarding ? 'Boarding Provider'
                          : 'Service Provider';

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 36),
                          // Section header
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.medical_services_rounded, color: AppColors.primary, size: 18),
                                const SizedBox(width: 10),
                                Text(
                                  '$roleLabel Profile',
                                  style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          _buildPremiumField(
                            label: role == UserRole.veterinarian ? 'Clinic / Practice Name' : 'Business Name',
                            controller: _clinicNameController,
                            hintText: role == UserRole.veterinarian ? 'e.g. Happy Paws Clinic' : 'e.g. Fluffy Grooming Studio',
                            icon: Icons.business_rounded,
                          ),
                          const SizedBox(height: 24),
                          if (role == UserRole.veterinarian) ...[
                            _buildPremiumField(
                              label: 'Specialization',
                              controller: _specializationController,
                              hintText: 'e.g. Small Animal Surgery, Dermatology',
                              icon: Icons.science_rounded,
                            ),
                            const SizedBox(height: 24),
                          ],
                          _buildPremiumField(
                            label: 'Years of Experience',
                            controller: _yearsExpController,
                            hintText: 'e.g. 5',
                            icon: Icons.workspace_premium_rounded,
                            keyboardType: TextInputType.number,
                          ),
                          const SizedBox(height: 24),
                          _buildTextAreaField(
                            label: 'Professional Bio',
                            controller: _bioController,
                            hintText: 'Tell pet owners about your experience, services, and approach to care...',
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 60),
            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _handleSave,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1AB680),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    elevation: 8,
                    shadowColor: const Color(0xFF1AB680).withValues(alpha: 0.3),
                  ),
                  child: _isSaving 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('SAVE CHANGES', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, letterSpacing: 1)),
                ),
              ),
            ),
            const SizedBox(height: 48),
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: TextButton(
                onPressed: _showDeleteAccountDialog,
                style: TextButton.styleFrom(foregroundColor: AppColors.dangerRed),
                child: const Text('PERMANENTLY DELETE ACCOUNT', 
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 1.2)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: const Text('Delete Account?', style: TextStyle(fontWeight: FontWeight.w800)),
        content: const Text(
          'This action is permanent. All your pet profiles, medical records, and posts will be purged from our servers within 30 days.',
          style: TextStyle(height: 1.5),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              setState(() => _isSaving = true);
              try {
                await context.read<AppStateRepository>().deleteAccount();
                if (!mounted) return;
                Navigator.pushAndRemoveUntil(
                  context, 
                  MaterialPageRoute(builder: (_) => LoginScreen()),
                  (r) => false
                );
              } catch (e) {
                if (mounted) {
                  setState(() => _isSaving = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Failed to delete account: $e'), backgroundColor: AppColors.dangerRed),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.dangerRed, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('DELETE PERMANENTLY', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumField({
    required String label,
    required TextEditingController controller,
    required String hintText,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label.toUpperCase(),
            style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1.5),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08)),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87, fontSize: 15),
            decoration: InputDecoration(
              filled: false,
              prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
              hintText: hintText,
              hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white38 : Colors.grey[400]),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 18),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLocationField() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            'LOCATION',
            style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1.5),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08)),
          ),
          child: TextField(
            controller: _addressController,
            style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87, fontSize: 15),
            decoration: InputDecoration(
              filled: false,
              prefixIcon: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
              hintText: 'Enter your delivery address',
              hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white38 : Colors.grey[400]),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 18),
            ),
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () async {
            HapticFeedback.lightImpact();
            final address = await Navigator.push(
              context, 
              MaterialPageRoute(builder: (_) => const LocationPickerScreen())
            );
            if (address != null && address is String) {
              setState(() => _addressController.text = address);
            }
          },
          child: Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.near_me_rounded, color: AppColors.primary, size: 14),
                const SizedBox(width: 6),
                Text(
                  'tap to set location on map',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary.withValues(alpha: 0.8),
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextAreaField({
    required String label,
    required TextEditingController controller,
    required String hintText,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(
            label.toUpperCase(),
            style: TextStyle(fontWeight: FontWeight.w900, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 1.5),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.06) : Colors.black.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08)),
          ),
          child: TextField(
            controller: controller,
            maxLines: 5,
            minLines: 3,
            style: TextStyle(fontWeight: FontWeight.w600, color: isDark ? Colors.white : Colors.black87, fontSize: 14, height: 1.6),
            decoration: InputDecoration(
              filled: false,
              hintText: hintText,
              hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white38 : Colors.grey[400], height: 1.6),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      ],
    );
  }
}

