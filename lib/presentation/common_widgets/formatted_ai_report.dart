import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class FormattedAiReport extends StatelessWidget {
  final String text;
  final bool isCompact;

  const FormattedAiReport({
    super.key,
    required this.text,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (isCompact) {
      return Text(
        _cleanSummaryText(text),
        maxLines: 3,
        overflow: TextOverflow.ellipsis,
        style: AppTypography.bodyMedium.copyWith(
          color: isDark
              ? Colors.white70
              : Theme.of(context).colorScheme.onSurfaceVariant,
          height: 1.5,
          fontSize: 13,
        ),
      );
    }

    final blocks = _parseReportBlocks(text);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: blocks
          .map((block) => _buildBlockWidget(context, block, isDark))
          .toList(),
    );
  }

  static String _cleanSummaryText(String raw) {
    return raw
        .replaceAll(RegExp(r'#+\s*'), '')
        .replaceAll(RegExp(r'\*\*(.*?)\*\*'), r'$1')
        .replaceAll(RegExp(r'\*(.*?)\*'), r'$1')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static List<_AiReportBlock> _parseReportBlocks(String rawText) {
    // 1. Normalize line endings and remove robotic prompt meta-labels
    var text = rawText
        .replaceAll(
          RegExp(r'\*\*Empathetic Tone:\*\*', caseSensitive: false),
          '',
        )
        .replaceAll(RegExp(r'Empathetic Tone:', caseSensitive: false), '')
        .trim();

    final lines = text.split('\n');
    final List<_AiReportBlock> blocks = [];

    _AiReportBlock? currentBlock;

    for (var rawLine in lines) {
      var line = rawLine.trim();
      if (line.isEmpty) {
        continue;
      }

      // 1. Check for Markdown Headers: ###, ##, #
      final headerMatch = RegExp(r'^(#{1,6})\s+(.+)$').firstMatch(line);
      if (headerMatch != null) {
        final title = headerMatch
            .group(2)!
            .replaceAll(r'**', '')
            .replaceAll(r'*', '')
            .replaceAll(r':', '')
            .trim();
        currentBlock = _AiReportBlock(
          type: _BlockType.section,
          title: title,
          items: [],
        );
        blocks.add(currentBlock);
        continue;
      }

      // 2. Check for Bold Section Header lines like "**Recommendations:**" or "**Possible Causes:**"
      final boldHeaderMatch = RegExp(
        r'^\*\*([A-Za-z\s&/,]+)\*\*:\s*(.*)$',
      ).firstMatch(line);
      if (boldHeaderMatch != null && boldHeaderMatch.group(2)!.isEmpty) {
        final title = boldHeaderMatch.group(1)!.trim();
        currentBlock = _AiReportBlock(
          type: _BlockType.section,
          title: title,
          items: [],
        );
        blocks.add(currentBlock);
        continue;
      }

      // 3. Check for numbered list items like "1. Veterinary Visit: This is an..."
      final numberedMatch = RegExp(r'^(\d+)[\.\)]\s+(.+)$').firstMatch(line);
      if (numberedMatch != null) {
        final number = numberedMatch.group(1)!;
        final content = numberedMatch.group(2)!;
        final item = _ListItem(number: number, text: content);

        if (currentBlock != null && currentBlock.type == _BlockType.section) {
          currentBlock.items.add(item);
        } else {
          currentBlock = _AiReportBlock(type: _BlockType.list, items: [item]);
          blocks.add(currentBlock);
        }
        continue;
      }

      // 4. Check for bullet list items like "- Veterinary Visit: ..." or "• ..."
      final bulletMatch = RegExp(r'^[\-\*\•]\s+(.+)$').firstMatch(line);
      if (bulletMatch != null) {
        final content = bulletMatch.group(1)!;
        final item = _ListItem(text: content);
        if (currentBlock != null && currentBlock.type == _BlockType.section) {
          currentBlock.items.add(item);
        } else {
          currentBlock = _AiReportBlock(type: _BlockType.list, items: [item]);
          blocks.add(currentBlock);
        }
        continue;
      }

      // 5. Plain paragraph
      if (currentBlock != null &&
          currentBlock.type == _BlockType.section &&
          currentBlock.items.isEmpty &&
          currentBlock.paragraph == null) {
        currentBlock.paragraph = line;
      } else {
        currentBlock = _AiReportBlock(
          type: _BlockType.paragraph,
          paragraph: line,
        );
        blocks.add(currentBlock);
      }
    }

    return blocks;
  }

  Widget _buildBlockWidget(
    BuildContext context,
    _AiReportBlock block,
    bool isDark,
  ) {
    switch (block.type) {
      case _BlockType.section:
        return _buildSectionCard(context, block, isDark);
      case _BlockType.list:
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: block.items
                .map((item) => _buildListItemWidget(context, item, isDark))
                .toList(),
          ),
        );
      case _BlockType.paragraph:
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildRichText(block.paragraph ?? '', isDark),
        );
    }
  }

  Widget _buildSectionCard(
    BuildContext context,
    _AiReportBlock block,
    bool isDark,
  ) {
    final title = block.title ?? 'Recommendations';
    final isUrgent =
        title.toLowerCase().contains('urgenc') ||
        title.toLowerCase().contains('urgent') ||
        title.toLowerCase().contains('emergency');

    IconData icon = Icons.medical_services_outlined;
    Color accentColor = isDark ? const Color(0xFF4ADE80) : AppColors.primary;

    if (title.toLowerCase().contains('recommend')) {
      icon = Icons.health_and_safety_rounded;
      accentColor = const Color(0xFF1AB680);
    } else if (title.toLowerCase().contains('cause') ||
        title.toLowerCase().contains('insight') ||
        title.toLowerCase().contains('reason')) {
      icon = Icons.biotech_rounded;
      accentColor = const Color(0xFF00ACC1);
    } else if (title.toLowerCase().contains('observ') ||
        title.toLowerCase().contains('locat') ||
        title.toLowerCase().contains('appear')) {
      icon = Icons.remove_red_eye_outlined;
      accentColor = const Color(0xFF3F51B5);
    } else if (isUrgent) {
      icon = Icons.warning_amber_rounded;
      accentColor = AppColors.dangerRed;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark
            ? accentColor.withValues(alpha: 0.08)
            : accentColor.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: accentColor.withValues(alpha: isDark ? 0.25 : 0.15),
          width: 1.2,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 16, color: accentColor),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
          if (block.paragraph != null && block.paragraph!.isNotEmpty) ...[
            const SizedBox(height: 10),
            _buildRichText(block.paragraph!, isDark),
          ],
          if (block.items.isNotEmpty) ...[
            const SizedBox(height: 12),
            Column(
              children: block.items
                  .map((item) => _buildListItemWidget(context, item, isDark))
                  .toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildListItemWidget(
    BuildContext context,
    _ListItem item,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item.number != null) ...[
            Container(
              margin: const EdgeInsets.only(top: 2, right: 10),
              width: 22,
              height: 22,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF1AB680).withValues(alpha: 0.25)
                    : const Color(0xFF1AB680).withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFF1AB680).withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                item.number!,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: isDark
                      ? const Color(0xFF4ADE80)
                      : const Color(0xFF0D7A54),
                ),
              ),
            ),
          ] else ...[
            Container(
              margin: const EdgeInsets.only(top: 8, right: 10),
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: Color(0xFF1AB680),
                shape: BoxShape.circle,
              ),
            ),
          ],
          Expanded(child: _buildRichText(item.text, isDark)),
        ],
      ),
    );
  }

  Widget _buildRichText(String text, bool isDark) {
    final List<TextSpan> spans = [];
    final pattern = RegExp(r'\*\*(.*?)\*\*|\*(.*?)\*');
    int lastEnd = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(
          TextSpan(
            text: text.substring(lastEnd, match.start),
            style: TextStyle(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.85)
                  : const Color(0xFF334155),
              fontSize: 14.5,
              height: 1.6,
              fontWeight: FontWeight.w400,
            ),
          ),
        );
      }

      final boldContent = match.group(1) ?? match.group(2) ?? '';
      if (boldContent.isNotEmpty) {
        final isUrgentWord =
            boldContent.toLowerCase() == 'urgent' ||
            boldContent.toLowerCase() == 'emergency';
        spans.add(
          TextSpan(
            text: boldContent,
            style: TextStyle(
              color: isUrgentWord
                  ? (isDark ? const Color(0xFFFF6B6B) : const Color(0xFFD32F2F))
                  : (isDark
                        ? const Color(0xFF4ADE80)
                        : const Color(0xFF0D7A54)),
              fontSize: 14.5,
              height: 1.6,
              fontWeight: FontWeight.w700,
            ),
          ),
        );
      }
      lastEnd = match.end;
    }

    if (lastEnd < text.length) {
      spans.add(
        TextSpan(
          text: text.substring(lastEnd),
          style: TextStyle(
            color: isDark
                ? Colors.white.withValues(alpha: 0.85)
                : const Color(0xFF334155),
            fontSize: 14.5,
            height: 1.6,
            fontWeight: FontWeight.w400,
          ),
        ),
      );
    }

    return RichText(text: TextSpan(children: spans));
  }
}

enum _BlockType { section, list, paragraph }

class _AiReportBlock {
  final _BlockType type;
  final String? title;
  String? paragraph;
  final List<_ListItem> items;

  _AiReportBlock({
    required this.type,
    this.title,
    this.paragraph,
    List<_ListItem>? items,
  }) : items = items ?? [];
}

class _ListItem {
  final String? number;
  final String text;

  _ListItem({this.number, required this.text});
}
