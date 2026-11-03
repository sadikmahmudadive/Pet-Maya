import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/models/support_models.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../common_widgets/glass_scaffold.dart';
import '../../common_widgets/premium_toast.dart';
import '../../common_widgets/resilient_network_image.dart';
import 'support_widgets.dart';

/// One ticket as a conversation: the original message, then the replies, with a box to answer.
class TicketDetailScreen extends StatefulWidget {
  final String ticketId;
  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  final _reply = TextEditingController();
  final _scroll = ScrollController();
  late final Stream<List<SupportMessage>> _messages = context
      .read<AppStateRepository>()
      .supportMessages(widget.ticketId);
  bool _sending = false;
  int _markedAt = -1;

  @override
  void dispose() {
    _reply.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _reply.text.trim();
    if (text.isEmpty || _sending) return;
    final repo = context.read<AppStateRepository>();
    setState(() => _sending = true);
    final error = await repo.replyToSupportTicket(widget.ticketId, text);
    if (!mounted) return;
    setState(() => _sending = false);
    if (error != null) {
      repo.showToast(error, type: ToastType.error, context: context);
      return;
    }
    _reply.clear();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimary;
    final ticket = context.select(
      (AppStateRepository s) =>
          s.supportTickets.where((t) => t.id == widget.ticketId).firstOrNull,
    );

    if (ticket == null) {
      return GlassScaffold(
        appBar: AppBar(
          title: const Text('Ticket'),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    // The team replied and this is the first time the user sees it: clear the dot (again if another reply lands).
    if (ticket.unreadForUser && _markedAt != ticket.lastMessageAt) {
      _markedAt = ticket.lastMessageAt;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          context.read<AppStateRepository>().markSupportTicketRead(ticket.id);
        }
      });
    }

    return GlassScaffold(
      appBar: AppBar(
        title: Text(
          ticket.subject,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<List<SupportMessage>>(
              stream: _messages,
              builder: (context, snap) {
                final replies = snap.data ?? const <SupportMessage>[];
                return ListView(
                  controller: _scroll,
                  padding: const EdgeInsets.fromLTRB(20, 100, 20, 16),
                  children: [
                    Wrap(
                      spacing: 10,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        SupportStatusChip(ticket.status),
                        Text(
                          '${ticket.category}${ticket.orderNumber.isNotEmpty ? ' · Order ${ticket.orderNumber}' : ''}',
                          style: AppTypography.labelSmall.copyWith(
                            color: AppColors.textTertiary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _Bubble(
                      mine: true,
                      sender: 'You',
                      time: ticket.createdAt,
                      text: ticket.message,
                      imageUrl: ticket.imageUrl,
                    ),
                    for (final m in replies)
                      _Bubble(
                        mine: !m.fromStaff,
                        sender: m.fromStaff ? 'Pet Maya Support' : 'You',
                        time: m.createdAt,
                        text: m.text,
                      ),
                    if (snap.hasError)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          'Could not load the replies. Check your connection.',
                          style: AppTypography.bodySmall.copyWith(
                            color: AppColors.dangerRed,
                          ),
                        ),
                      ),
                    if (ticket.status == SupportStatus.resolved)
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Text(
                          'This ticket is marked resolved. If you still need help, reply below and it will reopen.',
                          textAlign: TextAlign.center,
                          style: AppTypography.bodySmall.copyWith(
                            color: textColor.withValues(alpha: 0.7),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 8, 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _reply,
                      enabled: !_sending,
                      minLines: 1,
                      maxLines: 5,
                      maxLength: 2000,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Write a reply…',
                        counterText: '',
                        filled: true,
                        fillColor: (isDark ? Colors.white : Colors.black)
                            .withValues(alpha: 0.06),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 18,
                          vertical: 12,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  IconButton.filled(
                    tooltip: 'Send reply',
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Bubble extends StatelessWidget {
  final bool mine;
  final String sender;
  final int time;
  final String text;
  final String? imageUrl;
  const _Bubble({
    required this.mine,
    required this.sender,
    required this.time,
    required this.text,
    this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = mine
        ? AppColors.primary
        : (isDark
              ? Colors.white.withValues(alpha: 0.1)
              : Colors.black.withValues(alpha: 0.06));
    final fg = mine
        ? Colors.white
        : (isDark ? Colors.white : AppColors.textPrimary);
    final image = imageUrl == null ? null : appImageProvider(imageUrl);
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.sizeOf(context).width * 0.82,
        ),
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(20),
            topRight: const Radius.circular(20),
            bottomLeft: Radius.circular(mine ? 20 : 4),
            bottomRight: Radius.circular(mine ? 4 : 20),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$sender · ${supportTime(time)}',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: fg.withValues(alpha: 0.85),
              ),
            ),
            const SizedBox(height: 4),
            SelectableText(
              text,
              style: AppTypography.bodyMedium.copyWith(color: fg, height: 1.4),
            ),
            if (image != null) ...[
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image(
                  image: image,
                  height: 160,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stack) =>
                      const SizedBox.shrink(),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
