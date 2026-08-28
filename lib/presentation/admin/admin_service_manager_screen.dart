import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/vet_model.dart';
import '../../../core/services/firebase_storage_service.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../common_widgets/empty_state.dart';
import '../common_widgets/status_chip.dart';

class AdminServiceManagerScreen extends StatefulWidget {
  const AdminServiceManagerScreen({super.key});

  @override
  State<AdminServiceManagerScreen> createState() => _AdminServiceManagerScreenState();
}

class _AdminServiceManagerScreenState extends State<AdminServiceManagerScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final vets = state.vets.where((v) => 
      v.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
      v.tag.toLowerCase().contains(_searchQuery.toLowerCase())
    ).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Clinical Ops', style: TextStyle(fontWeight: FontWeight.w900)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_business_rounded, color: AppColors.primary),
            onPressed: () => _showServiceEditor(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 100),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: PremiumCard(
              opacity: 0.1,
              borderRadius: 20,
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                style: const TextStyle(fontWeight: FontWeight.w700),
                decoration: InputDecoration(
                  hintText: 'Search Clinics, Spas, Shelters...',
                  hintStyle: TextStyle(color: Colors.grey[500], fontSize: 14),
                  prefixIcon: const Icon(Icons.search_rounded, size: 20),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 18),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: vets.isEmpty
                ? const EmptyState(icon: Icons.medical_services_outlined, title: 'No services found', message: 'Add your first clinical provider.')
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 120),
                    physics: const BouncingScrollPhysics(),
                    itemCount: vets.length,
                    itemBuilder: (context, index) {
                      final vet = vets[index];
                      return FadeInUp(
                        delay: Duration(milliseconds: 30 * index),
                        child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: PremiumCard(
                            opacity: 0.15,
                            borderRadius: 24,
                            onTap: () => _showServiceEditor(context, vet: vet),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: vet.photoUrl != null 
                                      ? CachedNetworkImage(imageUrl: vet.photoUrl!, width: 64, height: 64, fit: BoxFit.cover)
                                      : Container(width: 64, height: 64, color: AppColors.primary.withValues(alpha: 0.1), child: const Icon(Icons.medical_services)),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(vet.name, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800, fontSize: 15)),
                                        Text(vet.tag.toUpperCase(), style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 8, letterSpacing: 0.5)),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            StatusChip.verified(vet.isVerified),
                                            const SizedBox(width: 8),
                                            Text(vet.price, style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.healthGreen, fontSize: 11)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.edit_rounded, color: Colors.grey, size: 18),
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

  void _showServiceEditor(BuildContext context, {VetModel? vet}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ServiceEditorSheet(vet: vet),
    );
  }
}

class _ServiceEditorSheet extends StatefulWidget {
  final VetModel? vet;
  const _ServiceEditorSheet({this.vet});

  @override
  State<_ServiceEditorSheet> createState() => _ServiceEditorSheetState();
}

class _ServiceEditorSheetState extends State<_ServiceEditorSheet> {
  final _nameController = TextEditingController();
  final _qualController = TextEditingController();
  final _priceController = TextEditingController();
  final _phoneController = TextEditingController();
  final _hoursController = TextEditingController();
  final _bioController = TextEditingController();
  String _tag = 'VETERINARIAN';
  String? _photoUrl;
  bool _isSaving = false;
  bool _isUploading = false;
  bool _isVerified = false;

  @override
  void initState() {
    super.initState();
    if (widget.vet != null) {
      _nameController.text = widget.vet!.name;
      _qualController.text = widget.vet!.qualification;
      _priceController.text = widget.vet!.price;
      _phoneController.text = widget.vet!.phone;
      _hoursController.text = widget.vet!.businessHours;
      _bioController.text = widget.vet!.bio;
      _tag = widget.vet!.tag.toUpperCase();
      _photoUrl = widget.vet!.photoUrl;
      _isVerified = widget.vet!.isVerified;
    }
  }

