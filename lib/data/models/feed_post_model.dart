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
      'likedBy': likedBy,
    };
  }

  factory FeedPostModel.fromMap(String id, Map<dynamic, dynamic> map) {
    Map<String, bool> likesMap = {};
    if (map['likedBy'] is Map) {
      (map['likedBy'] as Map).forEach((k, v) {
        likesMap[k.toString()] = true;
      });
    }
    return FeedPostModel(
      postId: id,
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? 'Pet Lover',
      userPhoto: map['userPhoto'],
      postType: map['postType'] ?? 'MOMENT',
      content: map['content'] ?? '',
      imageUrl: map['imageUrl'],
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      likesCount: (map['likesCount'] as num?)?.toInt() ?? likesMap.length,
      commentsCount: (map['commentsCount'] as num?)?.toInt() ?? 0,
      likedBy: likesMap,
    );
  }
}
