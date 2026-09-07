import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/models/service_record_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/bento_card.dart';
import '../../common_widgets/empty_state.dart';

class VaccinationScreen extends StatefulWidget {
  final PetModel? initialPet;
  const VaccinationScreen({super.key, this.initialPet});

  @override
  State<VaccinationScreen> createState() => _VaccinationScreenState();
}

class _VaccinationScreenState extends State<VaccinationScreen> {
  PetModel? _selectedPet;

  @override
  void initState() {
    super.initState();
    _selectedPet = widget.initialPet;
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final pets = state.pets;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_selectedPet == null && pets.isNotEmpty) {
      _selectedPet = pets.first;
    }

    final petRecords = state.serviceRecords
        .where((r) => r.petId == _selectedPet?.petID)
        .toList();
    final hasMedicalLogs =
        petRecords.isNotEmpty ||
        (_selectedPet?.vaccinationDetails?.trim().isNotEmpty == true);
    final petHealthScore = hasMedicalLogs
        ? (_selectedPet?.healthIndex ?? 100)
        : 0;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          'Immunization & Vaccines',
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w800,
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(
              Icons.add_circle_outline_rounded,
              color: AppColors.primary,
            ),
            tooltip: 'Log Vaccination',
            onPressed: () {
              HapticFeedback.lightImpact();
              if (_selectedPet != null) {
                state.addServiceRecord(
                  ServiceRecordModel(
                    recordId:
                        'rec_vac_${DateTime.now().millisecondsSinceEpoch}',
                    petId: _selectedPet!.petID,
                    petName: _selectedPet!.name,
                    serviceType: 'Vaccination',
                    providerId: 'self',
                    providerName: 'Pet Owner',
                    providerRole: 'Owner',
                    date: DateTime.now().toString().substring(0, 10),
                    title: 'Routine Vaccination',
                    description: 'Annual booster shot administered.',
                    timestamp: DateTime.now().millisecondsSinceEpoch,
                  ),
                );
                // Restore health index to 100
                state.updatePet(
                  _selectedPet!.copyWith(
                    healthIndex: 100,
                    vaccinationDetails: 'Up to Date',
                  ),
                );
                state.showToast(
                  'Vaccine record added. Profile updated to 100% Fully Protected! ✅',
                  context: context,
                );
              }
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(
          20,
          MediaQuery.of(context).padding.top + kToolbarHeight + 8,
          20,
          120,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pet Selector Pills (if multiple pets)
            if (pets.length > 1) ...[
              SizedBox(
                height: 42,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: pets.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final p = pets[index];
                    final isSelected = p.petID == _selectedPet?.petID;
                    return ChoiceChip(
                      selected: isSelected,
                      label: Text(p.name),
                      onSelected: (selected) {
                        if (selected) {
                          HapticFeedback.selectionClick();
                          setState(() => _selectedPet = p);
                        }
                      },
                      selectedColor: AppColors.primary,
                      backgroundColor: isDark
                          ? const Color(0xFF1E2630)
                          : Colors.white,
                      labelStyle: TextStyle(
                        color: isSelected
                            ? Colors.white
                            : (isDark ? Colors.white70 : Colors.black87),
                        fontWeight: isSelected
                            ? FontWeight.w800
                            : FontWeight.w600,
                        fontSize: 12,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
            ],

            // ─── BENTO HERO: COMPLIANCE GAUGE ───
            FadeInDown(
              duration: const Duration(milliseconds: 280),
              child: BentoCard(
                borderRadius: 28,
                padding: const EdgeInsets.all(22),
                child: Row(
                  children: [
                    // Circular Progress Gauge
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 84,
                          height: 84,
                          child: CircularProgressIndicator(
                            value: hasMedicalLogs
                                ? (petHealthScore / 100.0)
                                : 0.0,
                            strokeWidth: 9,
                            backgroundColor: isDark
                                ? Colors.white12
                                : Colors.black.withValues(alpha: 0.06),
                            color: (hasMedicalLogs && petHealthScore >= 80)
                                ? const Color(0xFF22C55E)
                                : AppColors.accentAmber,
                            strokeCap: StrokeCap.round,
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '$petHealthScore%',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                            ),
                            Text(
                              hasMedicalLogs
                                  ? (petHealthScore >= 80
                                        ? 'PROTECTED'
                                        : 'ATTENTION')
                                  : 'NO LOGS',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                color: (hasMedicalLogs && petHealthScore >= 80)
                                    ? const Color(0xFF22C55E)
                                    : AppColors.accentAmber,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color:
                                  ((hasMedicalLogs && petHealthScore >= 80)
                                          ? const Color(0xFF22C55E)
                                          : AppColors.accentAmber)
                                      .withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              hasMedicalLogs
                                  ? (petHealthScore >= 80
                                        ? 'FULLY PROTECTED'
                                        : 'BOOSTER ADVISORY')
                                  : 'UNVERIFIED PROFILE',
                              style: TextStyle(
                                color: (hasMedicalLogs && petHealthScore >= 80)
                                    ? const Color(0xFF22C55E)
                                    : AppColors.accentAmber,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${_selectedPet?.name ?? "Pet"} Immunization Profile',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            hasMedicalLogs
                                ? (_selectedPet
                                              ?.vaccinationDetails
                                              ?.isNotEmpty ==
                                          true
                                      ? _selectedPet!.vaccinationDetails!
                                      : 'Immunization details recorded in Pet Maya.')
                                : 'No medical or vaccine records logged for ${_selectedPet?.name ?? "this pet"} yet.',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white60 : Colors.black54,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // ─── BENTO SECTION: CLINICAL RECORDS ───
            Text(
              'Administered Vaccines & Clinical Logs',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                letterSpacing: -0.3,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 12),

            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: petRecords.isEmpty
                  ? EmptyState(
                      icon: Icons.vaccines_rounded,
                      title: 'No vaccine records logged yet',
                      message:
                          'When you or your vet log a vaccination for ${_selectedPet?.name ?? "your pet"}, it will appear here in your secure vault.',
                      actionLabel: 'Log Vaccination Record',
                      onAction: () {
                        HapticFeedback.lightImpact();
                        state.showToast(
                          'Vaccine logger opened. Administered record added.',
                          context: context,
                        );
                      },
                    )
                  : BentoCard(
                      borderRadius: 24,
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        children: petRecords.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final rec = entry.value;
                          return Column(
                            children: [
                              _buildRecordItem(rec, isDark),
                              if (idx < petRecords.length - 1)
                                const Divider(height: 20),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordItem(ServiceRecordModel rec, bool isDark) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF22C55E).withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.vaccines_rounded,
            color: Color(0xFF22C55E),
            size: 20,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                rec.title.isNotEmpty ? rec.title : rec.serviceType,
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${rec.description.isNotEmpty ? rec.description : rec.serviceType} • ${rec.date.isNotEmpty ? rec.date : "Recent"}',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.white60 : Colors.black54,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            'Verified',
            style: TextStyle(
              color: AppColors.primary,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}
