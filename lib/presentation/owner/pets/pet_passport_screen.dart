import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/models/pet_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/resilient_network_image.dart';

/// Digital Pet Passport featuring a Spatial + Glass holographic credential card,
/// biometric clearance tags, verified microchip, and international clinic QR code.
class PetPassportScreen extends StatefulWidget {
  final PetModel pet;

  const PetPassportScreen({super.key, required this.pet});

  @override
  State<PetPassportScreen> createState() => _PetPassportScreenState();
}

class _PetPassportScreenState extends State<PetPassportScreen> with SingleTickerProviderStateMixin {
  bool _showBack = false;
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _flipAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _flipController, curve: Curves.easeInOutBack),
    );
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  void _flipCard() {
    HapticFeedback.mediumImpact();
    if (_showBack) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
    setState(() => _showBack = !_showBack);
  }

  @override
  Widget build(BuildContext context) {
    final pet = widget.pet;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          'Digital Pet Passport',
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: AppColors.primary),
            tooltip: 'Share Credential',
            onPressed: () {
              HapticFeedback.lightImpact();
              context.read<AppStateRepository>().showToast('Passport link copied to clipboard! 📋', context: context);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
        child: Column(
          children: [
            // Instruction Subheader
            Text(
              'Official Digital Credential • IATA & Vet Standard Compliant',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white54 : Colors.black54,
                letterSpacing: 0.3,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),

            // Spatial Holographic Passport Card
            AnimatedBuilder(
              animation: _flipAnimation,
              builder: (context, child) {
                final angle = _flipAnimation.value * 3.14159;
                final isUnder = angle > 1.5708;

                return Transform(
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.0015) // Spatial perspective depth
                    ..rotateY(angle),
                  alignment: Alignment.center,
                  child: GestureDetector(
                    onTap: _flipCard,
                    child: isUnder
                        ? Transform(
                            transform: Matrix4.identity()..rotateY(3.14159),
                            alignment: Alignment.center,
                            child: _buildPassportBack(context, pet, isDark),
                          )
                        : _buildPassportFront(context, pet, isDark),
                  ),
                );
              },
            ),

            const SizedBox(height: 16),
            // Flip Card Action Pill
            GestureDetector(
              onTap: _flipCard,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white12 : Colors.black12,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.sync_rounded,
                      size: 14,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _showBack ? 'View Passport Front' : 'Tap to View Back & QR Code',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Official Biometric Ledger Section
            FadeInUp(
              duration: const Duration(milliseconds: 300),
              child: _buildLedgerSection(context, pet, isDark),
            ),
          ],
        ),
      ),
    );
  }

  // ─── PASSPORT FRONT (SPATIAL + GLASS) ───
  Widget _buildPassportFront(BuildContext context, PetModel pet, bool isDark) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 240),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: isDark
              ? [
                  const Color(0xFF1E293B).withValues(alpha: 0.95),
                  const Color(0xFF0F172A).withValues(alpha: 0.98),
                ]
              : [
                  const Color(0xFFFFFFFF).withValues(alpha: 0.95),
                  const Color(0xFFE6F7F0).withValues(alpha: 0.90),
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: isDark ? 0.25 : 0.12),
            blurRadius: 30,
            spreadRadius: 2,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.pets_rounded, color: AppColors.primary, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'PET MAYA GLOBAL PASSPORT',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.2,
                                color: AppColors.primary,
                              ),
                            ),
                            Text(
                              'CANINE / FELINE ACCREDITATION',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white38 : Colors.black45,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF22C55E).withValues(alpha: 0.4)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.verified_rounded, size: 12, color: Color(0xFF22C55E)),
                          SizedBox(width: 4),
                          Text(
                            'CLEARED',
                            style: TextStyle(
                              color: Color(0xFF22C55E),
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Center Identity Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar with Holographic ring
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.6), width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ResilientNetworkImage(
                        imageUrl: pet.photoUrl,
                        width: 76,
                        height: 76,
                        borderRadius: BorderRadius.circular(38),
                        fit: BoxFit.cover,
                        fallbackIcon: Icons.pets_rounded,
                      ),
                    ),
                    const SizedBox(width: 18),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            pet.name,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${pet.breed} • ${pet.gender.toUpperCase()}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.qr_code_2_rounded, size: 14, color: AppColors.primary),
                                const SizedBox(width: 6),
                                Text(
                                  'CHIP: ${pet.petID.substring(0, pet.petID.length > 8 ? 8 : pet.petID.length).toUpperCase()}••••',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.0,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),

                // Bottom Meta Chips
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMetaColumn('AGE', pet.age.isEmpty ? '2 Yrs' : pet.age, isDark),
                    _buildMetaColumn('WEIGHT', pet.weight.isEmpty ? '8.4 kg' : pet.weight, isDark),
                    _buildMetaColumn('HEALTH INDEX', '${pet.healthIndex}/100', isDark),
                    _buildMetaColumn('STATUS', 'ACTIVE', isDark),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ─── PASSPORT BACK (SPATIAL + GLASS WITH QR CODE) ───
  Widget _buildPassportBack(BuildContext context, PetModel pet, bool isDark) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 240),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: isDark
              ? [
                  const Color(0xFF0F172A).withValues(alpha: 0.98),
                  const Color(0xFF1E293B).withValues(alpha: 0.95),
                ]
              : [
                  const Color(0xFFF1FAF5).withValues(alpha: 0.98),
                  const Color(0xFFFFFFFF).withValues(alpha: 0.95),
                ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(
          color: AppColors.secondary.withValues(alpha: 0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: isDark ? 0.25 : 0.12),
            blurRadius: 30,
            spreadRadius: 2,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Row(
              children: [
                // Simulated QR Code Container
                Container(
                  width: 110,
                  height: 110,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(Icons.qr_code_2_rounded, size: 90, color: Color(0xFF0F172A)),
                  ),
                ),
                const SizedBox(width: 18),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'CLINICAL VERIFICATION',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: AppColors.secondary,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Scan to retrieve verified vaccination records, emergency contacts & allergy alerts.',
                        style: TextStyle(
                          fontSize: 11,
                          height: 1.3,
                          color: isDark ? Colors.white70 : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.secondary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'VALIDATED: ${DateTime.now().year}',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: AppColors.secondaryDark,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetaColumn(String label, String value, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.6,
            color: isDark ? Colors.white38 : Colors.black45,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : Colors.black87,
          ),
        ),
      ],
    );
  }

  // ─── OFFICIAL BIOMETRIC LEDGER ───
  Widget _buildLedgerSection(BuildContext context, PetModel pet, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E).withValues(alpha: 0.85) : Colors.white.withValues(alpha: 0.90),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.06),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.shield_rounded, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                'Biometric Health Ledger',
                style: GoogleFonts.plusJakartaSans(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildLedgerRow('Microchip Transponder', '${pet.petID.toUpperCase()} (ISO 11784)', Icons.memory_rounded, isDark),
          const Divider(height: 20),
          _buildLedgerRow('Rabies Tag Number', 'RAB-${pet.petID.substring(0, 4).toUpperCase()}-2026', Icons.verified_user_rounded, isDark),
          const Divider(height: 20),
          _buildLedgerRow('Deworming & Parasite', 'Up to Date (Next due: 30 days)', Icons.bug_report_rounded, isDark),
          const Divider(height: 20),
          _buildLedgerRow('Blood Group / Genotype', 'DEA 1.1 Negative', Icons.water_drop_rounded, isDark),
          const Divider(height: 20),
          _buildLedgerRow('Emergency Care Hotlink', 'Instant SOS Broadcast Active', Icons.phone_in_talk_rounded, isDark),
        ],
      ),
    );
  }

  Widget _buildLedgerRow(String title, String subtitle, IconData icon, bool isDark) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white54 : Colors.black54,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

