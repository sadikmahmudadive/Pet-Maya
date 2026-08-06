class ReviewModel {
  final String id;
  final String targetId; // Vet ID or Shop ID
  final String reviewerId;
  final String reviewerName;
  final String? reviewerPhoto;
  final double rating;
  final String comment;
  final int timestamp;

  ReviewModel({
    required this.id,
    required this.targetId,
    required this.reviewerId,
    required this.reviewerName,
    this.reviewerPhoto,
    required this.rating,
    required this.comment,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'targetId': targetId,
      'reviewerId': reviewerId,
      'reviewerName': reviewerName,
      'reviewerPhoto': reviewerPhoto,
      'rating': rating,
      'comment': comment,
      'timestamp': timestamp,
    };
  }

  factory ReviewModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return ReviewModel(
      id: id,
      targetId: map['targetId'] ?? '',
      reviewerId: map['reviewerId'] ?? '',
      reviewerName: map['reviewerName'] ?? 'Anonymous',
      reviewerPhoto: map['reviewerPhoto'],
      rating: (map['rating'] ?? 0).toDouble(),
      comment: map['comment'] ?? '',
      timestamp: map['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }
}
