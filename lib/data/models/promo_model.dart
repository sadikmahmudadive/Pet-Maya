class PromoModel {
  final String id;
  final String name;
  final String header;
  final String footer;
  final int discountPercent;
  final bool isActive;
  final int timestamp;

  PromoModel({
    required this.id,
    required this.name,
    required this.header,
    required this.footer,
    required this.discountPercent,
    this.isActive = true,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'header': header,
      'footer': footer,
      'discountPercent': discountPercent,
      'isActive': isActive,
      'timestamp': timestamp,
    };
  }

  factory PromoModel.fromMap(Map<dynamic, dynamic> map) {
    return PromoModel(
      id: map['id'] ?? '',
      name: map['name'] ?? '',
      header: map['header'] ?? '',
      footer: map['footer'] ?? '',
      discountPercent: (map['discountPercent'] as num?)?.toInt() ?? 0,
      isActive: map['isActive'] ?? true,
      timestamp: (map['timestamp'] as num?)?.toInt() ?? 0,
    );
  }

  PromoModel copyWith({
    String? id,
    String? name,
    String? header,
    String? footer,
    int? discountPercent,
    bool? isActive,
    int? timestamp,
  }) {
    return PromoModel(
      id: id ?? this.id,
      name: name ?? this.name,
      header: header ?? this.header,
      footer: footer ?? this.footer,
      discountPercent: discountPercent ?? this.discountPercent,
      isActive: isActive ?? this.isActive,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}
