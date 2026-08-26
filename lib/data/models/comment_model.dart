class CommentModel {
  final String commentId;
  final String postId;
  final String userId;
  final String userName;
  final String? userPhoto;
  final String text;
  final int timestamp;

  CommentModel({
    required this.commentId,
    required this.postId,
    required this.userId,
    required this.userName,
    this.userPhoto,
    required this.text,
    required this.timestamp,
  });

  factory CommentModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return CommentModel(
      commentId: id,
      postId: map['postId'] ?? '',
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? map['author'] ?? 'Pet Parent',
      userPhoto: map['userPhoto'] ?? map['authorPhoto'],
      text: map['commentText'] ?? map['text'] ?? '',
      timestamp: (map['timestamp'] as num?)?.toInt() ?? (map['createdAt'] is String ? (DateTime.tryParse(map['createdAt'])?.millisecondsSinceEpoch ?? DateTime.now().millisecondsSinceEpoch) : DateTime.now().millisecondsSinceEpoch),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'commentId': commentId,
      'postId': postId,
      'userId': userId,
      'userName': userName,
      'author': userName,
      'userPhoto': userPhoto,
      'commentText': text,
      'text': text,
      'timestamp': timestamp,
      'createdAt': DateTime.fromMillisecondsSinceEpoch(timestamp).toIso8601String(),
    };
  }
}
