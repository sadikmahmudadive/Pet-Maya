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
    };
  }

  factory BlogPostModel.fromMap(String id, Map<dynamic, dynamic> map) {
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
    );
  }
}
