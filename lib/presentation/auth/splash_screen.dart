import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/user_model.dart';
import 'onboarding_screen.dart';
import 'login_screen.dart';
import '../owner/home/owner_home_screen.dart';
import '../provider/vet_dashboard_screen.dart';
import '../merchant/pet_shop_dashboard_screen.dart';
import '../admin/admin_dashboard_screen.dart';

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
          destination = const VetDashboardScreen();
          break;
        case UserRole.petShop:
          destination = const PetShopDashboardScreen();
          break;
        case UserRole.admin:
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
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.primary,
        body: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ScaleTransition(
                  scale: _scaleAnimation,
                  child: Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 30,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.pets_rounded,
                      size: 64,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Pet Maya',
                  style: AppTypography.displayLarge.copyWith(
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Professional Care for Your Best Friends',
                  style: AppTypography.bodyMedium.copyWith(
                    color: AppColors.primaryLight,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
        bottomNavigationBar: FadeTransition(
          opacity: _fadeAnimation,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 40),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'DEVELOPED BY',
                  style: AppTypography.labelSmall.copyWith(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 16),
                Image.asset(
                  'assets/images/masa_logo.png',
                  height: 90,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
