import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';

import '../../data/models/order_model.dart';

/// Google Analytics (Firebase) events for the app, named exactly like the website's GA4 events so web and app
/// conversions line up and can be marked as key events / imported into Google Ads.
class AnalyticsService {
  AnalyticsService._();

  static const String currency = 'BDT';

  /// GA4 `purchase`. The transaction id is the order id (the web checkout uses the same one), so GA4 can
  /// de-duplicate. Never throws: analytics must not break checkout.
  static Future<void> logPurchase(OrderModel order) async {
    try {
      await FirebaseAnalytics.instance.logPurchase(
        currency: currency,
        value: order.total,
        transactionId: order.orderId,
        shipping: order.shippingCharges,
        coupon: order.couponCode,
        items: order.items
            .map((i) => AnalyticsEventItem(
                  itemId: i.product.id,
                  itemName: i.product.name,
                  itemBrand: i.product.brand.isEmpty ? null : i.product.brand,
                  itemCategory: i.product.category,
                  price: i.product.price,
                  quantity: i.quantity,
                ))
            .toList(),
      );
    } catch (e) {
      debugPrint('[Analytics] purchase not logged: $e');
    }
  }
}
