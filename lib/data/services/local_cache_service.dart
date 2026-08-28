import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/pet_model.dart';
import '../models/event_model.dart';
import '../models/product_model.dart';
import '../models/order_model.dart';
import '../models/vet_model.dart';
import '../models/service_record_model.dart';
import '../models/feed_post_model.dart';
import '../models/blog_post_model.dart';

/// LocalCacheService provides instant offline data persistence via SharedPreferences.
/// It enables 0ms cold-start hydration and guarantees the UI never renders blank
/// while fetching new data from Cloud Firestore.
class LocalCacheService {
  static final LocalCacheService _instance = LocalCacheService._internal();
  factory LocalCacheService() => _instance;
  LocalCacheService._internal();

  SharedPreferences? _prefs;

  Future<void> init() async {
    try {
      _prefs ??= await SharedPreferences.getInstance();
    } catch (e) {
      debugPrint('[LocalCacheService] Init error: $e');
    }
  }

  Future<SharedPreferences> _getPrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // ─── KEYS ────────────────────────────────────────────────────────────────
  static const String _keyCurrentUser = 'pm_cache_user';
  static const String _keyPets = 'pm_cache_pets';
  static const String _keyEvents = 'pm_cache_events';
  static const String _keyProducts = 'pm_cache_products';
  static const String _keyOrders = 'pm_cache_orders';
  static const String _keyVets = 'pm_cache_vets';
  static const String _keyRecords = 'pm_cache_records';
  static const String _keyPosts = 'pm_cache_posts';
  static const String _keyBlogs = 'pm_cache_blogs';
  static const String _keyNotifications = 'pm_cache_notifications';
  static const String _keyGlobalSettings = 'pm_cache_global_settings';

  // ─── USER CACHE ──────────────────────────────────────────────────────────
  Future<void> saveCurrentUser(UserModel user) async {
    try {
      final prefs = await _getPrefs();
      await prefs.setString(_keyCurrentUser, jsonEncode(user.toMap()));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving user: $e');
    }
  }

  UserModel? loadCurrentUser() {
    try {
      final raw = _prefs?.getString(_keyCurrentUser);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as Map<String, dynamic>;
        return UserModel.fromMap(decoded['uid'] ?? '', decoded);
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading user: $e');
    }
    return null;
  }

