import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';

class BreedFinderScreen extends StatefulWidget {
  const BreedFinderScreen({super.key});

  @override
  State<BreedFinderScreen> createState() => _BreedFinderScreenState();
}

class _BreedFinderScreenState extends State<BreedFinderScreen> {
  bool _isIdentifying = false;
  String? _identifiedBreed;

  void _runIdentification() async {
    setState(() {
      _isIdentifying = true;
      _identifiedBreed = null;
    });

    final breed = await context.read<AppStateRepository>().identifyBreed(imagePath: 'simulated_path');

    if (!mounted) return;
    setState(() {
      _isIdentifying = false;
      _identifiedBreed = breed;
    });
  }

  @override
  Widget build(BuildContext context) {
    return GlassScaffold(
      appBar: AppBar(
        title: const Text('AI Breed Finder'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          children: [
            FadeInDown(
              child: Text(
                'Identify Pet Type',
                style: AppTypography.displayLarge.copyWith(fontSize: 32, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Capture or upload a clear photo of your pet to identify their breed instantly using Vision AI.',
              style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary, height: 1.5),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 48),

            // Visual Area
            FadeInUp(
              child: PremiumCard(
                opacity: 0.35,
                borderRadius: 32,
                child: Container(
                  height: 320,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_identifiedBreed == null && !_isIdentifying)
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.05), shape: BoxShape.circle),
                          child: const Icon(Icons.add_a_photo_rounded, size: 64, color: AppColors.primary),
                        ),
                      if (_isIdentifying)
                        const CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary),
                      if (_identifiedBreed != null)
                        Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(color: AppColors.healthGreen.withOpacity(0.1), shape: BoxShape.circle),
                              child: const Icon(Icons.check_circle_outline_rounded, size: 64, color: AppColors.healthGreen),
                            ),
                            const SizedBox(height: 24),
                            Text('IDENTIFICATION COMPLETE', 
                              style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.textTertiary)),
                            const SizedBox(height: 8),
                            Text(_identifiedBreed!, 
                              style: AppTypography.displayLarge.copyWith(fontSize: 34, fontWeight: FontWeight.w700)),
                          ],
                        ),
                    ],
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 60),

            // Controls
            if (_identifiedBreed == null)
              FadeInUp(
                delay: const Duration(milliseconds: 200),
                child: SizedBox(
                  width: double.infinity,
                  height: 64,
                  child: ElevatedButton(
                    onPressed: _isIdentifying ? null : _runIdentification,
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: Text(
                      _isIdentifying ? 'ANALYZING...' : 'START AI SCAN',
                      style: const TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8),
                    ),
                  ),
                ),
              ),
            
            if (_identifiedBreed != null)
              FadeInUp(
                child: Column(
                  children: [
                    SizedBox(
                      width: double.infinity,
                      height: 64,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context, _identifiedBreed),
                        style: ElevatedButton.styleFrom(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                        child: const Text('USE THIS BREED', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.8)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => setState(() => _identifiedBreed = null),
                      child: Text('TRY ANOTHER PHOTO', 
                        style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.primary, letterSpacing: 0.8)),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
