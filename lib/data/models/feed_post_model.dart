class FeedPostModel {
  final String postId;
  final String userId;
  final String userName;
  final String? userPhoto;
  final String postType; // ADOPTION, RESCUE, MOMENT
  final String content;
  final String? imageUrl;
  final int timestamp;
  int likesCount;
  int commentsCount;
  int sharesCount;
  final String? sharedPostId;
  final String? sharedPostAuthor;
  final String? sharedPostContent;
  final String? sharedPostImageUrl;
  Map<String, bool> likedBy;
  Map<String, String> userReactions;

  FeedPostModel({
    required this.postId,
    required this.userId,
    required this.userName,
    this.userPhoto,
    required this.postType,
    required this.content,
    this.imageUrl,
    required this.timestamp,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.sharesCount = 0,
    this.sharedPostId,
    this.sharedPostAuthor,
    this.sharedPostContent,
    this.sharedPostImageUrl,
    Map<String, bool>? likedBy,
    Map<String, String>? userReactions,
  })  : likedBy = likedBy ?? {},
        userReactions = userReactions ?? {};

  bool isLikedByUser(String currentUserId) {
    return userReactions.containsKey(currentUserId) ||
        (likedBy[currentUserId] == true);
  }

  String? getUserReaction(String currentUserId) {
    if (userReactions.containsKey(currentUserId)) {
      return userReactions[currentUserId];
    }
    if (likedBy[currentUserId] == true) {
      return 'Like';
    }
    return null;
  }

  void setReaction(String currentUserId, String reactionType) {
    final existing = getUserReaction(currentUserId);
    if (existing == reactionType) {
      // Toggle off if clicking the same active reaction
      userReactions.remove(currentUserId);
      likedBy.remove(currentUserId);
      likesCount = (likesCount > 0) ? likesCount - 1 : 0;
    } else {
      if (existing == null) {
        likesCount += 1;
      }
      userReactions[currentUserId] = reactionType;
      likedBy[currentUserId] = true;
    }
  }

  void toggleLike(String currentUserId) {
    setReaction(currentUserId, 'Like');
  }

  Map<String, dynamic> toMap() {
    return {
      'postId': postId,
      'userId': userId,
      'userName': userName,
      'userPhoto': userPhoto,
      'postType': postType,
      'content': content,
      'imageUrl': imageUrl,
      'timestamp': timestamp,
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'sharesCount': sharesCount,
      'sharedPostId': sharedPostId,
      'sharedPostAuthor': sharedPostAuthor,
      'sharedPostContent': sharedPostContent,
      'sharedPostImageUrl': sharedPostImageUrl,
      'likedBy': likedBy,
      'userReactions': userReactions,
    };
  }

  factory FeedPostModel.fromMap(String id, Map<dynamic, dynamic> map) {
    Map<String, bool> likesMap = {};
    if (map['likedBy'] is Map) {
      (map['likedBy'] as Map).forEach((k, v) {
        if (v == true || v == 1 || v == 'true') {
          likesMap[k.toString()] = true;
        }
      });
    }
    if (map['likedByUserIds'] is List) {
      for (var u in (map['likedByUserIds'] as List)) {
        likesMap[u.toString()] = true;
      }
    }

    Map<String, String> reactionsMap = {};
    if (map['userReactions'] is Map) {
      (map['userReactions'] as Map).forEach((k, v) {
        if (v != null && v.toString().isNotEmpty) {
          reactionsMap[k.toString()] = v.toString();
        }
      });
    } else if (map['reactions'] is Map) {
      (map['reactions'] as Map).forEach((k, v) {
        if (v != null && v.toString().isNotEmpty) {
          reactionsMap[k.toString()] = v.toString();
        }
      });
    }

    final int lCount = (map['likesCount'] as num?)?.toInt() ??
        (map['likes'] as num?)?.toInt() ??
        (reactionsMap.isNotEmpty ? reactionsMap.length : likesMap.length);
    final int cCount = (map['commentsCount'] as num?)?.toInt() ??
        ((map['comments'] is List)
            ? (map['comments'] as List).length
            : 0);

    return FeedPostModel(
      postId: id,
      userId: map['userId'] ?? '',
      userName: map['userName'] ??
          map['author'] ??
          map['authorName'] ??
          'Pet Lover',
      userPhoto: map['userPhoto'] ?? map['authorPhoto'],
      postType: map['postType'] ?? map['category'] ?? 'MOMENT',
      content: map['content'] ?? '',
      imageUrl: map['imageUrl'] ?? map['image'],
      timestamp: (map['timestamp'] as num?)?.toInt() ??
          DateTime.now().millisecondsSinceEpoch,
      likesCount: lCount,
      commentsCount: cCount,
      sharesCount: (map['sharesCount'] as num?)?.toInt() ?? 0,
      sharedPostId: map['sharedPostId'],
      sharedPostAuthor: map['sharedPostAuthor'],
      sharedPostContent: map['sharedPostContent'],
      sharedPostImageUrl: map['sharedPostImageUrl'],
      likedBy: likesMap,
      userReactions: reactionsMap,
    );
  }
}
