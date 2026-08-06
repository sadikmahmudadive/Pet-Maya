import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class AdminBroadcastScreen extends StatefulWidget {
  const AdminBroadcastScreen({super.key});

  @override
  State<AdminBroadcastScreen> createState() => _AdminBroadcastScreenState();
}

class _AdminBroadcastScreenState extends State<AdminBroadcastScreen> {
  final _titleController = TextEditingController(text: '🚨 Rabies Vaccination Free Clinic Alert');
  final _msgController = TextEditingController(text: 'City Health Dept is hosting a free walk-in rabies immunization drive this Saturday from 9 AM to 3 PM at Central Dog Park.');
  String _targetGroup = 'All Pet Owners';

  void _sendBroadcast() {
    if (_titleController.text.isEmpty || _msgController.text.isEmpty) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Broadcast Dispatched! 📡'),
        content: Text('Push notification sent to all users in group "$_targetGroup".'),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('System Notification Broadcast'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Target User Audience', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _targetGroup,
                  isExpanded: true,
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
            const SizedBox(height: 20),

            Text('Notification Header / Title', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            TextField(controller: _titleController),
            const SizedBox(height: 20),

            Text('Push Message Content', style: AppTypography.titleMedium),
            const SizedBox(height: 8),
            TextField(controller: _msgController, maxLines: 4),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: _sendBroadcast,
                icon: const Icon(Icons.send_to_mobile_rounded),
                label: const Text('Send Push Broadcast to Users'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
