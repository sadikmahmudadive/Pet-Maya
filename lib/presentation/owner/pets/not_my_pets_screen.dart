import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/other_animal_model.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/empty_state.dart';
import '../../common_widgets/formatted_ai_report.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/premium_toast.dart';
import '../../common_widgets/resilient_network_image.dart';
import 'ai_health_scanner_screen.dart';

String _day(int millis) => millis <= 0 ? '' : DateTime.fromMillisecondsSinceEpoch(millis).toString().substring(0, 10);

/// The small "NOT YOUR PET" label used on the profile and in the lists.
class NotYourPetBadge extends StatelessWidget {
  const NotYourPetBadge({super.key});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.accentAmber.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.accentAmber.withValues(alpha: 0.35)),
      ),
      child: Text(
        'NOT YOUR PET',
        style: TextStyle(
          fontSize: 8.5,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.5,
          color: AppColors.accentAmber.withValues(alpha: 0.95),
        ),
      ),
    );
  }
}

/// Avatar for an animal: its photo, or a paw on a tinted circle.
class OtherAnimalAvatar extends StatelessWidget {
  final OtherAnimalModel animal;
  final double radius;
  const OtherAnimalAvatar({super.key, required this.animal, this.radius = 28});
  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.accentAmber.withValues(alpha: 0.15),
      backgroundImage: animal.photoUrl != null ? appImageProvider(animal.photoUrl!) : null,
      child: animal.photoUrl == null
          ? Icon(Icons.pets_rounded, size: radius * 0.7, color: AppColors.accentAmber)
          : null,
    );
  }
}

void openScannerForNewAnimal(BuildContext context) {
  Navigator.push(
    context,
    MaterialPageRoute(builder: (_) => const AiHealthScannerScreen(startAsNotMine: true)),
  );
}

/// Everything the user saved with the scanner that is not their own pet. Shown beside Pet Family on the profile.
class NotMyPetsScreen extends StatelessWidget {
  const NotMyPetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final animals = context.select((AppStateRepository s) => s.otherAnimals);

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Not Your Pets'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Scan an animal',
            icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary),
            onPressed: () => openScannerForNewAnimal(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
            sliver: animals.isEmpty
                ? SliverFillRemaining(
                    child: EmptyState(
                      icon: Icons.travel_explore_rounded,
                      title: 'No animals saved yet',
                      message:
                          "Scan a stray, or a pet that belongs to someone else, with the AI Health Scanner and save it here. It stays separate from your own pets.",
                      actionLabel: 'Scan an animal',
                      onAction: () => openScannerForNewAnimal(context),
                    ),
                  )
                : SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => FadeInUp(
                        delay: Duration(milliseconds: 80 * index.clamp(0, 6)),
                        child: _AnimalTile(animal: animals[index]),
                      ),
                      childCount: animals.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _AnimalTile extends StatelessWidget {
  final OtherAnimalModel animal;
  const _AnimalTile({required this.animal});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: PremiumCard(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => OtherAnimalDetailScreen(animalId: animal.id)),
        ),
        opacity: 0.3,
        borderRadius: 28,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              OtherAnimalAvatar(animal: animal, radius: 32),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      animal.displayName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      animal.subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySmall.copyWith(color: AppColors.textTertiary),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const NotYourPetBadge(),
                        if (animal.lastUrgent)
                          Text(
                            'URGENT',
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: AppColors.dangerRed,
                              letterSpacing: 0.5,
                            ),
                          ),
                        Text(
                          '${animal.scanCount} scan${animal.scanCount == 1 ? '' : 's'} · ${_day(animal.lastScanAt)}',
                          style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary, fontSize: 10),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.textTertiary),
            ],
          ),
        ),
      ),
    );
  }
}

/// One saved animal: who it is, a "Scan again" shortcut, and every report saved for it.
class OtherAnimalDetailScreen extends StatefulWidget {
  final String animalId;
  const OtherAnimalDetailScreen({super.key, required this.animalId});

  @override
  State<OtherAnimalDetailScreen> createState() => _OtherAnimalDetailScreenState();
}

class _OtherAnimalDetailScreenState extends State<OtherAnimalDetailScreen> {
  Future<List<OtherAnimalScan>>? _scans;
  int _loadedCount = -1;

