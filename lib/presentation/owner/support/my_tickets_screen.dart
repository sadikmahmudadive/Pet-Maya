import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/support_models.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/empty_state.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_card.dart';
import 'new_ticket_screen.dart';
import 'support_widgets.dart';
import 'ticket_detail_screen.dart';

/// The signed-in user's support tickets, newest activity first. A dot marks a ticket the team has replied to.
class MyTicketsScreen extends StatelessWidget {
  const MyTicketsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tickets = context.select((AppStateRepository s) => s.supportTickets);

    void newTicket() => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewTicketScreen()));

    return GlassScaffold(
      appBar: AppBar(
        title: const Text('My tickets'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'New ticket',
            icon: const Icon(Icons.add_circle_rounded, color: AppColors.primary),
            onPressed: newTicket,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 100, 20, 120),
            sliver: tickets.isEmpty
                ? SliverFillRemaining(
                    hasScrollBody: false,
                    child: EmptyState(
                      icon: Icons.support_agent_rounded,
                      title: 'No tickets yet',
                      message: 'When you contact support, the conversation will be here. Replies also arrive as a notification.',
                      actionLabel: 'Contact support',
                      onAction: newTicket,
                    ),
                  )
                : SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) => FadeInUp(
                        delay: Duration(milliseconds: 60 * i.clamp(0, 6)),
                        child: _TicketTile(ticket: tickets[i]),
                      ),
                      childCount: tickets.length,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _TicketTile extends StatelessWidget {
  final SupportTicket ticket;
  const _TicketTile({required this.ticket});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimary;
    final preview = ticket.lastMessageBy == 'staff' ? 'Support replied' : 'You: ${ticket.message}';
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Semantics(
        button: true,
        label: '${ticket.subject}, ${ticket.status.label}${ticket.unreadForUser ? ', new reply from support' : ''}',
        excludeSemantics: true,
        onTap: () => _open(context),
        child: PremiumCard(
          onTap: () => _open(context),
          opacity: 0.3,
          borderRadius: 24,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    if (ticket.unreadForUser) ...[
                      Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(color: AppColors.dangerRed, shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: Text(
                        ticket.subject,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTypography.titleSmall.copyWith(
                          fontWeight: ticket.unreadForUser ? FontWeight.w800 : FontWeight.w700,
                          color: textColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SupportStatusChip(ticket.status),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  preview,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.bodySmall.copyWith(color: textColor.withValues(alpha: 0.75), height: 1.4),
                ),
                const SizedBox(height: 10),
                Text(
                  '${ticket.category}${ticket.orderNumber.isNotEmpty ? ' · ${ticket.orderNumber}' : ''} · ${supportTime(ticket.lastMessageAt)}',
                  style: AppTypography.labelSmall.copyWith(color: AppColors.textTertiary, fontSize: 11),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _open(BuildContext context) =>
      Navigator.push(context, MaterialPageRoute(builder: (_) => TicketDetailScreen(ticketId: ticket.id)));
}
