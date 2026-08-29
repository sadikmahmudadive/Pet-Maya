import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:animate_do/animate_do.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:io';
import '../../common_widgets/micro_animations/bouncing_widget.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/formatted_ai_report.dart';
import '../../common_widgets/premium_toast.dart';
import 'add_edit_pet_screen.dart';
import 'pet_food_screen.dart';
import 'pet_health_tracker_screen.dart';

class PetDetailsScreen extends StatefulWidget {
  final String petId;

  const PetDetailsScreen({super.key, required this.petId});

  @override
  State<PetDetailsScreen> createState() => _PetDetailsScreenState();
}

class _PetDetailsScreenState extends State<PetDetailsScreen> {
  bool _isUploadingReport = false;

  Future<void> _pickAndUploadReport(BuildContext context, PetModel pet) async {
    try {
      // In file_picker 8.3.x, use FilePicker.platform.pickFiles
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: false,
      );

      if (result != null && result.files.single.path != null) {
        setState(() => _isUploadingReport = true);
        final file = File(result.files.single.path!);
        final repo = context.read<AppStateRepository>();

        await repo.uploadDiagnosticReport(
          petId: pet.petID,
          petName: pet.name,
          title: 'Lab Report: ${result.files.single.name}',
          file: file,
        );

        if (mounted) {
          repo.showToast('Diagnostic report uploaded successfully! 📄', context: context);
        }
      }
    } catch (e) {
      if (mounted) {
        context.read<AppStateRepository>().showToast('Upload failed: $e', type: ToastType.error, context: context);
      }
    } finally {
      if (mounted) setState(() => _isUploadingReport = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final pet = state.pets.firstWhere(
      (p) => p.petID == widget.petId,
      orElse: () => state.pets.first,
    );

    final currentUser = state.currentUser;
    final isVet = currentUser?.role != UserRole.petOwner &&
        currentUser?.role != UserRole.admin &&
        currentUser?.role != UserRole.superAdmin;

    final records = state.serviceRecords
        .where((r) => r.petId == widget.petId)
        .where((r) {
      if (!isVet) return true;
      // Vets see: Shared records OR records they created themselves
      return r.isSharedWithVets || r.providerId == currentUser?.uid;
    }).toList();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(
          parent: AlwaysScrollableScrollPhysics(),
        ),
        slivers: [
          // ─── 1. Modern iOS Hero Image Header ───
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            stretch: true,
            backgroundColor: isDark
                ? const Color(0xFF131B24)
                : AppColors.primary,
            systemOverlayStyle: SystemUiOverlayStyle.light,
            leading: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Center(
                child: ClipOval(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                    child: GestureDetector(
                      onTap: () => Navigator.pop(context),
                      behavior: HitTestBehavior.opaque,
                      child: Container(
                        width: 38,
                        height: 38,
                        color: Colors.black.withValues(alpha: 0.35),
                        child: Center(
                          child: Icon(
                            CupertinoIcons.back,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              if (!isVet)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: Center(
                    child: ClipOval(
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                        child: GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => AddEditPetScreen(petToEdit: pet),
                            ),
                          ),
                          behavior: HitTestBehavior.opaque,
                          child: Container(
                            width: 38,
                            height: 38,
                            color: Colors.black.withValues(alpha: 0.35),
                            child: Center(
                              child: Icon(
                                CupertinoIcons.pencil,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              stretchModes: const [StretchMode.zoomBackground],
              background: Stack(
                fit: StackFit.expand,
                children: [
                  pet.photoUrl != null && pet.photoUrl!.isNotEmpty
                      ? pet.photoUrl!.startsWith('assets')
                            ? Image.asset(pet.photoUrl!, fit: BoxFit.cover)
                            : CachedNetworkImage(
                                imageUrl: pet.photoUrl!,
                                fit: BoxFit.cover,
                                placeholder: (c, u) => Center(
                                  child: CupertinoActivityIndicator(
                                    color: Colors.white,
                                  ),
                                ),
                                errorWidget: (c, u, e) => Container(
                                  color: AppColors.primaryDark,
                                  child: const Icon(
                                    Icons.pets_rounded,
                                    size: 60,
                                    color: Colors.white70,
                                  ),
                                ),
                              )
                      : Container(
                          color: AppColors.primaryDark,
                          child: const Icon(
                            Icons.pets_rounded,
                            size: 60,
                            color: Colors.white70,
                          ),
                        ),
                  // Subtle top ambient shadow for button visibility
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: const Alignment(0, -0.2),
                        colors: [
                          Colors.black.withValues(alpha: 0.50),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ─── 2. Body Content ───
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Identity Card
                  FadeInDown(
                    duration: const Duration(milliseconds: 300),
                    child: PremiumCard(
                      opacity: isDark ? 0.35 : 0.90,
                      borderRadius: 24,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 18,
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    pet.name,
                                    style: GoogleFonts.plusJakartaSans(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 26,
                                      letterSpacing: -0.5,
                                      color: isDark
                                          ? Colors.white
                                          : AppColors.textPrimary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          pet.breed,
                                          style: GoogleFonts.plusJakartaSans(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 14,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Gender Badge
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                gradient: pet.gender.toLowerCase() == 'female'
                                    ? const LinearGradient(
                                        colors: [
                                          Color(0xFFFF6B81),
                                          Color(0xFFFF4757),
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      )
                                    : const LinearGradient(
                                        colors: [
                                          Color(0xFF00B6D2),
                                          Color(0xFF38BDF8),
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color:
                                        (pet.gender.toLowerCase() == 'female'
                                                ? const Color(0xFFFF4757)
                                                : const Color(0xFF00B6D2))
                                            .withValues(alpha: 0.35),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Icon(
                                pet.gender.toLowerCase() == 'female'
                                    ? Icons.female_rounded
                                    : Icons.male_rounded,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // ─── 3. About Section ───
                  FadeInUp(
                    delay: const Duration(milliseconds: 80),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.pets_rounded,
                              size: 20,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'About ${pet.name}',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                                letterSpacing: -0.3,
                                color: isDark
                                    ? Colors.white
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Quick Stats Grid
                        Row(
                          children: [
                            _buildStatCard(
                              context,
                              'Age',
                              pet.age.isEmpty ? 'N/A' : pet.age,
                              const Color(0xFFE8F6F1),
                              const Color(0xFF2D8C69),
                            ),
                            const SizedBox(width: 8),
                            _buildStatCard(
                              context,
                              'Weight',
                              pet.weight.isEmpty ? 'N/A' : pet.weight,
                              const Color(0xFFE9F5F8),
                              const Color(0xFF2D698C),
                            ),
                            const SizedBox(width: 8),
                            _buildStatCard(
                              context,
                              'Height',
                              pet.height.isEmpty ? 'N/A' : pet.height,
                              const Color(0xFFF1F6E8),
                              const Color(0xFF698C2D),
                            ),
                            const SizedBox(width: 8),
                            _buildStatCard(
                              context,
                              'Color',
                              pet.color.isEmpty ? 'N/A' : pet.color,
                              const Color(0xFFE8F1F6),
                              const Color(0xFF2D698C),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Bio Card
                        PremiumCard(
                          opacity: isDark ? 0.20 : 0.85,
                          borderRadius: 20,
                          child: Padding(
                            padding: const EdgeInsets.all(18),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(
                                  CupertinoIcons.quote_bubble_fill,
                                  size: 18,
                                  color: AppColors.primary.withValues(
                                    alpha: 0.7,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    (pet.description != null &&
                                            pet.description!.trim().isNotEmpty)
                                        ? pet.description!
                                        : "${pet.name} is a wonderful ${pet.breed} with a joyful personality and lots of energy.",
                                    style: AppTypography.bodyMedium.copyWith(
                                      height: 1.5,
                                      color: isDark
                                          ? Colors.white70
                                          : Colors.black87,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // ─── 4. Health & Status Hub ───
                  FadeInUp(
                    delay: const Duration(milliseconds: 140),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(
                              Icons.analytics_rounded,
                              size: 20,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${pet.name}\'s Health & Care',
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w800,
                                fontSize: 18,
                                letterSpacing: -0.3,
                                color: isDark
                                    ? Colors.white
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildStatusTile(
                          context,
                          'Health Condition',
                          pet.healthIndex > 80
                              ? 'Optimal & Verified'
                              : 'Checkup Recommended',
                          pet.healthIndex > 80 ? 'Healthy' : 'Checkup',
                          Icons.medical_services_rounded,
                          const Color(0xFFFFE8E8),
                          pet.healthIndex > 80
                              ? AppColors.healthGreen
                              : AppColors.accentAmber,
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) =>
                                  PetHealthTrackerScreen(petId: pet.petID),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        _buildStatusTile(
                          context,
                          'Food & Nutrition',
                          pet.feedingTimes.isEmpty
                              ? 'Tap to schedule meals'
                              : 'Daily Schedule: ${pet.feedingTimes.join(', ')}',
                          'Schedule',
                          Icons.restaurant_rounded,
                          const Color(0xFFE8F6F1),
                          AppColors.primary,
                          () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => PetFoodScreen(petId: pet.petID),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        BouncingWidget(
                          onTap: () => _pickAndUploadReport(context, pet),
                          child: _buildStatusTile(
                            context,
                            'Clinical Reports',
                            'Upload and store medical PDFs',
                            'EHR',
                            Icons.picture_as_pdf_rounded,
                            const Color(0xFFE8F1F6),
                            AppColors.primary,
                            null, // null because we're wrapping it in BouncingWidget
                          ),
                        ),
                        const SizedBox(height: 10),
                        _buildStatusTile(
                          context,
                          'Current Mood',
                          pet.mood.isEmpty ? 'Happy & Active' : pet.mood,
                          'Stable',
                          Icons.sentiment_satisfied_alt_rounded,
                          const Color(0xFFFFF4E8),
                          AppColors.accentAmber,
                          null,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // ─── 6. Professional History ───
                  FadeInUp(
                    delay: const Duration(milliseconds: 200),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Care & Medical Records',
                          style: GoogleFonts.plusJakartaSans(
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                            letterSpacing: -0.3,
                            color: isDark
                                ? Colors.white
                                : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (records.isEmpty)
                          PremiumCard(
                            opacity: isDark ? 0.15 : 0.80,
                            borderRadius: 20,
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 32),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.history_edu_rounded,
                                    size: 40,
                                    color: isDark
                                        ? Colors.white24
                                        : Theme.of(context).dividerColor,
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    'No records logged yet.',
                                    style: TextStyle(
                                      color: isDark
                                          ? Colors.white38
                                          : Colors.grey[500],
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ...records.map((r) => _buildHistoryCard(context, r, isVet, currentUser)),
                      ],
                    ),
                  ),

                  const SizedBox(height: 48),

                  // ─── 7. Delete Pet Action ───
                  if (!isVet)
                    FadeInUp(
                      delay: const Duration(milliseconds: 260),
                      child: Center(
                        child: TextButton.icon(
                          onPressed: () => _confirmDeletePet(context, state, pet),
                          icon: Icon(
                            CupertinoIcons.trash,
                            color: AppColors.dangerRed,
                            size: 18,
                          ),
                          label: Text(
                            'Delete ${pet.name}\'s Profile',
                            style: const TextStyle(
                              color: AppColors.dangerRed,
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteRecord(
    BuildContext context,
    AppStateRepository state,
    ServiceRecordModel record,
  ) {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: const Text('Delete Medical Record?'),
        content: Text('Are you sure you want to delete "${record.title}"? This cannot be undone.'),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(ctx),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Delete'),
            onPressed: () {
              HapticFeedback.heavyImpact();
              state.deleteServiceRecord(record.recordId);
              Navigator.pop(ctx);
              state.showToast('Record deleted successfully! 🗑️', context: context);
            },
          ),
        ],
      ),
    );
  }

  void _confirmDeletePet(
    BuildContext context,
    AppStateRepository state,
    PetModel pet,
  ) {
    showCupertinoDialog(
      context: context,
      builder: (ctx) => CupertinoAlertDialog(
        title: Text('Delete ${pet.name}?'),
        content: const Text(
          'This will permanently delete the pet profile and all associated medical logs.',
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(ctx),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Delete'),
            onPressed: () {
              HapticFeedback.heavyImpact();
              state.deletePet(pet.petID);
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String label,
    String value,
    Color bgColor,
    Color textColor,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Expanded(
      child: Container(
        height: 72,
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: isDark ? textColor.withValues(alpha: 0.15) : bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark
                ? textColor.withValues(alpha: 0.25)
                : textColor.withValues(alpha: 0.15),
            width: 0.8,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label.toUpperCase(),
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w800,
                color: isDark
                    ? Colors.white54
                    : textColor.withValues(alpha: 0.70),
                letterSpacing: 0.4,
              ),
            ),
            const SizedBox(height: 4),
            Flexible(
              child: Text(
                value,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: value.length > 8 ? 10 : 12,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : textColor,
                  height: 1.1,
                ),
                maxLines: 2,
                overflow: TextOverflow.visible,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusTile(
    BuildContext context,
    String title,
    String subtitle,
    String statusLabel,
    IconData icon,
    Color bgColor,
    Color iconColor,
    VoidCallback? onTap,
  ) {
    return PremiumCard(
      onTap: onTap,
      opacity: 0.15,
      borderRadius: 20,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTypography.titleMedium.copyWith(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppTypography.bodySmall.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                statusLabel,
                style: TextStyle(
                  color: iconColor,
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            if (onTap != null) ...[
              const SizedBox(width: 6),
              Icon(
                CupertinoIcons.chevron_forward,
                color: Theme.of(context).dividerColor,
                size: 14,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryCard(BuildContext context, ServiceRecordModel record, bool isVet, UserModel? currentUser) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final repo = context.read<AppStateRepository>();

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      child: PremiumCard(
        opacity: isDark ? 0.20 : 0.12,
        borderRadius: 20,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    record.serviceType.toUpperCase(),
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 10,
                      color: AppColors.primary,
                      letterSpacing: 0.8,
                    ),
                  ),
                  Text(
                    record.date,
                    style: AppTypography.labelSmall.copyWith(
                      color: isDark
                          ? Colors.white38
                          : Theme.of(context).colorScheme.outline,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      record.title,
                      style: AppTypography.titleMedium.copyWith(
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ),
                  if (record.reportUrl != null)
                    IconButton(
                      onPressed: () => launchUrl(Uri.parse(record.reportUrl!)),
                      icon: const Icon(Icons.picture_as_pdf_rounded, color: AppColors.primary),
                      tooltip: 'Open PDF Report',
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(
                    record.providerRole == 'Pet Owner' ? Icons.person_rounded : Icons.verified_user_rounded,
                    size: 14,
                    color: record.providerRole == 'Pet Owner' ? AppColors.primary : AppColors.healthGreen,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    record.providerName,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? Colors.white54
                          : Theme.of(context).colorScheme.outline,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  // Share with Vets Toggle (Only owner can toggle)
                  if (!isVet || record.providerId == currentUser?.uid) ...[
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        repo.toggleReportSharing(record.recordId, !record.isSharedWithVets);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: record.isSharedWithVets
                              ? AppColors.healthGreen.withValues(alpha: 0.1)
                              : Colors.grey.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              record.isSharedWithVets ? Icons.share_rounded : Icons.lock_rounded,
                              size: 12,
                              color: record.isSharedWithVets ? AppColors.healthGreen : Colors.grey,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              record.isSharedWithVets ? 'Shared' : 'Private',
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: record.isSharedWithVets ? AppColors.healthGreen : Colors.grey,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Delete Record Button
                    GestureDetector(
                      onTap: () => _confirmDeleteRecord(context, repo, record),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.dangerRed.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(CupertinoIcons.trash, color: AppColors.dangerRed, size: 14),
                      ),
                    ),
                  ] else if (record.isSharedWithVets)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.healthGreen.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.share_rounded, size: 10, color: AppColors.healthGreen),
                          SizedBox(width: 4),
                          Text(
                            'Shared with you',
                            style: TextStyle(fontSize: 8, fontWeight: FontWeight.w800, color: AppColors.healthGreen),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              if (record.description.isNotEmpty) ...[
                const SizedBox(height: 12),
                FormattedAiReport(text: record.description),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
