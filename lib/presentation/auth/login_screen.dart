import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../data/repositories/app_state_repository.dart';
import '../../data/models/user_model.dart';
import '../common_widgets/glass_card.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';
import 'package:animate_do/animate_do.dart';
import 'register_screen.dart';
import '../owner/home/owner_home_screen.dart';
import '../provider/vet_dashboard_screen.dart';
import '../merchant/pet_shop_dashboard_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../common_widgets/google_logo.dart';

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
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;

    return GlassScaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              SizedBox(height: size.height * 0.05),
              // Welcome Header
              FadeInDown(
                duration: const Duration(milliseconds: 600),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.pets_rounded, size: size.height * 0.06, color: Theme.of(context).colorScheme.primary),
                    ),
                    SizedBox(height: size.height * 0.02),
                    Text(
                      'Welcome Back',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        fontSize: 30,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: size.height * 0.01),
                    Text(
                      'Sign in to continue your journey with Pet Maya',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: size.height * 0.04),

              // Login Form
              FadeInUp(
                duration: const Duration(milliseconds: 600),
                delay: const Duration(milliseconds: 200),
                child: Column(
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
                            fontSize: 12,
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
                    SizedBox(height: size.height * 0.04),
                    _buildSocialDivider(),
                    SizedBox(height: size.height * 0.03),

                    Row(
                      children: [
                        Expanded(
                          child: _buildSocialButton(
                            label: 'Google',
                            icon: 'https://cdn-icons-png.flaticon.com/128/300/300221.png',
                            onTap: _handleGoogleLogin,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildSocialButton(
                            label: 'Apple',
                            icon: 'apple_logo',
                            onTap: () {},
                            isApple: true,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: size.height * 0.05 + bottomPadding),
            ],
          ),
        ),
      ),
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
      borderRadius: 20,
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
          child: Text('OR CONTINUE WITH', style: Theme.of(context).textTheme.labelSmall?.copyWith(letterSpacing: 0.8, fontWeight: FontWeight.w600, fontSize: 10)),
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
      borderRadius: 20,
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
              : AppColors.lemonGreen, 
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
      borderRadius: 20,
      onTap: _signingIn ? null : _handleLogin,
      child: Container(
        width: double.infinity,
        height: 64,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF006684),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF006684).withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: _signingIn
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text(
                'Sign In',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                ),
              ),
      ),
    );
  }
}
