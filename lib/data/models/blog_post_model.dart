class BlogPostModel {
  final String id;
  final String authorId;
  final String title;
  final String content;
  final String authorName;
  final String? authorPhoto;
  final String imageUrl;
  final String category;
  final int timestamp;
  final int readTimeMinutes;
  final List<String> tags;
  final String status; // 'PENDING', 'APPROVED', 'REJECTED', 'UNPUBLISHED'
  final bool isApproved;

  BlogPostModel({
    required this.id,
    required this.authorId,
    required this.title,
    required this.content,
    required this.authorName,
    this.authorPhoto,
    required this.imageUrl,
    required this.category,
    required this.timestamp,
    this.readTimeMinutes = 5,
    this.tags = const [],
    this.status = 'PENDING',
    this.isApproved = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'authorId': authorId,
      'title': title,
      'content': content,
      'authorName': authorName,
      'authorPhoto': authorPhoto,
      'imageUrl': imageUrl,
      'category': category,
      'timestamp': timestamp,
      'readTimeMinutes': readTimeMinutes,
      'tags': tags,
      'status': status,
      'isApproved': isApproved,
    };
  }

  factory BlogPostModel.fromMap(String id, Map<dynamic, dynamic> map) {
    final status = map['status'] ?? (map['isApproved'] == true ? 'APPROVED' : (map.containsKey('isApproved') ? 'PENDING' : 'APPROVED'));
    final isApproved = map['isApproved'] ?? (status == 'APPROVED');
    return BlogPostModel(
      id: id,
      authorId: map['authorId'] ?? '',
      title: map['title'] ?? '',
      content: map['content'] ?? '',
      authorName: map['authorName'] ?? 'Pet Maya Team',
      authorPhoto: map['authorPhoto'],
      imageUrl: map['imageUrl'] ?? 'https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?w=800',
      category: map['category'] ?? 'Health',
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      readTimeMinutes: (map['readTimeMinutes'] as num?)?.toInt() ?? 5,
      tags: (map['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      status: status,
      isApproved: isApproved,
    );
  }

  BlogPostModel copyWith({
    String? id,
    String? authorId,
    String? title,
    String? content,
    String? authorName,
    String? authorPhoto,
    String? imageUrl,
    String? category,
    int? timestamp,
    int? readTimeMinutes,
    List<String>? tags,
    String? status,
    bool? isApproved,
  }) {
    return BlogPostModel(
      id: id ?? this.id,
      authorId: authorId ?? this.authorId,
      title: title ?? this.title,
      content: content ?? this.content,
      authorName: authorName ?? this.authorName,
      authorPhoto: authorPhoto ?? this.authorPhoto,
      imageUrl: imageUrl ?? this.imageUrl,
      category: category ?? this.category,
      timestamp: timestamp ?? this.timestamp,
      readTimeMinutes: readTimeMinutes ?? this.readTimeMinutes,
      tags: tags ?? this.tags,
      status: status ?? this.status,
      isApproved: isApproved ?? this.isApproved,
    );
  }
}