  // ─── PETS CACHE ──────────────────────────────────────────────────────────
  Future<void> savePets(List<PetModel> pets) async {
    try {
      final prefs = await _getPrefs();
      final list = pets.map((p) => p.toMap()).toList();
      await prefs.setString(_keyPets, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving pets: $e');
    }
  }

  List<PetModel> loadPets() {
    try {
      final raw = _prefs?.getString(_keyPets);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => PetModel.fromMap((item as Map)['petID']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading pets: $e');
    }
    return [];
  }

  // ─── EVENTS CACHE ────────────────────────────────────────────────────────
  Future<void> saveEvents(List<EventModel> events) async {
    try {
      final prefs = await _getPrefs();
      final list = events.map((e) => e.toMap()).toList();
      await prefs.setString(_keyEvents, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving events: $e');
    }
  }

  List<EventModel> loadEvents() {
    try {
      final raw = _prefs?.getString(_keyEvents);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => EventModel.fromMap((item as Map)['id']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading events: $e');
    }
    return [];
  }

  // ─── PRODUCTS CACHE ──────────────────────────────────────────────────────
  Future<void> saveProducts(List<ProductModel> products) async {
    try {
      final prefs = await _getPrefs();
      final list = products.map((p) => p.toMap()).toList();
      await prefs.setString(_keyProducts, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving products: $e');
    }
  }

  List<ProductModel> loadProducts() {
    try {
      final raw = _prefs?.getString(_keyProducts);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => ProductModel.fromMap((item as Map)['id']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading products: $e');
    }
    return [];
  }

  // ─── VETS CACHE ──────────────────────────────────────────────────────────
  Future<void> saveVets(List<VetModel> vets) async {
    try {
      final prefs = await _getPrefs();
      final list = vets.map((v) => v.toMap()).toList();
      await prefs.setString(_keyVets, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving vets: $e');
    }
  }

  List<VetModel> loadVets() {
    try {
      final raw = _prefs?.getString(_keyVets);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => VetModel.fromMap((item as Map)['id']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading vets: $e');
    }
    return [];
  }

  // ─── POSTS CACHE ─────────────────────────────────────────────────────────
  Future<void> savePosts(List<FeedPostModel> posts) async {
    try {
      final prefs = await _getPrefs();
      final list = posts.map((p) => p.toMap()).toList();
      await prefs.setString(_keyPosts, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving posts: $e');
    }
  }

  List<FeedPostModel> loadPosts() {
    try {
      final raw = _prefs?.getString(_keyPosts);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => FeedPostModel.fromMap((item as Map)['id']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading posts: $e');
    }
    return [];
  }

  // ─── BLOGS CACHE ─────────────────────────────────────────────────────────
  Future<void> saveBlogs(List<BlogPostModel> blogs) async {
    try {
      final prefs = await _getPrefs();
      final list = blogs.map((b) => b.toMap()).toList();
      await prefs.setString(_keyBlogs, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving blogs: $e');
    }
  }

  List<BlogPostModel> loadBlogs() {
    try {
      final raw = _prefs?.getString(_keyBlogs);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => BlogPostModel.fromMap((item as Map)['id']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading blogs: $e');
    }
    return [];
  }

  // ─── ORDERS CACHE ────────────────────────────────────────────────────────
  Future<void> saveOrders(List<OrderModel> orders) async {
    try {
      final prefs = await _getPrefs();
      final list = orders.map((o) => o.toMap()).toList();
      await prefs.setString(_keyOrders, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving orders: $e');
    }
  }

  List<OrderModel> loadOrders() {
    try {
      final raw = _prefs?.getString(_keyOrders);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => OrderModel.fromMap((item as Map)['orderId']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading orders: $e');
    }
    return [];
  }

  // ─── SERVICE RECORDS CACHE ───────────────────────────────────────────────
  Future<void> saveRecords(List<ServiceRecordModel> records) async {
    try {
      final prefs = await _getPrefs();
      final list = records.map((r) => r.toMap()).toList();
      await prefs.setString(_keyRecords, jsonEncode(list));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving records: $e');
    }
  }

  List<ServiceRecordModel> loadRecords() {
    try {
      final raw = _prefs?.getString(_keyRecords);
      if (raw != null && raw.isNotEmpty) {
        final decoded = jsonDecode(raw) as List<dynamic>;
        return decoded
            .map((item) => ServiceRecordModel.fromMap((item as Map)['recordId']?.toString() ?? '', item as Map<String, dynamic>))
            .toList();
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading records: $e');
    }
    return [];
  }

  // ─── GLOBAL SETTINGS CACHE ───────────────────────────────────────────────
  Future<void> saveGlobalSettings(Map<String, dynamic> settings) async {
    try {
      final prefs = await _getPrefs();
      await prefs.setString(_keyGlobalSettings, jsonEncode(settings));
    } catch (e) {
      debugPrint('[LocalCacheService] Error saving global settings: $e');
    }
  }

  Map<String, dynamic>? loadGlobalSettings() {
    try {
      final raw = _prefs?.getString(_keyGlobalSettings);
      if (raw != null && raw.isNotEmpty) {
        return jsonDecode(raw) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('[LocalCacheService] Error loading global settings: $e');
    }
    return null;
  }

  // ─── CLEAR / LOGOUT ──────────────────────────────────────────────────────
  Future<void> clearUserSession() async {
    try {
      final prefs = await _getPrefs();
      await prefs.remove(_keyCurrentUser);
      await prefs.remove(_keyPets);
      await prefs.remove(_keyEvents);
      await prefs.remove(_keyOrders);
      await prefs.remove(_keyRecords);
      await prefs.remove(_keyNotifications);
    } catch (e) {
      debugPrint('[LocalCacheService] Clear session error: $e');
    }
  }
}
