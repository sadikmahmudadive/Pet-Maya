import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:animate_do/animate_do.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../data/repositories/app_state_repository.dart';
import '../common_widgets/glass_scaffold.dart';
import '../common_widgets/premium_card.dart';

class AdminBroadcastScreen extends StatefulWidget {
  const AdminBroadcastScreen({super.key});

  @override
  State<AdminBroadcastScreen> createState() => _AdminBroadcastScreenState();
}

class _AdminBroadcastScreenState extends State<AdminBroadcastScreen> {
  final _titleController = TextEditingController(text: '🚨 Health Alert: Free Vaccination Drive');
  final _msgController = TextEditingController(text: 'Join us at Central Dog Park this Saturday from 9 AM to 3 PM for a free rabies immunization drive hosted by the City Health Dept.');
  final _bannerController = TextEditingController();
  String _targetGroup = 'All Pet Owners';

  @override
  void initState() {
    super.initState();
    _bannerController.text = context.read<AppStateRepository>().systemBanner ?? '';
  }

  void _sendBroadcast() async {
    if (_titleController.text.isEmpty || _msgController.text.isEmpty) return;

    final repo = context.read<AppStateRepository>();
    final title = _titleController.text.trim();
    final message = _msgController.text.trim();

    HapticFeedback.heavyImpact();
    
    // Perform the broadcast in the repository
    await repo.sendBroadcastNotification(
      title: title,
      message: message,
      targetGroup: _targetGroup,
    );

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        title: const Text('Broadcast Dispatched! 📡', style: TextStyle(fontWeight: FontWeight.w800)),
        content: Text('Push notification and system alerts have been sent to group "$_targetGroup".', style: const TextStyle(fontWeight: FontWeight.w600)),
        actions: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('DONE'),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('System Broadcast', style: TextStyle(fontWeight: FontWeight.w800)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(24, 100, 24, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            FadeInDown(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Target Audience'),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _targetGroup,
                          isExpanded: true,
                          dropdownColor: isDark ? const Color(0xFF1A1A1A) : Colors.white,
                          style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
                          items: const [
                            DropdownMenuItem(value: 'All Pet Owners', child: Text('🐾 All Pet Owners')),
                            DropdownMenuItem(value: 'All Veterinarians', child: Text('🩺 All Veterinarians')),
                            DropdownMenuItem(value: 'All Shop Merchants', child: Text('🏪 All Shop Merchants')),
                            DropdownMenuItem(value: 'Everyone in App', child: Text('🌐 Entire Platform User Base')),
                          ],
                          onChanged: (val) => setState(() => _targetGroup = val!),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            FadeInUp(
              delay: const Duration(milliseconds: 100),
              child: Column(
                children: [
                  _buildPremiumInput('Notification Title', _titleController, hint: 'Headline...'),
                  const SizedBox(height: 24),
                  _buildPremiumInput('Broadcast Message', _msgController, hint: 'Content...', maxLines: 5),
                ],
              ),
            ),
            const SizedBox(height: 48),

            FadeInUp(
              delay: const Duration(milliseconds: 200),
              child: SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton.icon(
                  onPressed: _sendBroadcast,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1AB680),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  icon: const Icon(Icons.campaign_rounded, color: Colors.white, size: 24),
                  label: const Text('DISPATCH BROADCAST', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1, fontSize: 13)),
                ),
              ),
            ),
            const SizedBox(height: 48),

            // ─── GLOBAL BANNER CONTROL ─────────────────────────────────────
            FadeInUp(
              delay: const Duration(milliseconds: 300),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Global System Banner'),
                  const SizedBox(height: 8),
                  PremiumCard(
                    opacity: 0.1,
                    borderRadius: 24,
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        children: [
                          const Text(
                            'This banner appears at the very top of the app for all users in real-time.',
                            style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 20),
                          _buildPremiumInput('Banner Message', _bannerController, hint: 'e.g. 20% off on all grooming!'),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: () => context.read<AppStateRepository>().setSystemBanner(null),
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(color: AppColors.dangerRed),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                  ),
                                  child: const Text('REMOVE BANNER', style: TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.w800, fontSize: 11)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton(
                                  onPressed: () {
                                    final msg = _bannerController.text.trim();
                                    if (msg.isNotEmpty) {
                                      context.read<AppStateRepository>().setSystemBanner(msg);
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Banner pushed live! 📢')));
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                  ),
                                  child: const Text('PUSH LIVE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionLabel(String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(fontWeight: FontWeight.w800, color: isDark ? Colors.white70 : Colors.black54, fontSize: 10, letterSpacing: 0.8),
      ),
    );
  }

  Widget _buildPremiumInput(String label, TextEditingController controller, {String? hint, int maxLines = 1}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionLabel(label),
        PremiumCard(
          opacity: 0.1,
          borderRadius: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextField(
              controller: controller,
              maxLines: maxLines,
              style: TextStyle(fontWeight: FontWeight.w700, color: isDark ? Colors.white : Colors.black87),
              decoration: InputDecoration(
                hintText: hint,
                border: InputBorder.none,
                hintStyle: TextStyle(fontSize: 14, color: isDark ? Colors.white24 : Colors.grey),
                contentPadding: const EdgeInsets.symmetric(vertical: 18),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
