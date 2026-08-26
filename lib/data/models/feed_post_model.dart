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
  }) : likedBy = likedBy ?? {};

  bool isLikedByUser(String currentUserId) {
    return likedBy[currentUserId] == true;
  }

  void toggleLike(String currentUserId) {
    if (isLikedByUser(currentUserId)) {
      likedBy.remove(currentUserId);
      likesCount = (likesCount > 0) ? likesCount - 1 : 0;
    } else {
      likedBy[currentUserId] = true;
      likesCount += 1;
    }
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
    final int lCount = (map['likesCount'] as num?)?.toInt() ?? (map['likes'] as num?)?.toInt() ?? likesMap.length;
    final int cCount = (map['commentsCount'] as num?)?.toInt() ?? ((map['comments'] is List) ? (map['comments'] as List).length : 0);

    return FeedPostModel(
      postId: id,
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? map['author'] ?? map['authorName'] ?? 'Pet Lover',
      userPhoto: map['userPhoto'] ?? map['authorPhoto'],
      postType: map['postType'] ?? map['category'] ?? 'MOMENT',
      content: map['content'] ?? '',
      imageUrl: map['imageUrl'] ?? map['image'],
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      likesCount: lCount,
      commentsCount: cCount,
      sharesCount: (map['sharesCount'] as num?)?.toInt() ?? 0,
      sharedPostId: map['sharedPostId'],
      sharedPostAuthor: map['sharedPostAuthor'],
      sharedPostContent: map['sharedPostContent'],
      sharedPostImageUrl: map['sharedPostImageUrl'],
      likedBy: likesMap,
    );
  }
}