  void _save() async {
    if (_nameController.text.isEmpty) return;
    setState(() => _isSaving = true);
    final state = context.read<AppStateRepository>();

    final updated = VetModel(
      id: widget.vet?.id ?? 'vet_${DateTime.now().millisecondsSinceEpoch}',
      name: _nameController.text.trim(),
      qualification: _qualController.text.trim(),
      tag: _tag,
      price: _priceController.text.trim(),
      phone: _phoneController.text.trim(),
      businessHours: _hoursController.text.trim(),
      bio: _bioController.text.trim(),
      photoUrl: _photoUrl,
      isVerified: _isVerified,
      rating: widget.vet?.rating ?? 0.0,
      reviewsCount: widget.vet?.reviewsCount ?? 0,
      latitude: widget.vet?.latitude,
      longitude: widget.vet?.longitude,
      distance: widget.vet?.distance ?? 'Nearby',
      experience: widget.vet?.experience ?? '5 Years',
    );

    // Save to Firebase via repo
    await state.saveVetProfile(updated);
    
    if (mounted) Navigator.pop(context);
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 60);
    if (picked != null) {
      setState(() => _isUploading = true);
      final url = await FirebaseStorageService().uploadImage(File(picked.path), 'service_providers');
      setState(() {
        _photoUrl = url;
        _isUploading = false;
      });
    }
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
              Text(widget.vet == null ? 'ONBOARD SERVICE' : 'EDIT SERVICE INFO', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 1)),
              IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
            ],
          ),
          const Divider(height: 32),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: GestureDetector(
                      onTap: _pickImage,
                      child: Stack(
                        children: [
                          Container(
                            width: 100, height: 100,
                            decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(32)),
                            child: _photoUrl != null 
                              ? ClipRRect(borderRadius: BorderRadius.circular(32), child: CachedNetworkImage(imageUrl: _photoUrl!, fit: BoxFit.cover))
                              : const Icon(Icons.add_a_photo_rounded, color: Colors.grey, size: 32),
                          ),
                          if (_isUploading)
                            const Positioned.fill(child: Center(child: CircularProgressIndicator())),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  _input('SERVICE NAME', _nameController),
                  const SizedBox(height: 20),
                  _input('QUALIFICATION / TAGLINE', _qualController),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(child: _input('CONSULTATION FEE', _priceController)),
                      const SizedBox(width: 16),
                      Expanded(child: _input('PHONE', _phoneController)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _input('BUSINESS HOURS', _hoursController, hint: 'e.g. Mon-Fri: 9AM - 6PM'),
                  const SizedBox(height: 20),
                  Text('CATEGORY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey[500], letterSpacing: 1)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    children: ['VETERINARIAN', 'GROOMING', 'BOARDING', 'SHELTER'].map((t) => ChoiceChip(
                      label: Text(t, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: _tag == t ? Colors.white : null)),
                      selected: _tag == t,
                      selectedColor: AppColors.primary,
                      onSelected: (val) { if (val) setState(() => _tag = t); },
                    )).toList(),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('VERIFIED PARTNER', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                      CupertinoSwitch(value: _isVerified, activeColor: AppColors.primary, onChanged: (v) => setState(() => _isVerified = v)),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _input('PROFESSIONAL BIO', _bioController, maxLines: 4),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            height: 64,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _save,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
              child: _isSaving ? const CupertinoActivityIndicator(color: Colors.white) : const Text('FINALIZE ONBOARDING', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _input(String label, TextEditingController controller, {String? hint, int maxLines = 1}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: isDark ? Colors.white38 : Colors.grey, letterSpacing: 1)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03), borderRadius: BorderRadius.circular(18)),
          child: TextField(
            controller: controller,
            maxLines: maxLines,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            decoration: InputDecoration(hintText: hint, border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20)),
          ),
        ),
      ],
    );
  }
}
