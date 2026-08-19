class ReviewModel {
  final String id;
  final String targetId; // The ID of the Vet, Groomer, etc. being reviewed
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
      reviewerName: map['reviewerName'] ?? 'Anonymous User',
      reviewerPhoto: map['reviewerPhoto'],
      rating: (map['rating'] as num?)?.toDouble() ?? 5.0,
      comment: map['comment'] ?? '',
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
    );
  }
}
