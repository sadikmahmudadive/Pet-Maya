import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../common_widgets/illustrations/pet_illustrations.dart';
import '../common_widgets/motion/soft_motion.dart';
import '../common_widgets/soft_backdrop.dart';
import 'login_screen.dart';

/// First-run flow: a welcome page with both pets, then three illustrated pages, then sign in.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  static const _pages = <_OnboardingPage>[
    _OnboardingPage(
      title: 'A health vault for every pet',
      description: "Keep your pet's medical history, vaccinations and allergies together, safe and always in your pocket.",
      scene: IllustrationScene.care,
    ),
    _OnboardingPage(
      title: 'Ask the AI health scanner',
      description: 'Snap a photo and describe the symptoms for quick, caring guidance. It even works for strays you meet.',
      scene: IllustrationScene.noAnimals,
    ),
    _OnboardingPage(
      title: 'Book trusted care',
      description: 'Verified vets, groomers and boarding, a few taps away, with reminders so nothing is missed.',
      scene: IllustrationScene.noAppointments,
    ),
  ];

  int get _count => _pages.length + 1; // welcome + pages

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _toLogin() {
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _next() {
    if (_currentPage >= _count - 1) {
      _toLogin();
    } else {
      _pageController.nextPage(duration: const Duration(milliseconds: 520), curve: SoftMotion.out);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isWelcome = _currentPage == 0;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: isDark ? Brightness.light : Brightness.dark,
        statusBarBrightness: isDark ? Brightness.dark : Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: Stack(
          children: [
            const SoftBackdrop(),
            SafeArea(
              child: Column(
                children: [
                  // Skip, so nobody is stuck behind three pages they do not need.
                  SizedBox(
                    height: 52,
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: AnimatedOpacity(
                        opacity: isWelcome ? 0 : 1,
                        duration: const Duration(milliseconds: 250),
                        child: IgnorePointer(
                          ignoring: isWelcome,
                          child: TextButton(
                            onPressed: _toLogin,
                            style: TextButton.styleFrom(minimumSize: const Size(64, 48)),
                            child: const Text('Skip'),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: PageView.builder(
                      controller: _pageController,
                      itemCount: _count,
                      onPageChanged: (i) {
                        HapticFeedback.selectionClick();
                        setState(() => _currentPage = i);
                      },
                      itemBuilder: (context, i) => i == 0 ? const _WelcomePage() : _StoryPage(page: _pages[i - 1], active: _currentPage == i),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(28, 8, 28, 28),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _Dots(count: _count, current: _currentPage),
                        const SizedBox(height: 22),
                        _BigButton(label: _currentPage == _count - 1 ? 'Get started' : (isWelcome ? 'Explore Pet Maya' : 'Continue'), onTap: _next),
                      ],
                    ),
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

class _WelcomePage extends StatelessWidget {
  const _WelcomePage();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ink = isDark ? AppColors.textPrimaryDark : AppColors.textPrimary;
    final muted = isDark ? AppColors.textSecondaryDark : AppColors.textSecondary;
    return LayoutBuilder(
      builder: (context, c) {
        final hero = (c.maxHeight * 0.4).clamp(150.0, 260.0);
        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: c.maxHeight),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Reveal(
                  child: SizedBox(
                    width: hero * 1.85,
                    height: hero,
                    child: Stack(
                      alignment: Alignment.bottomCenter,
                      children: [
                        Positioned(left: 0, bottom: 0, child: Floating(distance: 5, child: PetCharacter(kind: PetKind.dog, size: hero * 0.95))),
                        Positioned(right: 0, bottom: 0, child: Floating(distance: 5, phase: 0.5, child: PetCharacter(kind: PetKind.cat, size: hero * 0.95))),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Reveal(
                  index: 1,
                  child: Text(
                    'Pet Maya',
                    style: AppTypography.displayLarge.copyWith(fontSize: 52, color: isDark ? ink : AppColors.primaryDark),
                  ),
                ),
                const SizedBox(height: 10),
                Reveal(
                  index: 2,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 36),
                    child: Text(
                      'Loving care for your best friends, all in one app.',
                      textAlign: TextAlign.center,
                      style: AppTypography.bodyLarge.copyWith(color: muted, height: 1.45),
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                Reveal(
                  index: 3,
                  child: Text('Supported by VertexHand', style: AppTypography.labelMedium.copyWith(color: AppColors.textTertiary)),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _StoryPage extends StatelessWidget {
  final _OnboardingPage page;
  final bool active;
  const _StoryPage({required this.page, required this.active});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return LayoutBuilder(
      builder: (context, c) {
        final art = (c.maxHeight * 0.5).clamp(170.0, 330.0);
        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: c.maxHeight),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Re-keyed when the page becomes active so the entrance plays as you arrive on it.
                  Reveal(key: ValueKey('art-$active'), child: SoftIllustration(scene: page.scene, size: art)),
                  const SizedBox(height: 24),
                  Reveal(
                    key: ValueKey('title-$active'),
                    index: 1,
                    child: Text(
                      page.title,
                      textAlign: TextAlign.center,
                      style: AppTypography.displaySmall.copyWith(color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimary),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Reveal(
                    key: ValueKey('text-$active'),
                    index: 2,
                    child: Text(
                      page.description,
                      textAlign: TextAlign.center,
                      style: AppTypography.bodyLarge.copyWith(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                        height: 1.55,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _Dots extends StatelessWidget {
  final int count;
  final int current;
  const _Dots({required this.count, required this.current});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Page ${current + 1} of $count',
      excludeSemantics: true,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (var i = 0; i < count; i++)
            AnimatedContainer(
              duration: const Duration(milliseconds: 320),
              curve: SoftMotion.out,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              height: 8,
              width: i == current ? 28 : 8,
              decoration: BoxDecoration(
                color: i == current ? AppColors.primary : AppColors.primary.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
        ],
      ),
    );
  }
}

class _BigButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _BigButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Semantics(
      button: true,
      label: label,
      excludeSemantics: true,
      onTap: onTap,
      child: Pressable(
        onTap: onTap,
        child: Container(
          width: double.infinity,
          height: 60,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.primaryStrong,
            borderRadius: BorderRadius.circular(AppRadius.lg),
            boxShadow: AppShadows.soft(isDark, tint: AppColors.primaryStrong),
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Text(
              label,
              key: ValueKey(label),
              style: AppTypography.titleMedium.copyWith(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 17),
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingPage {
  final String title;
  final String description;
  final IllustrationScene scene;
  const _OnboardingPage({required this.title, required this.description, required this.scene});
}
