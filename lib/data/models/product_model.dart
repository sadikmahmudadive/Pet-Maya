class ProductModel {
  final String id;
  final String shopId;
  final String name;
  final String category;
  final double price;
  final int stockQuantity;
  final List<String> imageGallery; // Modern Multi-Image Support
  final String description;
  final String brand;
  final int soldCount;

  ProductModel({
    required this.id,
    this.shopId = 'shop_1',
    required this.name,
    required this.category,
    required this.price,
    required this.stockQuantity,
    this.imageGallery = const [],
    this.description = '',
    this.brand = '',
    this.soldCount = 0,
  });

  // Backward compatibility getter for single-image UI parts
  String? get imageUrl => imageGallery.isNotEmpty ? imageGallery.first : null;

  bool get isLowStock => stockQuantity > 0 && stockQuantity <= 5;
  bool get isOutOfStock => stockQuantity <= 0;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'shopId': shopId,
      'name': name,
      'category': category,
      'price': price,
      'stockQuantity': stockQuantity,
      'imageGallery': imageGallery,
      'description': description,
      'brand': brand,
      'soldCount': soldCount,
    };
  }

  factory ProductModel.fromMap(String id, Map<dynamic, dynamic> map) {
    // Migration logic: Handle old 'imageUrl' field and convert to gallery list
    List<String> gallery = [];
    if (map['imageGallery'] != null) {
      gallery = List<String>.from(map['imageGallery'] as List);
    } else if (map['imageUrl'] != null && map['imageUrl'].toString().isNotEmpty) {
      gallery = [map['imageUrl'].toString()];
    }

    return ProductModel(
      id: id,
      shopId: map['shopId'] ?? 'shop_1',
      name: map['name'] ?? '',
      category: map['category'] ?? 'Food',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      stockQuantity: (map['stockQuantity'] as num?)?.toInt() ?? 0,
      imageGallery: gallery,
      description: map['description'] ?? '',
      brand: map['brand'] ?? '',
      soldCount: (map['soldCount'] as num?)?.toInt() ?? 0,
    );
  }
}
