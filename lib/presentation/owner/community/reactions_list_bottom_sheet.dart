import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lottie/lottie.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/repositories/app_state_repository.dart';
import '../../../data/models/feed_post_model.dart';
import '../../../data/models/user_model.dart';
import '../../common_widgets/micro_animations/lottie_reaction_button.dart';

class ReactionsListBottomSheet extends StatefulWidget {
  final FeedPostModel post;

  const ReactionsListBottomSheet({super.key, required this.post});

  @override
  State<ReactionsListBottomSheet> createState() =>
      _ReactionsListBottomSheetState();
}

class _ReactionsListBottomSheetState extends State<ReactionsListBottomSheet> {
  String _selectedFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchUserProfiles();
    });
  }

  void _fetchUserProfiles() {
    final repo = context.read<AppStateRepository>();
    final userIds = _getAllReactedUserIds();
    for (final uid in userIds) {
      if (uid.isNotEmpty && uid != 'guest') {
        repo.fetchAndCacheUser(uid);
      }
    }
  }

  List<String> _getAllReactedUserIds() {
    final Set<String> ids = {};
    ids.addAll(widget.post.userReactions.keys);
    widget.post.likedBy.forEach((k, v) {
      if (v == true) ids.add(k);
    });
    return ids.where((id) => id.isNotEmpty && id != 'guest').toList();
  }

  Map<String, String> _getReactionMap() {
    final Map<String, String> map = {};
    widget.post.userReactions.forEach((uid, reaction) {
      if (uid.isNotEmpty && uid != 'guest' && reaction.isNotEmpty) {
        map[uid] = reaction;
      }
    });
    widget.post.likedBy.forEach((uid, liked) {
      if (liked == true &&
          uid.isNotEmpty &&
          uid != 'guest' &&
          !map.containsKey(uid)) {
        map[uid] = 'Like';
      }
    });
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final repo = context.watch<AppStateRepository>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final reactionMap = _getReactionMap();
    final allUserIds = reactionMap.keys.toList();

    // Group reaction counts by type
    final Map<String, int> counts = {};
    for (var r in reactionMap.values) {
      counts[r] = (counts[r] ?? 0) + 1;
    }

    final availableTypes = ['ALL', ...counts.keys];

    // Filter users based on selected reaction type tab
    final filteredUserIds = _selectedFilter == 'ALL'
        ? allUserIds
        : allUserIds
              .where(
                (uid) =>
                    reactionMap[uid]?.toLowerCase() ==
                    _selectedFilter.toLowerCase(),
              )
              .toList();

    return Container(
      height: MediaQuery.of(context).size.height * 0.65,
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? Colors.white24 : Colors.black12,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
            child: Row(
              children: [
                Text(
                  'Reactions',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${allUserIds.length}',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close_rounded, size: 22),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // ─── REACTION TYPE FILTER CHIPS ─────────────────────────────────────
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: availableTypes.map((type) {
                final isSelected = _selectedFilter == type;
                final count = type == 'ALL'
                    ? allUserIds.length
                    : (counts[type] ?? 0);

                final config = type == 'ALL'
                    ? null
                    : kReactions.firstWhere(
                        (r) => r.label.toLowerCase() == type.toLowerCase(),
                        orElse: () => kReactions.first,
                      );

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    selected: isSelected,
                    showCheckmark: false,
                    onSelected: (_) {
                      HapticFeedback.selectionClick();
                      setState(() => _selectedFilter = type);
                    },
                    avatar: config != null
                        ? SizedBox(
                            width: 18,
                            height: 18,
                            child: Lottie.asset(
                              config.assetPath,
                              repeat: true,
                              fit: BoxFit.contain,
                            ),
                          )
                        : null,
                    label: Text(
                      type == 'ALL'
                          ? 'All ($count)'
                          : '${config?.label} $count',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: isSelected
                            ? FontWeight.w800
                            : FontWeight.w600,
                        color: isSelected
                            ? Colors.white
                            : (isDark ? Colors.white70 : Colors.black87),
                      ),
                    ),
                    backgroundColor: isDark
                        ? const Color(0xFF1E2630)
                        : const Color(0xFFF0F4F8),
                    selectedColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 8,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected
                            ? AppColors.primary
                            : (isDark ? Colors.white10 : Colors.black12),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const Divider(height: 16),

          // ─── REACTED USERS LIST ─────────────────────────────────────────────
          Expanded(
            child: filteredUserIds.isEmpty
                ? Center(
                    child: Text(
                      'No reactions found for this category.',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? Colors.white54 : Colors.grey[600],
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    itemCount: filteredUserIds.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final uid = filteredUserIds[index];
                      final user =
                          repo.userCache[uid] ??
                          repo.allUsers.firstWhere(
                            (u) => u.uid == uid,
                            orElse: () => UserModel(
                              uid: uid,
                              name: 'Pet Lover',
                              email: '',
                              joinedTimestamp: 0,
                            ),
                          );
                      final reactionLabel = reactionMap[uid] ?? 'Like';

                      final config = kReactions.firstWhere(
                        (r) =>
                            r.label.toLowerCase() ==
                            reactionLabel.toLowerCase(),
                        orElse: () => kReactions.first,
                      );

                      return _buildUserReactionRow(
                        context,
                        user,
                        config,
                        isDark,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserReactionRow(
    BuildContext context,
    UserModel user,
    ReactionConfig config,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isDark
            ? const Color(0xFF1B2430)
            : Colors.grey.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : Colors.black.withValues(alpha: 0.04),
        ),
      ),
      child: Row(
        children: [
          // User Avatar with Badge Overlay
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    width: 1.5,
                  ),
                ),
                child: ClipOval(
                  child: user.photoUrl != null && user.photoUrl!.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: user.photoUrl!,
                          fit: BoxFit.cover,
                          placeholder: (c, u) =>
                              Container(color: Colors.grey[300]),
                          errorWidget: (c, u, e) =>
                              _buildInitialsAvatar(user.name),
                        )
                      : _buildInitialsAvatar(user.name),
                ),
              ),
              Positioned(
                bottom: -2,
                right: -2,
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isDark ? const Color(0xFF1B2430) : Colors.white,
                    border: Border.all(
                      color: isDark ? const Color(0xFF2C3846) : Colors.white,
                      width: 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: Lottie.asset(
                      config.assetPath,
                      repeat: true,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 14),

          // User Name & Detail
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name.isNotEmpty ? user.name : 'Pet Lover',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  user.email.isNotEmpty ? user.email : 'Community Member',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? Colors.white54 : Colors.grey[600],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          // Reaction Label Badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: config.activeColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: config.activeColor.withValues(alpha: 0.3),
              ),
            ),
            child: Text(
              config.label,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: config.activeColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInitialsAvatar(String name) {
    final initial = name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'P';
    return Container(
      color: AppColors.primary.withValues(alpha: 0.2),
      child: Center(
        child: Text(
          initial,
          style: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w800,
            fontSize: 18,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}
