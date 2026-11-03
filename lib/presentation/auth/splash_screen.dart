import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/user_model.dart';
import 'onboarding_screen.dart';
import '../owner/home/owner_home_screen.dart';
import '../provider/vet_dashboard_screen.dart';
import '../merchant/pet_shop_dashboard_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../common_widgets/illustrations/pet_illustrations.dart';
import '../common_widgets/motion/soft_motion.dart';
import '../common_widgets/soft_backdrop.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _scaleAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutBack,
    );

    _fadeAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeIn,
    );

    _animController.forward();

    Future.delayed(const Duration(milliseconds: 2000), () {
      _checkSessionAndNavigate();
    });
  }

  void _checkSessionAndNavigate() async {
    if (!mounted) return;
    final state = context.read<AppStateRepository>();

    // Wait until the session restoration attempt is finished
    int attempts = 0;
    while (!state.isInitialized && attempts < 25) {
      await Future.delayed(const Duration(milliseconds: 200));
      attempts++;
    }

    if (!mounted) return;

    if (state.isAuthenticated) {
      final role = state.currentUser!.role;
      Widget destination;
      switch (role) {
        case UserRole.veterinarian:
        case UserRole.grooming:
        case UserRole.boarding:
        case UserRole.shelter:
          destination = const VetDashboardScreen();
          break;
        case UserRole.petShop:
          destination = const PetShopDashboardScreen();
          break;
        case UserRole.admin:
        case UserRole.superAdmin:
          destination = const AdminDashboardScreen();
          break;
        default:
          destination = const OwnerHomeScreen();
      }
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => destination,
          transitionsBuilder: (context, anim, secondaryAnim, child) => FadeTransition(opacity: anim, child: child),
        ),
      );
    } else {
      Navigator.pushReplacement(
        context,
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const OnboardingScreen(),
          transitionsBuilder: (context, anim, secondaryAnim, child) => FadeTransition(opacity: anim, child: child),
        ),
      );
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final ink = isDark ? AppColors.textPrimaryDark : AppColors.textPrimary;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        body: Stack(
          children: [
            const SoftBackdrop(),
            SafeArea(
              child: Column(
                children: [
                  Expanded(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          ScaleTransition(
                            scale: _scaleAnimation,
                            child: const PetCharacter(kind: PetKind.dog, size: 190),
                          ),
                          const SizedBox(height: 18),
                          Reveal(
                            delay: const Duration(milliseconds: 250),
                            child: Text(
                              'Pet Maya',
                              style: AppTypography.displayLarge.copyWith(
                                fontSize: 50,
                                color: isDark ? ink : AppColors.primaryDark,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Reveal(
                            delay: const Duration(milliseconds: 420),
                            child: Text(
                              'Loving care for your best friends',
                              style: AppTypography.bodyLarge.copyWith(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  FadeTransition(
                    opacity: _fadeAnimation,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 28),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Supported by', style: AppTypography.labelMedium.copyWith(color: AppColors.textTertiary)),
                          const SizedBox(height: 4),
                          Text('VertexHand', style: AppTypography.titleMedium.copyWith(color: ink)),
                          const SizedBox(height: 16),
                          Text('Developed by', style: AppTypography.labelMedium.copyWith(color: AppColors.textTertiary)),
                          const SizedBox(height: 8),
                          Image.asset('assets/images/masa_logo.png', height: 44),
                        ],
                      ),
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
