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
import '../owner/home/owner_home_screen.dart';
import '../provider/vet_dashboard_screen.dart';
import '../merchant/pet_shop_dashboard_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _referralController = TextEditingController();
  
  final _nameFocus = FocusNode();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  final _referralFocus = FocusNode();

  UserRole _selectedRole = UserRole.petOwner;
  bool _obscurePassword = true;
  bool _isRegistering = false;

  @override
  void initState() {
    super.initState();
    _nameFocus.addListener(() => setState(() {}));
    _emailFocus.addListener(() => setState(() {}));
    _passwordFocus.addListener(() => setState(() {}));
    _referralFocus.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _referralController.dispose();
    _nameFocus.dispose();
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _referralFocus.dispose();
    super.dispose();
  }

  void _handleRegister() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    setState(() => _isRegistering = true);

    final state = context.read<AppStateRepository>();
    
    try {
      await state.signUp(
        email: email,
        password: password,
        name: name,
        role: _selectedRole,
      );

      if (!mounted) return;
      setState(() => _isRegistering = false);

      _navigateToDashboard(state.currentUser!.role);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isRegistering = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Registration failed: ${e.toString()}'),
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
      default:
        destination = const OwnerHomeScreen();
    }

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => destination),
      (route) => false,
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
              SizedBox(height: size.height * 0.03),
              FadeInDown(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.05),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.person_add_rounded, size: size.height * 0.05, color: Theme.of(context).colorScheme.primary),
                    ),
                    SizedBox(height: size.height * 0.02),
                    Text(
                      'Create Account',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    SizedBox(height: size.height * 0.01),
                    Text(
                      'Start your premium pet care experience today',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: size.height * 0.03),

              // Register Form
              FadeInUp(
                delay: const Duration(milliseconds: 200),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStyledTextField(
                      controller: _nameController,
                      focusNode: _nameFocus,
                      hintText: 'Full Name',
                      icon: Icons.person_rounded,
                    ),
                    const SizedBox(height: 12),
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
                    const SizedBox(height: 12),
                    _buildStyledTextField(
                      controller: _referralController,
                      focusNode: _referralFocus,
                      hintText: 'Referral Code (Optional)',
                      icon: Icons.card_giftcard_rounded,
                    ),
                    const SizedBox(height: 32),

                    Padding(
                      padding: const EdgeInsets.only(left: 4),
                      child: Text('ACCOUNT TYPE', style: TextStyle(
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                        fontSize: 10,
                        color: Colors.grey[500],
                      )),
                    ),
                    const SizedBox(height: 16),
                    _buildRoleSelector(),
                    SizedBox(height: size.height * 0.05),

                    _buildRegisterButton(),
                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          "Already have an account? ",
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontSize: 13),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Text(
                            'Sign In',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
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

  Widget _buildRoleSelector() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          _buildRoleCard(UserRole.petOwner, Icons.person_rounded, 'Owner'),
          _buildRoleCard(UserRole.veterinarian, Icons.medical_services_rounded, 'Vet'),
          _buildRoleCard(UserRole.grooming, Icons.pets_rounded, 'Groomer'),
          _buildRoleCard(UserRole.boarding, Icons.location_on_rounded, 'Boarding'),
          _buildRoleCard(UserRole.petShop, Icons.shopping_bag_rounded, 'Shop'),
        ],
      ),
    );
  }

  Widget _buildRoleCard(UserRole role, IconData icon, String label) {
    final isSelected = _selectedRole == role;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: PremiumCard(
        onTap: () => setState(() => _selectedRole = role),
        opacity: isSelected ? 0.4 : 0.1,
        borderRadius: 20,
        child: Container(
          width: 80,
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
            Icon(
                icon,
                color: isSelected 
                  ? Theme.of(context).colorScheme.primary 
                  : AppColors.lemonGreen,
                size: 26,
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: isSelected ? Theme.of(context).colorScheme.primary : null,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
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

  Widget _buildRegisterButton() {
    return PremiumCard(
      useGlass: false,
      borderRadius: 20,
      onTap: _isRegistering ? null : _handleRegister,
      child: Container(
        width: double.infinity,
        height: 64,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF1AB680),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF1AB680).withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: _isRegistering
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Text(
                'Create Account',
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
