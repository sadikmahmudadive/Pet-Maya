class ProductModel {
  final String id;
  final String shopId;
  final String name;
  final String category;
  final double price;
  final double? oldPrice;
  final int stockQuantity;
  final List<String> imageGallery;
  final String description;
  final String brand;
  final int soldCount;
  final double rating;
  final int reviewsCount;
  final bool isRxRequired;

  ProductModel({
    required this.id,
    this.shopId = 'shop_1',
    required this.name,
    required this.category,
    required this.price,
    this.oldPrice,
    required this.stockQuantity,
    this.imageGallery = const [],
    this.description = '',
    this.brand = '',
    this.soldCount = 0,
    this.rating = 0.0,
    this.reviewsCount = 0,
    this.isRxRequired = false,
  });

  String? get imageUrl => imageGallery.isNotEmpty ? imageGallery.first : null;
  bool get isLowStock => stockQuantity > 0 && stockQuantity <= 5;
  bool get isOutOfStock => stockQuantity <= 0;

  Map<String, dynamic> toMap() {
    return {
      'id': id, 'shopId': shopId, 'name': name, 'category': category, 'price': price, 'oldPrice': oldPrice,
      'stockQuantity': stockQuantity, 'imageGallery': imageGallery, 'description': description,
      'brand': brand, 'soldCount': soldCount, 'rating': rating, 'reviewsCount': reviewsCount, 'isRxRequired': isRxRequired,
    };
  }

  ProductModel copyWith({
    String? id,
    String? shopId,
    String? name,
    String? category,
    double? price,
    double? oldPrice,
    int? stockQuantity,
    List<String>? imageGallery,
    String? description,
    String? brand,
    int? soldCount,
    double? rating,
    int? reviewsCount,
    bool? isRxRequired,
  }) {
    return ProductModel(
      id: id ?? this.id,
      shopId: shopId ?? this.shopId,
      name: name ?? this.name,
      category: category ?? this.category,
      price: price ?? this.price,
      oldPrice: oldPrice ?? this.oldPrice,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      imageGallery: imageGallery ?? this.imageGallery,
      description: description ?? this.description,
      brand: brand ?? this.brand,
      soldCount: soldCount ?? this.soldCount,
      rating: rating ?? this.rating,
      reviewsCount: reviewsCount ?? this.reviewsCount,
      isRxRequired: isRxRequired ?? this.isRxRequired,
    );
  }

  factory ProductModel.fromMap(String id, Map<dynamic, dynamic> map) {
    List<String> gallery = [];
    if (map['imageGallery'] != null) gallery = List<String>.from(map['imageGallery'] as List);
    else if (map['imageUrl'] != null) gallery = [map['imageUrl'].toString()];

    return ProductModel(
      id: id, shopId: map['shopId'] ?? 'shop_1', name: map['name'] ?? '', category: map['category'] ?? 'Food',
      price: (map['price'] as num?)?.toDouble() ?? 0.0, 
      oldPrice: (map['oldPrice'] as num?)?.toDouble(),
      stockQuantity: (map['stockQuantity'] as num?)?.toInt() ?? 0,
      imageGallery: gallery, description: map['description'] ?? '', brand: map['brand'] ?? '',
      soldCount: (map['soldCount'] as num?)?.toInt() ?? 0, rating: (map['rating'] as num?)?.toDouble() ?? 0.0,
      reviewsCount: (map['reviewsCount'] as num?)?.toInt() ?? 0, isRxRequired: map['isRxRequired'] ?? false,
    );
  }
}
