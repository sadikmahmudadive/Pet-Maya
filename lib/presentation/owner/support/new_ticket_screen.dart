import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/support_models.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import '../../common_widgets/premium_toast.dart';

/// "Contact support": a ticket with a topic, a message, an optional order number and an optional photo.
class NewTicketScreen extends StatefulWidget {
  final String initialCategory;
  const NewTicketScreen({super.key, this.initialCategory = 'Other'});

  @override
  State<NewTicketScreen> createState() => _NewTicketScreenState();
}

class _NewTicketScreenState extends State<NewTicketScreen> {
  final _subject = TextEditingController();
  final _message = TextEditingController();
  final _order = TextEditingController();
  late String _category = supportCategories.contains(widget.initialCategory) ? widget.initialCategory : 'Other';
  File? _photo;
  bool _sending = false;
  String? _error;

  bool get _askOrder => const ['Order', 'Delivery', 'Payment'].contains(_category);

  @override
  void dispose() {
    _subject.dispose();
    _message.dispose();
    _order.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (picked != null && mounted) setState(() => _photo = File(picked.path));
  }

  Future<void> _submit() async {
    final subject = _subject.text.trim();
    final message = _message.text.trim();
    if (subject.length < 3) {
      setState(() => _error = 'Add a short subject (at least 3 characters).');
      return;
    }
    if (message.length < 10) {
      setState(() => _error = 'Describe the problem in a little more detail (at least 10 characters).');
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _sending = true;
      _error = null;
    });
    final repo = context.read<AppStateRepository>();
    final error = await repo.submitSupportTicket(
      subject: subject,
      category: _category,
      message: message,
      orderNumber: _askOrder ? _order.text.trim() : '',
      photo: _photo,
    );
    if (!mounted) return;
    if (error != null) {
      setState(() {
        _sending = false;
        _error = error;
      });
      return;
    }
    repo.showToast('Ticket sent. We will reply here and notify you.', type: ToastType.success, context: context);
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimary;

    Widget label(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 20),
      child: Text(
        t,
        style: AppTypography.labelSmall.copyWith(
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: AppColors.textTertiary,
          fontSize: 11,
        ),
      ),
    );

    InputDecoration deco(String hint) => InputDecoration(
      hintText: hint,
      border: InputBorder.none,
      counterText: '',
      contentPadding: const EdgeInsets.all(16),
    );

    return GlassScaffold(
      appBar: AppBar(title: const Text('Contact support'), backgroundColor: Colors.transparent, elevation: 0),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 100, 20, 60),
        children: [
          Text(
            'Tell us what went wrong and we will reply here in the app. The more detail you give, the faster we can help.',
            style: AppTypography.bodyMedium.copyWith(color: textColor.withValues(alpha: 0.8), height: 1.45),
          ),
          label('WHAT IS IT ABOUT?'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final c in supportCategories)
                ChoiceChip(
                  label: Text(c),
                  selected: _category == c,
                  onSelected: _sending ? null : (_) => setState(() => _category = c),
                ),
            ],
          ),
          label('SUBJECT'),
          PremiumCard(
            opacity: 0.15,
            borderRadius: 18,
            child: TextField(
              controller: _subject,
              enabled: !_sending,
              maxLength: 100,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.next,
              decoration: deco('e.g. My order has not arrived'),
            ),
          ),
          if (_askOrder) ...[
            label('ORDER NUMBER (OPTIONAL)'),
            PremiumCard(
              opacity: 0.15,
              borderRadius: 18,
              child: TextField(
                controller: _order,
                enabled: !_sending,
                maxLength: 40,
                textInputAction: TextInputAction.next,
                decoration: deco('Find it under Shop > Orders'),
              ),
            ),
          ],
          label('MESSAGE'),
          PremiumCard(
            opacity: 0.15,
            borderRadius: 18,
            child: TextField(
              controller: _message,
              enabled: !_sending,
              maxLength: 2000,
              minLines: 5,
              maxLines: 10,
              textCapitalization: TextCapitalization.sentences,
              decoration: deco('Describe the problem and what you expected to happen.'),
            ),
          ),
          label('PHOTO OR SCREENSHOT (OPTIONAL)'),
          if (_photo == null)
            OutlinedButton.icon(
              onPressed: _sending ? null : _pickPhoto,
              icon: const Icon(Icons.add_photo_alternate_outlined),
              label: const Text('Attach a photo'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            )
          else
            Stack(
              alignment: Alignment.topRight,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.file(_photo!, height: 180, width: double.infinity, fit: BoxFit.cover),
                ),
                IconButton.filled(
                  tooltip: 'Remove photo',
                  onPressed: _sending ? null : () => setState(() => _photo = null),
                  icon: const Icon(Icons.close_rounded),
                ),
              ],
            ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Semantics(
              liveRegion: true,
              child: Text(_error!, style: AppTypography.bodySmall.copyWith(color: AppColors.dangerRed, fontWeight: FontWeight.w600)),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _sending ? null : _submit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            child: _sending
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                : const Text('SEND TO SUPPORT'),
          ),
        ],
      ),
    );
  }
}
