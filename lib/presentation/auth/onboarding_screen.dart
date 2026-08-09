import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';
import 'login_screen.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: 'Digital Health Vault',
      description: 'Store and track your pet\'s medical history, vaccinations, and allergies in one safe place.',
      icon: Icons.health_and_safety_rounded,
    ),
    OnboardingData(
      title: 'AI Health Scanner',
      description: 'Get instant insights on common pet symptoms using our advanced Vision AI diagnostic tool.',
      icon: Icons.auto_awesome_rounded,
    ),
    OnboardingData(
      title: 'Premium Services',
      description: 'Book verified veterinarians, groomers, and boarding facilities with just a few taps.',
      icon: Icons.pets_rounded,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
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
            PageView.builder(
              controller: _pageController,
              itemCount: _pages.length + 1, // +1 for welcome page
              onPageChanged: (index) => setState(() => _currentPage = index),
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _buildWelcomePage();
                }
                return _buildOnboardingPage(index - 1);
              },
            ),
            
            // Floating Navigation UI (iOS style)
            if (_currentPage != 0) 
              Positioned(
                bottom: 40,
                left: 40,
                right: 40,
                child: FadeInUp(
                  duration: const Duration(milliseconds: 600),
                  child: Column(
                    children: [
                      _buildPageIndicator(),
                      const SizedBox(height: 32),
                      _buildMainButton(),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomePage() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return LayoutBuilder(builder: (context, constraints) {
      final height = constraints.maxHeight;
      final width = constraints.maxWidth;

      return Stack(
        alignment: Alignment.center,
        children: [
          // Background abstract gradients
          Positioned(
            top: -height * 0.1,
            right: -width * 0.2,
            child: _buildBlob(width * 0.8, AppColors.primary.withValues(alpha: isDark ? 0.12 : 0.08)),
          ),
          Positioned(
            bottom: height * 0.1,
            left: -width * 0.1,
            child: _buildBlob(width * 0.6, AppColors.secondary.withOpacity(isDark ? 0.08 : 0.05)),
          ),

          Center(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: width * 0.1),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 60),
                    FadeInDown(
                      duration: const Duration(milliseconds: 800),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: isDark ? 0.3 : 0.15),
                              blurRadius: 40,
                              offset: const Offset(0, 20),
                            ),
                          ],
                        ),
                        child: const Icon(Icons.pets_rounded, size: 80, color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(height: 40),
                    FadeInUp(
                      duration: const Duration(milliseconds: 800),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Pet Maya',
                            style: GoogleFonts.fredoka(
                              fontSize: 48,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.textPrimaryDark : AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Professional Care for Your Best Friends',
                            textAlign: TextAlign.center,
                            style: AppTypography.bodyMedium.copyWith(
                              fontSize: 16,
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 60),
                    FadeInUp(
                      delay: const Duration(milliseconds: 400),
                      child: _buildGetStartedButton(width),
                    ),
                    const SizedBox(height: 60),
                    FadeInUp(
                      delay: const Duration(milliseconds: 600),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _buildPartnerSubSection(
                                isDark: isDark,
                                label: 'SUPPORTED BY',
                                logo: Text('VertexHand', 
                                  style: GoogleFonts.fredoka(
                                    fontSize: 16, 
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.white : AppColors.primary,
                                  )),
                              ),
                              const SizedBox(width: 40),
                              _buildPartnerSubSection(
                                isDark: isDark,
                                label: 'DEVELOPED BY',
                                logo: Image.asset(
                                  'assets/images/masa_logo.png',
                                  height: 32,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
      );
    });
  }

  Widget _buildBlob(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [color, color.withOpacity(0)],
        ),
      ),
    );
  }

  Widget _buildOnboardingPage(int index) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return LayoutBuilder(builder: (context, constraints) {
      final height = constraints.maxHeight;
      final width = constraints.maxWidth;

      return Padding(
        padding: EdgeInsets.symmetric(horizontal: width * 0.12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Spacer(flex: 2),
            FadeInDown(
              duration: const Duration(milliseconds: 600),
              child: Container(
                padding: EdgeInsets.all(width * 0.1),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(isDark ? 0.12 : 0.05),
                  borderRadius: BorderRadius.circular(width * 0.2),
                ),
                child: Icon(_pages[index].icon, size: height * 0.12, color: AppColors.primary),
              ),
            ),
            const SizedBox(height: 60),
            FadeInUp(
              duration: const Duration(milliseconds: 600),
              child: Column(
                children: [
                  Text(
                    _pages[index].title,
                    style: AppTypography.displayLarge.copyWith(
                      fontSize: 32,
                      fontWeight: FontWeight.w700,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    _pages[index].description,
                    style: AppTypography.bodyMedium.copyWith(
                      fontSize: 16,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
                      height: 1.6,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const Spacer(flex: 3),
          ],
        ),
      );
    });
  }

  Widget _buildPageIndicator() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        _pages.length + 1,
        (index) => AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.only(right: 8),
          height: 6,
          width: _currentPage == index ? 24 : 6,
          decoration: BoxDecoration(
            color: _currentPage == index ? AppColors.primary : AppColors.primary.withOpacity(isDark ? 0.3 : 0.2),
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    );
  }

  Widget _buildMainButton() {
    final isLastPage = _currentPage == _pages.length;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SizedBox(
      width: double.infinity,
      height: 64,
      child: PremiumCard(
        onTap: () {
          if (isLastPage) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
          } else {
            _pageController.nextPage(duration: const Duration(milliseconds: 600), curve: Curves.easeInOutCubic);
          }
        },
        useGlass: false,
        borderRadius: 20,
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: const Color(0xFF006684),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF006684).withOpacity(isDark ? 0.4 : 0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Text(
            isLastPage ? 'GET STARTED' : 'CONTINUE',
            style: AppTypography.titleMedium.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGetStartedButton(double screenWidth) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: () {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 600),
          curve: Curves.easeInOutCubic,
        );
      },
      child: Container(
        height: 70,
        width: screenWidth * 0.8,
        decoration: BoxDecoration(
          color: const Color(0xFF006684),
          borderRadius: BorderRadius.circular(35),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF006684).withOpacity(isDark ? 0.5 : 0.3),
              blurRadius: 30,
              offset: const Offset(0, 15),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              left: 6,
              top: 6,
              bottom: 6,
              child: Container(
                width: 58,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : Colors.white,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: isDark ? Colors.white : AppColors.primaryDark,
                  size: 20,
                ),
              ),
            ),
            const Center(
              child: Text(
                'EXPLORE PET MAYA',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPartnerSubSection({required bool isDark, required String label, required Widget logo}) {
    return Column(
      children: [
        Text(
          label,
          style: AppTypography.labelSmall.copyWith(
            fontSize: 8, 
            fontWeight: FontWeight.w800, 
            letterSpacing: 1.2,
            color: isDark ? AppColors.textSecondaryDark.withValues(alpha: 0.5) : AppColors.textTertiary,
          ),
        ),
        const SizedBox(height: 8),
        logo,
      ],
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final IconData icon;

  OnboardingData({required this.title, required this.description, required this.icon});
}
