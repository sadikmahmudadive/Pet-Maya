import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/app_info.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/support_models.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/support_faq.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'feedback_sheet.dart';
import 'my_tickets_screen.dart';
import 'new_ticket_screen.dart';

/// Help & Support: answers first (FAQ), then a ticket, the user's tickets, feedback, email and a Play Store rating.
class SupportCenterScreen extends StatefulWidget {
  const SupportCenterScreen({super.key});

  @override
  State<SupportCenterScreen> createState() => _SupportCenterScreenState();
}

class _SupportCenterScreenState extends State<SupportCenterScreen> {
  final _search = TextEditingController();
  String _needle = '';
  // Phone / WhatsApp / email as set by the admins (web console); shows the defaults until they load.
  late final Stream<SupportContact> _contact = context
      .read<AppStateRepository>()
      .supportContact();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _go(Widget screen) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => screen));

  Future<void> _launch(Uri? uri, String failMessage) async {
    var ok = false;
    try {
      ok =
          uri != null &&
          await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      ok = false;
    }
    if (!ok && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(failMessage)));
    }
  }

  Future<void> _email(String address) => _launch(
    Uri(
      scheme: 'mailto',
      path: address,
      queryParameters: {'subject': 'Pet Maya support (app ${AppInfo.short})'},
    ),
    'No email app found. Write to $address',
  );

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimary;
    final unread = context.select(
      (AppStateRepository s) => s.unreadSupportCount,
    );
    final ticketCount = context.select(
      (AppStateRepository s) => s.supportTickets.length,
    );

    final faq = supportFaq
        .where((f) => f.matches(_needle.trim().toLowerCase()))
        .toList();
    final topics = {for (final f in faq) f.topic}.toList();

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('Help & Support'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: StreamBuilder<SupportContact>(
        stream: _contact,
        initialData: const SupportContact(email: AppInfo.supportEmail),
        builder: (context, snap) {
          final contact =
              snap.data ?? const SupportContact(email: AppInfo.supportEmail);
          final callUri = contact.callUri;
          final waUri = contact.whatsappUri(
            'Hello Pet Maya, I need help with the app (${AppInfo.short}).',
          );
          final email = contact.email.isNotEmpty
              ? contact.email
              : AppInfo.supportEmail;
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 100, 20, 60),
            children: [
              Text(
                'How can we help?',
                style: AppTypography.headlineSmall.copyWith(
                  fontWeight: FontWeight.w800,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Find a quick answer below, or talk to the Pet Maya team.',
                style: AppTypography.bodyMedium.copyWith(
                  color: textColor.withValues(alpha: 0.75),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.support_agent_rounded,
                      title: 'Contact support',
                      subtitle: 'Open a ticket',
                      onTap: () => _go(const NewTicketScreen()),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.forum_rounded,
                      title: 'My tickets',
                      subtitle: unread > 0
                          ? '$unread new ${unread == 1 ? 'reply' : 'replies'}'
                          : (ticketCount == 0
                                ? 'No tickets yet'
                                : '$ticketCount ${ticketCount == 1 ? 'ticket' : 'tickets'}'),
                      badge: unread,
                      onTap: () => _go(const MyTicketsScreen()),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.rate_review_rounded,
                      title: 'Send feedback',
                      subtitle: 'Rate the app',
                      onTap: () => showFeedbackSheet(context),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionCard(
                      icon: Icons.mail_outline_rounded,
                      title: 'Email us',
                      subtitle: email,
                      onTap: () => _email(email),
                    ),
                  ),
                ],
              ),
              if (callUri != null || waUri != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (callUri != null)
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.call_rounded,
                          title: 'Call us',
                          subtitle: contact.phone,
                          onTap: () => _launch(
                            callUri,
                            'Could not open the phone app. Call ${contact.phone}',
                          ),
                        ),
                      ),
                    if (callUri != null && waUri != null)
                      const SizedBox(width: 12),
                    if (waUri != null)
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.chat_rounded,
                          title: 'WhatsApp',
                          subtitle: contact.whatsapp,
                          onTap: () => _launch(
                            waUri,
                            'Could not open WhatsApp. Message ${contact.whatsapp}',
                          ),
                        ),
                      ),
                  ],
                ),
              ],
              if (contact.hours.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 10, left: 4),
                  child: Row(
                    children: [
                      Icon(
                        Icons.schedule_rounded,
                        size: 16,
                        color: textColor.withValues(alpha: 0.6),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          contact.hours,
                          style: AppTypography.bodySmall.copyWith(
                            color: textColor.withValues(alpha: 0.75),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 12),
              _ActionCard(
                icon: Icons.star_rounded,
                title: 'Enjoying Pet Maya?',
                subtitle: 'Rate us on Google Play',
                wide: true,
                onTap: openPlayStore,
              ),
              const SizedBox(height: 28),
              Text(
                'FREQUENTLY ASKED QUESTIONS',
                style: AppTypography.labelSmall.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: AppColors.textTertiary,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _search,
                onChanged: (v) => setState(() => _needle = v),
                textInputAction: TextInputAction.search,
                decoration: InputDecoration(
                  hintText: 'Search help (e.g. points, order, tracker)',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: _needle.isEmpty
                      ? null
                      : IconButton(
                          tooltip: 'Clear search',
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => setState(() {
                            _search.clear();
                            _needle = '';
                          }),
                        ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              if (faq.isEmpty)
                PremiumCard(
                  opacity: 0.2,
                  borderRadius: 20,
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      children: [
                        Text(
                          'No answers match "${_needle.trim()}".',
                          textAlign: TextAlign.center,
                          style: AppTypography.bodyMedium.copyWith(
                            color: textColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 10),
                        FilledButton(
                          onPressed: () => _go(const NewTicketScreen()),
                          child: const Text('Ask our team'),
                        ),
                      ],
                    ),
                  ),
                )
              else
                for (final topic in topics) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 6, bottom: 8),
                    child: Text(
                      topic,
                      style: AppTypography.titleSmall.copyWith(
                        fontWeight: FontWeight.w800,
                        color: textColor,
                      ),
                    ),
                  ),
                  PremiumCard(
                    opacity: 0.2,
                    borderRadius: 20,
                    child: Column(
                      children: [
                        for (final f in faq.where((f) => f.topic == topic))
                          Theme(
                            data: Theme.of(
                              context,
                            ).copyWith(dividerColor: Colors.transparent),
                            child: ExpansionTile(
                              // A search match opens itself so the answer is visible without another tap.
                              key: ValueKey(
                                '${f.question}|${_needle.isNotEmpty}',
                              ),
                              initiallyExpanded:
                                  _needle.trim().isNotEmpty && faq.length <= 3,
                              tilePadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                              ),
                              childrenPadding: const EdgeInsets.fromLTRB(
                                16,
                                0,
                                16,
                                16,
                              ),
                              expandedCrossAxisAlignment:
                                  CrossAxisAlignment.start,
                              title: Text(
                                f.question,
                                style: AppTypography.bodyMedium.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: textColor,
                                ),
                              ),
                              children: [
                                Text(
                                  f.answer,
                                  style: AppTypography.bodyMedium.copyWith(
                                    color: textColor.withValues(alpha: 0.85),
                                    height: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              const SizedBox(height: 24),
              Center(
                child: Text(
                  'Pet Maya ${AppInfo.label}',
                  style: AppTypography.labelSmall.copyWith(
                    color: AppColors.textTertiary,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final int badge;
  final bool wide;
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.badge = 0,
    this.wide = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimary;
    return Semantics(
      button: true,
      label: '$title. $subtitle',
      excludeSemantics: true,
      onTap: onTap,
      child: PremiumCard(
        onTap: onTap,
        opacity: 0.3,
        borderRadius: 22,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(icon, color: AppColors.primary),
                  ),
                  if (badge > 0)
                    Positioned(
                      right: -4,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.dangerRed,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '$badge',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.titleSmall.copyWith(
                        fontWeight: FontWeight.w800,
                        color: textColor,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.bodySmall.copyWith(
                        color: textColor.withValues(alpha: 0.7),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (wide)
                Icon(
                  Icons.chevron_right_rounded,
                  color: textColor.withValues(alpha: 0.5),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
