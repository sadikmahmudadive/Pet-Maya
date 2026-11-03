import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/user_model.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import 'register_screen.dart';
import '../owner/home/owner_home_screen.dart';
import '../provider/vet_dashboard_screen.dart';
import '../merchant/pet_shop_dashboard_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../common_widgets/google_logo.dart';
import '../common_widgets/illustrations/pet_illustrations.dart';
import '../common_widgets/motion/soft_motion.dart';
import '../../core/theme/app_typography.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  bool _obscurePassword = true;
  bool _signingIn = false;

  @override
  void initState() {
    super.initState();
    _emailFocus.addListener(() => setState(() {}));
    _passwordFocus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    
    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email and password')),
      );
      return;
    }

    setState(() => _signingIn = true);

    final state = context.read<AppStateRepository>();

    try {
      await state.signInWithEmail(
        email: email,
        password: password,
      );

      if (!mounted) return;
      setState(() => _signingIn = false);

      _navigateToDashboard(state.currentUser!.role);
    } catch (e) {
      if (!mounted) return;
      setState(() => _signingIn = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Login failed: ${e.toString()}'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
    }
  }

  Future<void> _handleGoogleLogin() async {
    setState(() => _signingIn = true);
    final state = context.read<AppStateRepository>();
    
    try {
      await state.loginWithGoogle();
      if (!mounted) return;
      
      if (state.isAuthenticated) {
        _navigateToDashboard(state.currentUser!.role);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Google login failed: ${e.toString()}'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
    } finally {
      if (mounted) setState(() => _signingIn = false);
    }
  }

  Future<void> _handleForgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your email first to reset password')),
      );
      return;
    }

    try {
      final state = context.read<AppStateRepository>();
      await state.sendPasswordResetEmail(email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password reset link sent! Check your inbox 📧'),
          backgroundColor: AppColors.healthGreen,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to send reset link: ${e.toString()}'),
          backgroundColor: AppColors.dangerRed,
        ),
      );
    }
  }

  void _navigateToDashboard(UserRole role) {
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
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final orientation = MediaQuery.of(context).orientation;
    final isLandscape = orientation == Orientation.landscape;

    return GlassScaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 800),
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: isLandscape ? _buildLandscapeLayout(context, size, isDark) : _buildPortraitLayout(context, size, isDark),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPortraitLayout(BuildContext context, Size size, bool isDark) {
    return Column(
      children: [
        SizedBox(height: size.height * 0.05),
        _buildHeader(size, isDark),
        SizedBox(height: size.height * 0.04),
        Reveal(index: 3, child: _buildLoginForm(size)),
        SizedBox(height: size.height * 0.05),
      ],
    );
  }

  Widget _buildLandscapeLayout(BuildContext context, Size size, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          flex: 4,
          child: _buildHeader(size, isDark),
        ),
        const SizedBox(width: 48),
        Expanded(
          flex: 6,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 24),
              _buildLoginForm(size),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildHeader(Size size, bool isDark) {
    final petSize = (size.height * 0.2).clamp(110.0, 170.0);
    return Column(
      children: [
        Reveal(child: Floating(distance: 5, child: PetCharacter(kind: PetKind.cat, size: petSize))),
        const SizedBox(height: 12),
        Reveal(
          index: 1,
          child: Text(
            'Welcome back',
            style: AppTypography.displayMedium.copyWith(color: isDark ? Colors.white : AppColors.primaryDark),
          ),
        ),
        const SizedBox(height: 8),
        Reveal(
          index: 2,
          child: Text(
            'Sign in to see how your pets are doing today.',
            textAlign: TextAlign.center,
            style: AppTypography.bodyLarge.copyWith(
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoginForm(Size size) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;
    return Column(
      children: [
        _buildStyledTextField(
          controller: _emailController,
          focusNode: _emailFocus,
          hintText: 'Email',
          icon: Icons.email_rounded,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 12),
        _buildStyledTextField(
          controller: _passwordController,
          focusNode: _passwordFocus,
          hintText: 'Password',
          icon: Icons.lock_rounded,
          isPassword: true,
          obscureText: _obscurePassword,
          onSuffixTap: () => setState(() => _obscurePassword = !_obscurePassword),
        ),

        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: _handleForgotPassword,
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.primary,
              padding: const EdgeInsets.symmetric(horizontal: 4),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text(
              'Forgot Password?',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
        ),
        SizedBox(height: size.height * 0.03),

        _buildLoginButton(),
        const SizedBox(height: 16),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              "Don't have an account? ",
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 13),
            ),
            GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen())),
              child: Text(
                'Sign Up',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        _buildSocialDivider(),
        const SizedBox(height: 24),

        _buildSocialButton(
          label: 'Continue with Google',
          icon: '',
          onTap: _handleGoogleLogin,
        ),
        SizedBox(height: bottomPadding > 0 ? 20 : 0),
      ],
    );
  }

  Widget _buildSocialButton({
    required String label,
    required String icon,
    required VoidCallback onTap,
    bool isApple = false,
  }) {
    return PremiumCard(
      onTap: onTap,
      opacity: 0.1,
      borderRadius: AppRadius.md,
      child: Container(
        height: 60,
        alignment: Alignment.center,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            isApple 
              ? Icon(Icons.apple_rounded, color: Theme.of(context).iconTheme.color, size: 24)
              : const GoogleLogo(size: 20),
            const SizedBox(width: 12),
            Text(
              label,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSocialDivider() {
    return Row(
      children: [
        const Expanded(child: Divider(thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text('or', style: Theme.of(context).textTheme.labelMedium),
        ),
        const Expanded(child: Divider(thickness: 1)),
      ],
    );
  }

  Widget _buildStyledTextField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hintText,
    required IconData icon,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onSuffixTap,
    TextInputType? keyboardType,
  }) {
    return PremiumCard(
      opacity: 0.15,
      borderRadius: AppRadius.md,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        obscureText: obscureText,
        keyboardType: keyboardType,
        style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          hintText: focusNode.hasFocus ? '' : hintText,
          hintStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
          prefixIcon: Icon(
            icon, 
            color: focusNode.hasFocus 
              ? Theme.of(context).colorScheme.primary 
              : AppColors.textTertiary, 
            size: 22
          ),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    obscureText ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                    color: Theme.of(context).hintColor,
                    size: 20,
                  ),
                  onPressed: onSuffixTap,
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        ),
      ),
    );
  }

  Widget _buildLoginButton() {
    return PremiumCard(
      useGlass: false,
      borderRadius: AppRadius.md,
      onTap: _signingIn ? null : _handleLogin,
      child: Container(
        width: double.infinity,
        height: 60,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.primaryStrong,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          boxShadow: AppShadows.soft(Theme.of(context).brightness == Brightness.dark, tint: AppColors.primaryStrong),
        ),
        child: _signingIn
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text(
                'Sign In',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
      ),
    );
  }
}

