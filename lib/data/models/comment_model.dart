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

  Map<String, dynamic> toMap() {
    return {
      'commentId': commentId,
      'postId': postId,
      'userId': userId,
      'userName': userName,
      'userPhoto': userPhoto,
      'text': text,
      'timestamp': timestamp,
    };
  }

  factory CommentModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return CommentModel(
      commentId: id,
      postId: map['postId'] ?? '',
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? 'User',
      userPhoto: map['userPhoto'],
      text: map['text'] ?? '',
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
    );
  }
}
