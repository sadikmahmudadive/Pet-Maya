import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/lottie_upload_icon.dart';

class BreedFinderScreen extends StatefulWidget {
  const BreedFinderScreen({super.key});

  @override
  State<BreedFinderScreen> createState() => _BreedFinderScreenState();
}

class _BreedFinderScreenState extends State<BreedFinderScreen> {
  bool _isIdentifying = false;
  String? _identifiedBreed;
  final String _sampleImage = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop';

  void _runIdentification() async {
    setState(() {
      _isIdentifying = true;
      _identifiedBreed = null;
    });

    final breed = await context.read<AppStateRepository>().identifyBreed(imagePath: 'simulated_path');

    if (!mounted) return;
    HapticFeedback.mediumImpact();
    setState(() {
      _isIdentifying = false;
      _identifiedBreed = breed;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('AI Breed Finder', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        systemOverlayStyle: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          children: [
            FadeInDown(
              child: Column(
                children: [
                  Text(
                    'Identify Your Pet',
                    style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w900, fontSize: 32),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Our Vision AI will analyze physical features to determine your pet\'s breed with medical-grade precision.',
                    style: AppTypography.bodyMedium.copyWith(color: Colors.grey[500], height: 1.5, fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 48),

            // Visual Analysis Area
            FadeInUp(
              child: PremiumCard(
                opacity: 0.15,
                borderRadius: 36,
                backgroundColor: isDark ? const Color(0xFF1A1A1A) : const Color(0xFFEDF4F8),
                child: Container(
                  height: 380,
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_identifiedBreed == null && !_isIdentifying)
                        GestureDetector(
                          onTap: _runIdentification,
                          child: Container(
                            height: 240,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white,
                              borderRadius: BorderRadius.circular(28),
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.1), width: 2),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const LottieUploadIcon(size: 64),
                                const SizedBox(height: 16),
                                Text('Tap to capture or upload', 
                                  style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w800, color: AppColors.primary)),
                              ],
                            ),
                          ),
                        ),
                      
                      if (_isIdentifying)
                        Column(
                          children: [
                            const CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary),
                            const SizedBox(height: 24),
                            Text('Analyzing genetic markers...', 
                              style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700, letterSpacing: 1, color: AppColors.primary)),
                          ],
                        ),

                      if (_identifiedBreed != null)
                        FadeIn(
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(color: AppColors.healthGreen.withValues(alpha: 0.1), shape: BoxShape.circle),
                                child: const Icon(Icons.verified_rounded, size: 60, color: AppColors.healthGreen),
                              ),
                              const SizedBox(height: 24),
                              Text('AI PREDICTION', 
                                style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.grey[500])),
                              const SizedBox(height: 8),
                              Text(_identifiedBreed!, 
                                style: AppTypography.headlineMedium.copyWith(fontSize: 34, fontWeight: FontWeight.w900, color: AppColors.primary)),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 60),

            // Control Actions
            if (_identifiedBreed == null)
              FadeInUp(
                delay: const Duration(milliseconds: 200),
                child: SizedBox(
                  width: double.infinity,
                  height: 64,
                  child: ElevatedButton.icon(
                    onPressed: _isIdentifying ? null : _runIdentification,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1AB680),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    ),
                    icon: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 22),
                    label: Text(
                      _isIdentifying ? 'SCANNING...' : 'START VISION ANALYSIS',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1, fontSize: 13),
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
                          backgroundColor: const Color(0xFF1AB680),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        ),
                        child: const Text('CONFIRM BREED TYPE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => setState(() => _identifiedBreed = null),
                      child: Text('NOT QUITE? TRY AGAIN', 
                        style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 1.5)),
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
