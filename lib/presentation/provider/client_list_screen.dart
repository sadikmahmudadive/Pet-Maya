import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/pet_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import '../owner/pets/pet_details_screen.dart';
import '../owner/pets/add_edit_pet_screen.dart';
import 'add_service_record_modal.dart';

class ClientListScreen extends StatefulWidget {
  const ClientListScreen({super.key});

  @override
  State<ClientListScreen> createState() => _ClientListScreenState();
}

class _ClientListScreenState extends State<ClientListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedSpecies = 'ALL';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Fallback demo clinical patients if Firestore has no pets yet
  List<PetModel> _getFallbackPatients() {
    return [
      PetModel(
        petID: 'pm_p101',
        ownerID: 'owner_alex',
        name: 'Bella',
        type: 'Dog',
        breed: 'Golden Retriever',
        gender: 'Female',
        age: '3 yrs',
        dob: '2023-04-12',
        weight: '28 kg',
        photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400',
        vaccinationDetails: 'DHPP Booster Due Nov 2026',
        description: 'Friendly golden retriever, sensitive skin history.',
      ),
      PetModel(
        petID: 'pm_p102',
        ownerID: 'owner_elena',
        name: 'Milo',
        type: 'Cat',
        breed: 'British Shorthair',
        gender: 'Male',
        age: '2 yrs',
        dob: '2024-02-18',
        weight: '4.5 kg',
        photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
        vaccinationDetails: 'Rabies Vaccinated (Valid 2027)',
        description: 'Indoor cat, regular dental cleaning checkups.',
      ),
      PetModel(
        petID: 'pm_p103',
        ownerID: 'owner_david',
        name: 'Luna',
        type: 'Dog',
        breed: 'French Bulldog',
        gender: 'Female',
        age: '1 yr',
        dob: '2025-01-10',
        weight: '11 kg',
        photoUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
        vaccinationDetails: 'Puppy Core Series Completed',
        description: 'Brachycephalic respiratory monitoring.',
      ),
      PetModel(
        petID: 'pm_p104',
        ownerID: 'owner_sophia',
        name: 'Coco',
        type: 'Cat',
        breed: 'Siamese',
        gender: 'Male',
        age: '4 yrs',
        dob: '2022-09-05',
        weight: '3.8 kg',
        photoUrl: 'https://images.unsplash.com/photo-1513360309081-38f076273999?w=400',
        vaccinationDetails: 'FVRCP Current',
        description: 'Mild seasonal allergy management.',
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final livePets = context.select((AppStateRepository state) => state.pets);
    final state = context.read<AppStateRepository>();
    final user = state.currentUser;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final allPatients = livePets.isNotEmpty ? livePets : _getFallbackPatients();

    final filteredPatients = allPatients.where((pet) {
      final q = _searchQuery.toLowerCase();
      final matchesSearch = q.isEmpty ||
          pet.name.toLowerCase().contains(q) ||
          pet.breed.toLowerCase().contains(q) ||
          pet.petID.toLowerCase().contains(q) ||
          pet.type.toLowerCase().contains(q);

      final matchesSpecies = _selectedSpecies == 'ALL' ||
          pet.type.toUpperCase() == _selectedSpecies;

      return matchesSearch && matchesSpecies;
    }).toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Patient Directory & EHR', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_alt_1_rounded, color: AppColors.primary),
            onPressed: () {
              HapticFeedback.lightImpact();
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AddEditPetScreen()));
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          CupertinoSliverRefreshControl(
            onRefresh: () async {
              HapticFeedback.mediumImpact();
              if (user != null) await state.syncFromFirebase(user);
            },
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Bar
                  FadeInDown(
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0x33FFFFFF) : Colors.white.withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.black.withValues(alpha: 0.08),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val.trim()),
                        style: TextStyle(fontWeight: FontWeight.w600, color: isDark ? Colors.white : Colors.black87),
                        decoration: InputDecoration(
                          hintText: 'Search by pet name, breed, or ID...',
                          hintStyle: TextStyle(color: Colors.grey[500], fontSize: 14),
                          prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded, size: 18),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Species Filters
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: [
                        _buildFilterChip('ALL', '🌟 All (${allPatients.length})', isDark),
                        const SizedBox(width: 8),
                        _buildFilterChip('DOG', '🐕 Dogs (${allPatients.where((p) => p.type.toUpperCase() == 'DOG').length})', isDark),
                        const SizedBox(width: 8),
                        _buildFilterChip('CAT', '🐈 Cats (${allPatients.where((p) => p.type.toUpperCase() == 'CAT').length})', isDark),
                        const SizedBox(width: 8),
                        _buildFilterChip('BIRD', '🦜 Birds', isDark),
                        const SizedBox(width: 8),
                        _buildFilterChip('RABBIT', '🐇 Rabbits', isDark),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Header Info
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Registered Patients',
                        style: AppTypography.titleLarge.copyWith(fontWeight: FontWeight.w900, fontSize: 19),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${filteredPatients.length} EHR RECORDS',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                ],
              ),
            ),
          ),

          if (filteredPatients.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.pets_rounded, color: AppColors.primary, size: 48),
                      ),
                      const SizedBox(height: 20),
                      Text('No Patients Found', style: AppTypography.headlineSmall.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 8),
                      Text(
                        _searchQuery.isNotEmpty
                            ? 'No patient records match "$_searchQuery".'
                            : 'No patients registered in the directory yet.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[500], fontSize: 14),
                      ),
                      const SizedBox(height: 24),
                      if (_searchQuery.isNotEmpty)
                        ElevatedButton(
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _searchQuery = '';
                              _selectedSpecies = 'ALL';
                            });
                          },
                          child: const Text('Reset Search Filters'),
                        ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final pet = filteredPatients[index];
                    return FadeInUp(
                      delay: Duration(milliseconds: 30 * index),
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: _buildPatientCard(context, pet, isDark),
                      ),
                    );
                  },
                  childCount: filteredPatients.length,
                ),
              ),
            ),
          const SliverToBoxAdapter(child: SizedBox(height: 140)),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String speciesKey, String label, bool isDark) {
    final isSelected = _selectedSpecies == speciesKey;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _selectedSpecies = speciesKey);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : (isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.7)),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 1.2,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
            color: isSelected ? Colors.white : (isDark ? Colors.white70 : Colors.black87),
          ),
        ),
      ),
    );
  }

  Widget _buildPatientCard(BuildContext context, PetModel pet, bool isDark) {
    return PremiumCard(
      opacity: 0.2,
      borderRadius: 26,
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PetDetailsScreen(petId: pet.petID))),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            Row(
              children: [
                Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.4), width: 2),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(30),
                        child: Image.network(
                          pet.photoUrl ?? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400',
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            width: 60,
                            height: 60,
                            color: AppColors.primary.withValues(alpha: 0.1),
                            child: const Icon(Icons.pets_rounded, color: AppColors.primary),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Color(0xFF22C55E),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.check_rounded, color: Colors.white, size: 10),
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            pet.name,
                            style: AppTypography.titleMedium.copyWith(
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                              letterSpacing: -0.3,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'ID: ${pet.petID.toUpperCase()}',
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w900,
                                fontSize: 9,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${pet.breed} • ${pet.gender} • ${pet.age}',
                        style: TextStyle(
                          color: isDark ? Colors.white70 : Colors.black54,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      if (pet.vaccinationDetails != null && pet.vaccinationDetails!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          '💉 ${pet.vaccinationDetails}',
                          style: TextStyle(
                            color: AppColors.healthGreen,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      Navigator.push(context, MaterialPageRoute(builder: (_) => PetDetailsScreen(petId: pet.petID)));
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Center(
                        child: Text(
                          'View EHR History',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => AddServiceRecordModal(initialPet: pet),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1AB680),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF1AB680).withValues(alpha: 0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.note_add_rounded, color: Colors.white, size: 14),
                          SizedBox(width: 6),
                          Text(
                            'Add Clinical Log',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
