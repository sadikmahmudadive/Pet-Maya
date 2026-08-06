import 'cart_item_model.dart';

enum OrderStatus {
  pending('Pending'),
  processing('Processing'),
  shipped('Shipped'),
  delivered('Delivered'),
  cancelled('Cancelled');

  final String displayName;
  const OrderStatus(this.displayName);

  static OrderStatus fromString(String? status) {
    if (status == null) return OrderStatus.pending;
    switch (status.trim().toLowerCase()) {
      case 'processing':
        return OrderStatus.processing;
      case 'shipped':
        return OrderStatus.shipped;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }
}

class OrderModel {
  final String orderId;
  final String userId;
  final String userName;
  final String address;
  final String phone;
  final String paymentMethod;
  final double subtotal;
  final double shippingCharges;
  final double total;
  final int timestamp;
  final OrderStatus status;
  final List<CartItemModel> items;

  OrderModel({
    required this.orderId,
    required this.userId,
    required this.userName,
    required this.address,
    required this.phone,
    required this.paymentMethod,
    required this.subtotal,
    this.shippingCharges = 5.0,
    required this.total,
    required this.timestamp,
    this.status = OrderStatus.pending,
    required this.items,
  });

  String get shippingAddress => address;

  Map<String, dynamic> toMap() {
    return {
      'orderId': orderId,
      'userId': userId,
      'userName': userName,
      'address': address,
      'phone': phone,
      'paymentMethod': paymentMethod,
      'subtotal': subtotal,
      'shippingCharges': shippingCharges,
      'total': total,
      'timestamp': timestamp,
      'status': status.displayName,
      'items': items.map((i) => i.toMap()).toList(),
    };
  }

  factory OrderModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return OrderModel(
      orderId: id,
      userId: map['userId'] ?? '',
      userName: map['userName'] ?? '',
      address: map['address'] ?? '',
      phone: map['phone'] ?? '',
      paymentMethod: map['paymentMethod'] ?? 'COD',
      subtotal: (map['subtotal'] as num?)?.toDouble() ?? 0.0,
      shippingCharges: (map['shippingCharges'] as num?)?.toDouble() ?? 5.0,
      total: (map['total'] as num?)?.toDouble() ?? 0.0,
      timestamp: (map['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      status: OrderStatus.fromString(map['status']),
      items: (map['items'] as List<dynamic>?)
              ?.map((item) => CartItemModel.fromMap(item as Map<dynamic, dynamic>))
              .toList() ??
          [],
    );
  }
}
