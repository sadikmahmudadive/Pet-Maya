class CouponModel {
  final String code;
  final double discountAmount;
  final bool isPercentage;
  final double minOrderAmount;
  final int expiryTimestamp;
  final bool isActive;

  CouponModel({
    required this.code,
    required this.discountAmount,
    this.isPercentage = true,
    this.minOrderAmount = 0.0,
    required this.expiryTimestamp,
    this.isActive = true,
  });

  Map<String, dynamic> toMap() {
    return {
      'code': code,
      'discountAmount': discountAmount,
      'isPercentage': isPercentage,
      'minOrderAmount': minOrderAmount,
      'expiryTimestamp': expiryTimestamp,
      'isActive': isActive,
    };
  }

  factory CouponModel.fromMap(Map<dynamic, dynamic> map) {
    return CouponModel(
      code: map['code'] ?? '',
      discountAmount: (map['discountAmount'] as num?)?.toDouble() ?? 0.0,
      isPercentage: map['isPercentage'] ?? true,
      minOrderAmount: (map['minOrderAmount'] as num?)?.toDouble() ?? 0.0,
      expiryTimestamp: (map['expiryTimestamp'] as num?)?.toInt() ?? 0,
      isActive: map['isActive'] ?? true,
    );
  }

  bool get isExpired => DateTime.now().millisecondsSinceEpoch > expiryTimestamp;

  double calculateDiscount(double subtotal) {
    if (subtotal < minOrderAmount || !isActive || isExpired) return 0.0;
    if (isPercentage) {
      return (subtotal * discountAmount) / 100;
    }
    return discountAmount;
  }
}
