import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/app_info.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/support_models.dart';
import '../../../data/repositories/app_state_repository.dart';

/// Opens the Play Store page of the app (used after good feedback and from the Support Center).
Future<void> openPlayStore() async {
  try {
    await launchUrl(
      Uri.parse(AppInfo.playStoreUrl),
      mode: LaunchMode.externalApplication,
    );
  } catch (e) {
    debugPrint('[Support] could not open Google Play: $e');
  }
}

/// "Send feedback": a star rating, a topic and a comment. After 4-5 stars it offers to rate the app on Google Play.
Future<void> showFeedbackSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (_) => const _FeedbackSheet(),
  );
}

const _ratingWords = ['Very bad', 'Poor', 'Okay', 'Good', 'Excellent'];

class _FeedbackSheet extends StatefulWidget {
  const _FeedbackSheet();

  @override
  State<_FeedbackSheet> createState() => _FeedbackSheetState();
}

class _FeedbackSheetState extends State<_FeedbackSheet> {
  final _message = TextEditingController();
  int _rating = 0;
  String _category = 'Idea';
  bool _sending = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final message = _message.text.trim();
    if (_rating == 0) {
      setState(() => _error = 'Please choose a star rating first.');
      return;
    }
    if (_rating <= 3 && message.length < 5) {
      setState(
        () =>
            _error = 'Please tell us briefly what went wrong so we can fix it.',
      );
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _sending = true;
      _error = null;
    });
    final error = await context.read<AppStateRepository>().submitAppFeedback(
      rating: _rating,
      category: _category,
      message: message,
    );
    if (!mounted) return;
    setState(() {
      _sending = false;
      _error = error;
      _sent = error == null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimary;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(24, 4, 24, 24 + bottomInset),
      child: SingleChildScrollView(
        child: _sent ? _thanks(textColor) : _form(textColor),
      ),
    );
  }

  Widget _thanks(Color textColor) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(
          Icons.favorite_rounded,
          size: 48,
          color: AppColors.dangerRed,
        ),
        const SizedBox(height: 12),
        Text(
          'Thank you!',
          style: AppTypography.headlineSmall.copyWith(
            fontWeight: FontWeight.w800,
            color: textColor,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _rating >= 4
              ? 'We are glad you like Pet Maya. A rating on Google Play helps other pet parents find us.'
              : 'Your feedback reaches our team. We read every message and use it to improve the app.',
          textAlign: TextAlign.center,
          style: AppTypography.bodyMedium.copyWith(
            color: textColor.withValues(alpha: 0.8),
            height: 1.45,
          ),
        ),
        const SizedBox(height: 20),
        if (_rating >= 4) ...[
          FilledButton.icon(
            onPressed: () async {
              await openPlayStore();
              if (mounted) Navigator.pop(context);
            },
            icon: const Icon(Icons.star_rounded),
            label: const Text('RATE US ON GOOGLE PLAY'),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Not now'),
          ),
        ] else
          FilledButton(
            onPressed: () => Navigator.pop(context),
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
            ),
            child: const Text('DONE'),
          ),
      ],
    );
  }

  Widget _form(Color textColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'How is Pet Maya working for you?',
          style: AppTypography.titleLarge.copyWith(
            fontWeight: FontWeight.w800,
            color: textColor,
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 1; i <= 5; i++)
                IconButton(
                  tooltip: '$i ${i == 1 ? 'star' : 'stars'}',
                  iconSize: 40,
                  onPressed: _sending
                      ? null
                      : () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            _rating = i;
                            _error = null;
                          });
                        },
                  icon: Icon(
                    i <= _rating
                        ? Icons.star_rounded
                        : Icons.star_outline_rounded,
                    color: i <= _rating
                        ? AppColors.accentAmber
                        : textColor.withValues(alpha: 0.45),
                  ),
                ),
            ],
          ),
        ),
        Center(
          child: Text(
            _rating == 0 ? 'Tap a star' : _ratingWords[_rating - 1],
            style: AppTypography.labelMedium.copyWith(
              fontWeight: FontWeight.w700,
              color: textColor.withValues(alpha: 0.8),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final c in feedbackCategories)
              ChoiceChip(
                label: Text(c),
                selected: _category == c,
                onSelected: _sending
                    ? null
                    : (_) => setState(() => _category = c),
              ),
          ],
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _message,
          enabled: !_sending,
          minLines: 3,
          maxLines: 6,
          maxLength: 1000,
          textCapitalization: TextCapitalization.sentences,
          decoration: InputDecoration(
            labelText: _rating > 0 && _rating <= 3
                ? 'What went wrong?'
                : 'Tell us more (optional)',
            alignLabelWithHint: true,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Semantics(
            liveRegion: true,
            child: Text(
              _error!,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.dangerRed,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
        const SizedBox(height: 16),
        FilledButton(
          onPressed: _sending ? null : _submit,
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
          child: _sending
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.5),
                )
              : const Text('SEND FEEDBACK'),
        ),
        const SizedBox(height: 6),
        Text(
          'Sent with app version ${AppInfo.short}. For a problem that needs an answer, use Contact support instead.',
          style: AppTypography.labelSmall.copyWith(
            color: AppColors.textTertiary,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
