class ProductModel {
  final String id;
  final String shopId;
  final String name;
  final String category;
  final double price;
  final int stockQuantity;
  final String? imageUrl;
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
    this.imageUrl,
    this.description = '',
    this.brand = '',
    this.soldCount = 0,
  });

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
      'imageUrl': imageUrl,
      'description': description,
      'brand': brand,
      'soldCount': soldCount,
    };
  }

  factory ProductModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return ProductModel(
      id: id,
      shopId: map['shopId'] ?? 'shop_1',
      name: map['name'] ?? '',
      category: map['category'] ?? 'Food',
      price: (map['price'] as num?)?.toDouble() ?? 0.0,
      stockQuantity: (map['stockQuantity'] as num?)?.toInt() ?? 0,
      imageUrl: map['imageUrl'],
      description: map['description'] ?? '',
      brand: map['brand'] ?? '',
      soldCount: (map['soldCount'] as num?)?.toInt() ?? 0,
    );
  }
}
