import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/bento_card.dart';

/// Vaccination Management view featuring a Minimalism + Bento layout:
/// compliance gauge ring, modular Core vs Non-Core Bento cards, and booster timelines.
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
    final pets = context.read<AppStateRepository>().pets;
    _selectedPet = widget.initialPet ?? (pets.isNotEmpty ? pets.first : null);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppStateRepository>();
    final pets = state.pets;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_selectedPet == null && pets.isNotEmpty) {
      _selectedPet = pets.first;
    }

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          'Immunization & Vaccines',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppColors.primary),
            tooltip: 'Log Vaccination',
            onPressed: () {
              HapticFeedback.lightImpact();
              state.showToast('Vaccine logger opened. Administered record added.', context: context);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + kToolbarHeight + 8, 20, 120),
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
                  separatorBuilder: (_, _) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    final p = pets[index];
                    final isSelected = _selectedPet?.petID == p.petID;
                    return GestureDetector(
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() => _selectedPet = p);
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : (isDark ? Colors.white10 : Colors.white.withValues(alpha: 0.8)),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : Colors.black12),
                          ),
                        ),
                        child: Text(
                          p.name,
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            color: isSelected ? Colors.white : (isDark ? Colors.white : Colors.black87),
                          ),
                        ),
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
                            value: 0.92,
                            strokeWidth: 9,
                            backgroundColor: isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.06),
                            color: const Color(0xFF22C55E),
                            strokeCap: StrokeCap.round,
                          ),
                        ),
                        const Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '92%',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                            ),
                            Text(
                              'VALID',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF22C55E),
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
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              'FULLY PROTECTED',
                              style: TextStyle(
                                color: Color(0xFF22C55E),
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${_selectedPet?.name ?? "Pet"} is Up to Date',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Core vaccines are valid until Nov 2026. Next booster in 8 months.',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white60 : Colors.black54,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // ─── BENTO SECTION: CORE VACCINES ───
            Text(
              'Core Clinical Vaccines',
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
              child: BentoCard(
                borderRadius: 24,
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    _buildVaccineItem(
                      'Rabies (3-Year Booster)',
                      'Administered Dec 14, 2025 • Dr. Sarah Jenkins',
                      'Valid: Dec 2028',
                      true,
                      isDark,
                    ),
                    const Divider(height: 20),
                    _buildVaccineItem(
                      'DHPP (Distemper, Parvo)',
                      'Administered Jan 20, 2026 • Pet Care BD',
                      'Valid: Jan 2027',
                      true,
                      isDark,
                    ),
                    const Divider(height: 20),
                    _buildVaccineItem(
                      'Bordetella (Kennel Cough)',
                      'Oral dose administered Oct 2025',
                      'Due in 60 days',
                      false,
                      isDark,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // ─── BENTO SECTION: PARASITE & NON-CORE ───
            Text(
              'Parasite & Preventive Treatments',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                letterSpacing: -0.3,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 12),

            FadeInUp(
              delay: const Duration(milliseconds: 160),
              child: BentoCard(
                borderRadius: 24,
                padding: const EdgeInsets.all(18),
                child: Column(
                  children: [
                    _buildVaccineItem(
                      'Heartworm Preventive (Chewable)',
                      'Monthly NexGard Spectra administered',
                      'Next: In 14 days',
                      true,
                      isDark,
                    ),
                    const Divider(height: 20),
                    _buildVaccineItem(
                      'Flea & Tick Prevention',
                      'Bravecto topical protection applied',
                      'Valid: Next 60 days',
                      true,
                      isDark,
                    ),
                    const Divider(height: 20),
                    _buildVaccineItem(
                      'Canine Influenza (H3N2 / H3N8)',
                      'Recommended for boarding & dog parks',
                      'Optional',
                      true,
                      isDark,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVaccineItem(String name, String subtext, String badgeText, bool isCleared, bool isDark) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: (isCleared ? const Color(0xFF22C55E) : AppColors.accentAmber).withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isCleared ? Icons.vaccines_rounded : Icons.alarm_rounded,
            color: isCleared ? const Color(0xFF22C55E) : AppColors.accentAmber,
            size: 20,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtext,
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.white54 : Colors.black54,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: (isCleared ? const Color(0xFF22C55E) : AppColors.accentAmber).withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            badgeText,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: isCleared ? const Color(0xFF22C55E) : AppColors.accentAmber,
            ),
          ),
        ),
      ],
    );
  }
}