  void _load() {
    _scans = context.read<AppStateRepository>().fetchOtherAnimalScans(widget.animalId);
  }

  Future<void> _delete(OtherAnimalModel animal) async {
    final repo = context.read<AppStateRepository>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Remove ${animal.displayName}?'),
        content: const Text('This deletes the animal and all of its saved scan reports. It cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Delete', style: TextStyle(color: AppColors.dangerRed)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    HapticFeedback.mediumImpact();
    try {
      await repo.deleteOtherAnimal(animal.id);
      if (mounted) Navigator.pop(context);
    } catch (_) {
      if (mounted) {
        repo.showToast('Could not delete. Please try again.', type: ToastType.error, context: context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final animal = context.select(
      (AppStateRepository s) => s.otherAnimals.where((a) => a.id == widget.animalId).firstOrNull,
    );
    if (animal == null) {
      // Deleted (or not loaded yet).
      return const GlassScaffold(body: Center(child: CircularProgressIndicator()));
    }
    // Reload the reports when a new scan is added from "Scan again".
    if (_scans == null || _loadedCount != animal.scanCount) {
      _loadedCount = animal.scanCount;
      _load();
    }

    return GlassScaffold(
      appBar: AppBar(
        title: Text(animal.displayName),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Remove',
            icon: Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed),
            onPressed: () => _delete(animal),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: ListView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 60),
        children: [
          PremiumCard(
            opacity: 0.3,
            borderRadius: 28,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      OtherAnimalAvatar(animal: animal, radius: 36),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(animal.subtitle, style: AppTypography.titleMedium.copyWith(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 6),
                            const NotYourPetBadge(),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (animal.note.trim().isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.place_outlined, size: 16, color: AppColors.textTertiary),
                        const SizedBox(width: 8),
                        Expanded(child: Text(animal.note.trim(), style: AppTypography.bodySmall)),
                      ],
                    ),
                  ],
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.document_scanner_rounded, size: 18),
                      label: const Text('SCAN AGAIN', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.6)),
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => AiHealthScannerScreen(initialOtherAnimal: animal)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'SAVED REPORTS',
            style: AppTypography.labelSmall.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppColors.textTertiary,
              fontSize: 10,
            ),
          ),
          const SizedBox(height: 12),
          FutureBuilder<List<OtherAnimalScan>>(
            future: _scans,
            builder: (context, snap) {
              if (snap.connectionState != ConnectionState.done) {
                return const Padding(
                  padding: EdgeInsets.all(24),
                  child: Center(child: CircularProgressIndicator()),
                );
              }
              if (snap.hasError) {
                return Text('Could not load the reports. Check your connection and try again.', style: AppTypography.bodySmall);
              }
              final scans = snap.data ?? const <OtherAnimalScan>[];
              if (scans.isEmpty) return Text('No reports saved yet.', style: AppTypography.bodySmall);
              return Column(children: scans.map((s) => _ScanTile(scan: s)).toList());
            },
          ),
        ],
      ),
    );
  }
}

class _ScanTile extends StatelessWidget {
  final OtherAnimalScan scan;
  const _ScanTile({required this.scan});

  @override
  Widget build(BuildContext context) {
    final color = scan.urgent ? AppColors.dangerRed : AppColors.primary;
    final thumb = scan.imageUrl != null ? appImageProvider(scan.imageUrl!) : null;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: PremiumCard(
        opacity: 0.2,
        borderRadius: 22,
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
            childrenPadding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            leading: thumb != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image(image: thumb, width: 44, height: 44, fit: BoxFit.cover),
                  )
                : Icon(Icons.auto_awesome_rounded, color: color),
            title: Text(
              _day(scan.timestamp),
              style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w800),
            ),
            subtitle: Text(
              scan.issue.isEmpty ? 'Photo scan' : scan.issue,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.bodySmall.copyWith(color: AppColors.textTertiary),
            ),
            trailing: Text(
              scan.urgent ? 'URGENT' : 'ADVISORY',
              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.5, color: color),
            ),
            children: [FormattedAiReport(text: scan.diagnosis)],
          ),
        ),
      ),
    );
  }
}
