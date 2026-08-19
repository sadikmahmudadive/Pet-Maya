import 'product_model.dart';

class CartItemModel {
  final ProductModel product;
  int quantity;

  CartItemModel({
    required this.product,
    this.quantity = 1,
  });

  double get totalPrice => product.price * quantity;

  Map<String, dynamic> toMap() {
    return {
      'productId': product.id,
      'productName': product.name,
      'price': product.price,
      'quantity': quantity,
      'imageUrl': product.imageUrl,
    };
  }

  factory CartItemModel.fromMap(Map<dynamic, dynamic> map) {
    return CartItemModel(
      product: ProductModel(
        id: map['productId'] ?? '',
        shopId: '',
        name: map['productName'] ?? '',
        category: '',
        price: (map['price'] as num?)?.toDouble() ?? 0.0,
        stockQuantity: 99,
        imageGallery: map['imageUrl'] != null ? [map['imageUrl'].toString()] : [],
      ),
      quantity: (map['quantity'] as num?)?.toInt() ?? 1,
    );
  }
}
