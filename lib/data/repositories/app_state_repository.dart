import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:io';

import '../models/user_model.dart';
import '../models/pet_model.dart';
import '../models/event_model.dart';
import '../models/product_model.dart';
import '../models/cart_item_model.dart';
import '../models/order_model.dart';
import '../models/vet_model.dart';
import '../models/service_record_model.dart';
import '../models/feed_post_model.dart';
import '../models/comment_model.dart';
import '../models/notification_model.dart';
import '../models/review_model.dart';
import '../models/blog_post_model.dart';
import '../models/coupon_model.dart';
import '../services/firebase_service.dart';
import '../services/local_cache_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/native_bridge_service.dart';
import '../../main.dart';
import '../../presentation/common_widgets/premium_toast.dart';

class AppStateRepository extends ChangeNotifier {
  static final AppStateRepository _instance = AppStateRepository._internal();
  factory AppStateRepository() => _instance;

  final _uuid = const Uuid();
  final _firebase = FirebaseService();
  final _functions = FirebaseFunctions.instanceFor(region: 'us-central1');
  final _localCache = LocalCacheService();

  Future<dynamic> _callAiProxy(String method, Map<String, dynamic> data) async {
    final user = _firebase.currentFirebaseUser;
    if (user == null) {
      debugPrint('[AI Proxy] FATAL: No active Firebase Auth session.');
      return {
        "response": "Please sign in to use AI features.",
        "schedule": [],
        "breed": "Unknown",
        "recommendation": {},
      };
    }
    try {
      final token = await user.getIdToken();
      debugPrint('[AI Proxy] Calling $method for User: ${user.uid}');
      final result = await _functions.httpsCallable('openai_proxy').call({
        'method': method,
        ...data,
      });
      return result.data;
    } catch (e) {
      debugPrint('[AI Proxy] Error: $e');
      rethrow;
    }
  }

  ThemeMode _themeMode = ThemeMode.system;
  ThemeMode get themeMode => _themeMode;
  static const String _themeModeKey = 'app_theme_mode';

  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;

  bool _isLoading = false;
  bool get isLoading => _isLoading;
  String? _syncError;
  String? get syncError => _syncError;

  final List<PetModel> _pets = [];
  final List<EventModel> _events = [];
  final List<ProductModel> _products = [];
  final List<CartItemModel> _cartItems = [];
  final List<OrderModel> _orders = [];
  final List<VetModel> _vets = [];
  final List<ServiceRecordModel> _serviceRecords = [];
  final List<FeedPostModel> _posts = [];
  final Map<String, List<CommentModel>> _postComments = {};
  final List<String> _auditLogs = [];
  final List<String> _systemBroadcasts = [];
  final List<UserModel> _allUsers = [];
  final List<NotificationModel> _notifications = [];
  final List<ReviewModel> _reviews = [];
  final List<BlogPostModel> _blogs = [];
  final List<CouponModel> _coupons = [];
  CouponModel? _appliedCoupon;

  final Map<String, String> _calculatedDistances = {};
  final Map<String, UserModel> _userCache = {};
  String? _systemBanner;
  bool _isMaintenanceMode = false;
  bool _isAiEnabled = true;
  bool _isRegistrationAllowed = true;
  double _baseShippingFee = 5.0;

  List<PetModel> get pets => List.unmodifiable(_pets);
  List<BlogPostModel> get blogs => List.unmodifiable(_blogs);
  List<CouponModel> get coupons => List.unmodifiable(_coupons);
  CouponModel? get appliedCoupon => _appliedCoupon;
  Map<String, UserModel> get userCache => Map.unmodifiable(_userCache);
  String? get systemBanner => _systemBanner;
  bool get isMaintenanceMode => _isMaintenanceMode;
  bool get isAiEnabled => _isAiEnabled;
  bool get isRegistrationAllowed => _isRegistrationAllowed;
  double get baseShippingFee => _baseShippingFee;

  List<EventModel> get events {
    final all = List<EventModel>.from(_events);
    if (_currentUser?.role == UserRole.petOwner) {
      for (final pet in _pets) {
        if (pet.dob.isNotEmpty) {
          try {
            final dob = DateTime.parse(pet.dob);
            final now = DateTime.now();
            final today = DateTime(now.year, now.month, now.day);
            final bday = DateTime(now.year, dob.month, dob.day);
            all.add(
              EventModel(
                id: 'bday_${pet.petID}_${bday.year}',
                userId: _currentUser?.uid ?? '',
                title: "${pet.name}'s Birthday! 🎂",
                category: 'Birthday',
                note: 'Happy Birthday to ${pet.name}!',
                petName: pet.name,
                petId: pet.petID,
                date: bday,
                fromTime: '08:00 AM',
                toTime: '11:59 PM',
                isReminderEnabled: true,
                isCompleted: bday.isBefore(today),
              ),
            );
          } catch (_) {}
        }
      }
    }
    all.sort((a, b) => b.date.compareTo(a.date));
    return List.unmodifiable(all);
  }

  List<ProductModel> get products => List.unmodifiable(_products);
  List<CartItemModel> get cartItems => List.unmodifiable(_cartItems);
  List<OrderModel> get orders => List.unmodifiable(_orders);
  List<VetModel> get vets {
    if (_calculatedDistances.isEmpty) return List.unmodifiable(_vets);
    return List.unmodifiable(
      _vets.map((vet) {
        if (_calculatedDistances.containsKey(vet.id))
          return vet.copyWith(distance: _calculatedDistances[vet.id]);
        return vet;
      }),
    );
  }

  List<ServiceRecordModel> get serviceRecords =>
      List.unmodifiable(_serviceRecords);
  List<FeedPostModel> get posts => List.unmodifiable(_posts);
  List<String> get auditLogs => List.unmodifiable(_auditLogs);
  List<String> get systemBroadcasts => List.unmodifiable(_systemBroadcasts);
  List<UserModel> get allUsers => List.unmodifiable(_allUsers);
  List<NotificationModel> get notifications =>
      List.unmodifiable(_notifications);
  List<ReviewModel> get reviews => List.unmodifiable(_reviews);
  int get unreadNotificationCount =>
      _notifications.where((n) => !n.isRead).length;

  double get cartSubtotal =>
      _cartItems.fold(0.0, (sum, item) => sum + item.totalPrice);
  double get cartShipping => _cartItems.isEmpty ? 0.0 : _baseShippingFee;
  double get cartDiscount => _appliedCoupon?.calculateDiscount(cartSubtotal) ?? 0.0;
  double get cartTotal => cartSubtotal + cartShipping - cartDiscount;
  int get cartCount => _cartItems.fold(0, (sum, item) => sum + item.quantity);

  AppStateRepository._internal() {
    _hydrateFromLocalCache();
    _loadSavedThemeMode();
    _restoreExistingSession();
    _setupNotificationListener();
  }

  void _hydrateFromLocalCache() {
    try {
      final user = _localCache.loadCurrentUser();
      if (user != null) _currentUser = user;

      final pets = _localCache.loadPets();
      if (pets.isNotEmpty) {
        _pets
          ..clear()
          ..addAll(pets);
      }

      final events = _localCache.loadEvents();
      if (events.isNotEmpty) {
        _events
          ..clear()
          ..addAll(events);
      }

      final products = _localCache.loadProducts();
      if (products.isNotEmpty) {
        _products
          ..clear()
          ..addAll(products);
      }

      final vets = _localCache.loadVets();
      if (vets.isNotEmpty) {
        _vets
          ..clear()
          ..addAll(vets);
      }

      final posts = _localCache.loadPosts();
      if (posts.isNotEmpty) {
        _posts
          ..clear()
          ..addAll(posts);
      }

      final blogs = _localCache.loadBlogs();
      if (blogs.isNotEmpty) {
        _blogs
          ..clear()
          ..addAll(blogs);
      }

      final orders = _localCache.loadOrders();
      if (orders.isNotEmpty) {
        _orders
          ..clear()
          ..addAll(orders);
      }

      final records = _localCache.loadRecords();
      if (records.isNotEmpty) {
        _serviceRecords
          ..clear()
          ..addAll(records);
      }

      final settings = _localCache.loadGlobalSettings();
      if (settings != null) {
        if (settings.containsKey('maintenance_mode')) {
          _isMaintenanceMode = settings['maintenance_mode'] == true;
        }
        if (settings.containsKey('ai_enabled')) {
          _isAiEnabled = settings['ai_enabled'] == true;
        }
        if (settings.containsKey('registration_allowed')) {
          _isRegistrationAllowed = settings['registration_allowed'] == true;
        }
        if (settings.containsKey('base_shipping_fee')) {
          _baseShippingFee = (settings['base_shipping_fee'] as num).toDouble();
        }
        if (settings.containsKey('system_banner')) {
          _systemBanner = settings['system_banner']?.toString();
        }
      }

      debugPrint(
        '[AppStateRepository] Offline data hydrated (0ms blank UI prevention).',
      );
    } catch (e) {
      debugPrint('[AppStateRepository] Offline hydration error: $e');
    }
  }

  Future<void> _loadSavedThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_themeModeKey);
      if (saved == 'light')
        _themeMode = ThemeMode.light;
      else if (saved == 'dark')
        _themeMode = ThemeMode.dark;
      else
        _themeMode = ThemeMode.system;
      notifyListeners();
    } catch (e) {
      debugPrint('[AppStateRepository] Error loading theme mode: $e');
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _themeModeKey,
        mode == ThemeMode.light
            ? 'light'
            : mode == ThemeMode.dark
            ? 'dark'
            : 'system',
      );
    } catch (e) {
      debugPrint('[AppStateRepository] Error saving theme mode: $e');
    }
  }

  Future<void> toggleThemeMode(BuildContext context) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    await setThemeMode(isDark ? ThemeMode.light : ThemeMode.dark);
  }

  void _setupNotificationListener() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (message.notification != null) {
        NotificationType type = NotificationType.system;
        final data = message.data;
        if (data.containsKey('type')) {
          type = NotificationType.values.firstWhere(
            (e) => e.name == data['type'],
            orElse: () => NotificationType.system,
          );
        }
        addNotification(
          title: message.notification!.title ?? 'New Alert',
          message: message.notification!.body ?? '',
          type: type,
        );
      }
    });
  }

  Future<void> _restoreExistingSession() async {
    final fUser = _firebase.currentFirebaseUser;
    if (fUser != null) {
      try {
        final profile = await _firebase.fetchUserProfile(fUser.uid);
        if (profile != null) {
          _currentUser = profile;
          _localCache.saveCurrentUser(profile);
          await syncFromFirebase(_currentUser!);
        } else if (_currentUser != null) {
          await syncFromFirebase(_currentUser!);
        }
      } catch (e) {
        debugPrint('[AppStateRepository] Session restoration failed: $e');
        if (_currentUser != null) {
          await syncFromFirebase(_currentUser!);
        }
      }
    } else if (_currentUser != null) {
      await syncFromFirebase(_currentUser!);
    }
    _isInitialized = true;
    notifyListeners();
  }

  void showToast(
    String message, {
    ToastType type = ToastType.success,
    BuildContext? context,
  }) {
    final effectiveContext =
        context ?? TailWaggingApp.navigatorKey.currentContext;
    if (effectiveContext != null) {
      PremiumToast.show(effectiveContext, message, type: type);
    }
  }

  Future<void> syncFromFirebase(UserModel user) async {
    _setLoading(false);
    try {
      NotificationService().getToken().then((fcmToken) {
        if (fcmToken != null) {
          final updatedUser = user.copyWith(fcmToken: fcmToken);
          _firebase.saveUserProfile(updatedUser);
          _currentUser = updatedUser;
        }
      });
      _subscribeToTopics(user);
      _currentUser = user;
      Future.wait([_loadProducts(), _loadCommunityPosts(), _loadBlogs(), _loadCoupons()]);
      _listenToVets();
      _listenToCurrentUser(user.uid);
      _listenToGlobalSettings();
      switch (user.role) {
        case UserRole.petOwner:
          _listenToPets(user.uid);
          _listenToEvents(user.uid);
          _listenToServiceRecords('');
          _listenToUserOrders(user.uid);
          break;
        case UserRole.veterinarian:
        case UserRole.grooming:
        case UserRole.boarding:
        case UserRole.shelter:
          _listenToPets('');
          _listenToEventsForProvider(user.uid);
          _listenToServiceRecords('');
          _listenToAllOrders();
          break;
        case UserRole.petShop:
          _listenToAllOrders();
          break;
        case UserRole.admin:
        case UserRole.superAdmin:
          _listenToPets('');
          _listenToEvents('');
          _listenToServiceRecords('');
          _listenToAllOrders();
          _listenToAllUsers();
          break;
      }
      _listenToNotifications(user.uid);
      if (user.latitude != null && user.longitude != null)
        _calculateDynamicDistances(user.latitude!, user.longitude!);
      logAudit('Firebase Sync', 'Data loaded for ${user.name}');
    } catch (e) {
      debugPrint('[AppStateRepository] syncFromFirebase error: $e');
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _listenToPets(String ownerUID) {
    _firebase.streamPets(ownerUID).listen(
      (fetched) {
        _pets
          ..clear()
          ..addAll(fetched);
        notifyListeners();
      },
      onError: (e) =>
          debugPrint('[AppStateRepository] _listenToPets error: $e'),
    );
  }

  void _listenToVets() {
    _firebase.streamVets().listen((fetched) {
      _vets
        ..clear()
        ..addAll(fetched);
      if (_currentUser?.latitude != null && _currentUser?.longitude != null)
        _calculateDynamicDistances(
          _currentUser!.latitude!,
          _currentUser!.longitude!,
        );
      notifyListeners();
    });
  }

  void _calculateDynamicDistances(double userLat, double userLng) {
    bool changed = false;
    for (var vet in _vets) {
      if (vet.latitude != null && vet.longitude != null) {
        final distanceInMeters = Geolocator.distanceBetween(
          userLat,
          userLng,
          vet.latitude!,
          vet.longitude!,
        );
        String distanceStr = distanceInMeters < 1000
            ? '${distanceInMeters.toStringAsFixed(0)} m'
            : '${(distanceInMeters / 1000).toStringAsFixed(1)} km';
        if (_calculatedDistances[vet.id] != distanceStr) {
          _calculatedDistances[vet.id] = distanceStr;
          changed = true;
        }
      }
    }
    if (changed) notifyListeners();
  }

  void _listenToEvents(String userId) {
    _firebase.streamEvents(userId).listen((fetched) {
      _events
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    });
  }

  void _listenToEventsForProvider(String providerId) {
    _firebase.streamEventsForProvider(providerId).listen((fetched) {
      _events
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    });
  }

  void _listenToServiceRecords(String petId) {
    _firebase.streamServiceRecords(petId).listen((fetched) {
      _serviceRecords
        ..clear()
        ..addAll(fetched);
      _localCache.saveRecords(_serviceRecords);
      notifyListeners();
    });
  }

  void _listenToAllOrders() {
    _firebase.streamAllOrders().listen((fetched) {
      _orders
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    });
  }

  void _listenToAllUsers() {
    _firebase.streamAllUsers().listen((fetched) {
      _allUsers
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    });
  }

  void _listenToUserOrders(String userId) {
    _firebase.streamUserOrders(userId).listen((fetched) {
      _orders
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    });
  }

  void _listenToNotifications(String userId) {
    _firebase.streamNotifications(userId).listen((fetched) {
      _notifications
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    });
  }

  void _listenToCurrentUser(String userId) {
    _firebase.streamUserProfile(userId).listen((updated) {
      if (updated != null) {
        _currentUser = (_currentUser != null && updated.fcmToken == null)
            ? updated.copyWith(fcmToken: _currentUser!.fcmToken)
            : updated;
        notifyListeners();
      }
    });
  }

  void _listenToGlobalSettings() {
    _firebase.streamGlobalSettings().listen((doc) {
      if (doc.exists && doc.data() != null) {
        final data = doc.data() as Map<String, dynamic>;
        _systemBanner = data['system_banner'] as String?;
        if (data.containsKey('maintenance_mode')) {
          _isMaintenanceMode = data['maintenance_mode'] as bool? ?? false;
        }
        if (data.containsKey('ai_enabled')) {
          _isAiEnabled = data['ai_enabled'] as bool? ?? true;
        }
        if (data.containsKey('registration_allowed')) {
          _isRegistrationAllowed =
              data['registration_allowed'] as bool? ?? true;
        }
        if (data.containsKey('base_shipping_fee')) {
          _baseShippingFee =
              (data['base_shipping_fee'] as num?)?.toDouble() ?? 5.0;
        }
        notifyListeners();
      }
    });
  }

  Future<void> fetchAndCacheUser(String userId) async {
    if (_userCache.containsKey(userId)) return;
    try {
      final user = await _firebase.fetchUserProfile(userId);
      if (user != null) {
        _userCache[userId] = user;
        _debouncedNotify();
      }
    } catch (_) {}
  }

  Timer? _debounceTimer;
  void _debouncedNotify() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(
      const Duration(milliseconds: 100),
      () => notifyListeners(),
    );
  }

  Future<void> _loadProducts() async {
    try {
      final fetched = await _firebase.fetchProducts();
      _products
        ..clear()
        ..addAll(fetched);
    } catch (e) {
      debugPrint('[AppStateRepository] _loadProducts error: $e');
    }
  }

  Future<void> loadAllUsers() async {
    try {
      final fetched = await _firebase.fetchUsers();
      _allUsers
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    } catch (e) {
      debugPrint('[AppStateRepository] loadAllUsers error: $e');
    }
  }

  Future<void> _loadCommunityPosts() async {
    _firebase.streamPosts().listen((fetchedPosts) {
      _posts
        ..clear()
        ..addAll(fetchedPosts);
      notifyListeners();
    });
  }

  Future<void> _loadBlogs() async {
    _firebase.streamBlogs().listen((fetchedBlogs) {
      _blogs
        ..clear()
        ..addAll(fetchedBlogs);
      notifyListeners();
    });
  }

  Future<void> _loadCoupons() async {
    _firebase.streamCoupons().listen((fetchedCoupons) {
      _coupons
        ..clear()
        ..addAll(fetchedCoupons);
      notifyListeners();
    });
  }

  bool applyCoupon(String code) {
    final coupon = _coupons.firstWhere(
      (c) => c.code.toUpperCase() == code.trim().toUpperCase(),
      orElse: () => throw 'Coupon not found',
    );

    if (coupon.isExpired) throw 'Coupon has expired';
    if (!coupon.isActive) throw 'Coupon is not active';
    if (cartSubtotal < coupon.minOrderAmount) {
      throw 'Min order amount ৳${coupon.minOrderAmount} required';
    }

    _appliedCoupon = coupon;
    notifyListeners();
    return true;
  }

  void removeCoupon() {
    _appliedCoupon = null;
    notifyListeners();
  }

  void _subscribeToTopics(UserModel user) {
    final ns = NotificationService();
    ns.subscribeToTopic('everyone');
    if (user.role == UserRole.petOwner)
      ns.subscribeToTopic('pet_owners');
    else if (user.role == UserRole.veterinarian)
      ns.subscribeToTopic('vets');
    else if (user.role == UserRole.petShop)
      ns.subscribeToTopic('merchants');
  }

  Future<void> addBlog(BlogPostModel blog) async {
    _blogs.insert(0, blog);
    notifyListeners();
    await _firebase.saveBlog(blog);
    logAudit('Blog Created', 'User ${_currentUser?.name} published an article');
  }

  Future<void> updateBlogStatus(
    String blogId,
    String status,
    bool isApproved,
  ) async {
    final index = _blogs.indexWhere((b) => b.id == blogId);
    if (index != -1) {
      _blogs[index] = _blogs[index].copyWith(
        status: status,
        isApproved: isApproved,
      );
      notifyListeners();
    }
    await _firebase.updateBlogStatus(blogId, status, isApproved);
  }

  Future<void> deleteBlog(String blogId) async {
    _blogs.removeWhere((b) => b.id == blogId);
    notifyListeners();
    await _firebase.deleteBlog(blogId);
  }

  Future<void> loginAs({
    required String email,
    required String name,
    required UserRole role,
  }) async {
    _setLoading(true);
    try {
      await _firebase.signInAnonymouslyIfNeeded();
      final firebaseUID =
          _firebase.currentFirebaseUser?.uid ??
          'usr_${_uuid.v4().substring(0, 8)}';
      UserRole effectiveRole = role;
      if (email.toLowerCase() == 'admin@mail.com' ||
          email.toLowerCase() == 'admin@petmaya.app')
        effectiveRole = UserRole.superAdmin;
      final existingProfile = await _firebase.fetchUserProfile(firebaseUID);
      _currentUser = UserModel(
        uid: firebaseUID,
        name: existingProfile?.name ?? name,
        email: email,
        role: existingProfile?.role ?? effectiveRole,
        photoUrl: existingProfile?.photoUrl,
        phone: existingProfile?.phone,
        isVerified:
            existingProfile?.isVerified ??
            (effectiveRole == UserRole.veterinarian),
        joinedTimestamp:
            existingProfile?.joinedTimestamp ??
            DateTime.now().millisecondsSinceEpoch,
      );
      await syncFromFirebase(_currentUser!);
    } catch (e) {
      _syncError = 'Login error: $e';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signInWithEmail({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    try {
      final userCredential = await _firebase.signIn(email, password);
      final profile = await _firebase.fetchUserProfile(
        userCredential.user!.uid,
      );
      if (profile == null) throw 'User profile not found.';
      UserRole effectiveRole = profile.role;
      if (email.toLowerCase() == 'admin@mail.com' ||
          email.toLowerCase() == 'admin@petmaya.app')
        effectiveRole = UserRole.superAdmin;
      _currentUser = profile.copyWith(role: effectiveRole);
      await syncFromFirebase(_currentUser!);
    } catch (e) {
      _syncError = 'Login error: ${e.toString()}';
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> loginWithGoogle({UserRole? defaultRole}) async {
    _setLoading(true);
    try {
      final userCredential = await _firebase.signInWithGoogle();
      if (userCredential != null && userCredential.user != null) {
        final fUser = userCredential.user!;
        var profile = await _firebase.fetchUserProfile(fUser.uid);
        if (profile == null) {
          profile = UserModel(
            uid: fUser.uid,
            name: fUser.displayName ?? 'Google User',
            email: fUser.email ?? '',
            photoUrl: fUser.photoURL,
            role: defaultRole ?? UserRole.petOwner,
            isVerified: false,
            points: 15,
            referralCode: UserModel.generateReferralCode(fUser.uid),
            joinedTimestamp: DateTime.now().millisecondsSinceEpoch,
          );
          await _firebase.saveUserProfile(profile);
        }
        _currentUser = profile;
        await syncFromFirebase(_currentUser!);
      }
    } catch (e) {
      _syncError = 'Google Login error: $e';
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _firebase.sendPasswordResetEmail(email);
    } catch (_) {
      rethrow;
    }
  }

  Future<void> signUp({
    required String email,
    required String password,
    required String name,
    required UserRole role,
    String? phone,
    String? referralCode,
  }) async {
    _setLoading(true);
    try {
      final userCredential = await _firebase.createAccount(email, password);
      final firebaseUID = userCredential.user!.uid;
      _currentUser = UserModel(
        uid: firebaseUID,
        name: name,
        email: email,
        role: role,
        phone: phone,
        isVerified: role == UserRole.veterinarian,
        points: 15,
        referralCode: UserModel.generateReferralCode(firebaseUID),
        joinedTimestamp: DateTime.now().millisecondsSinceEpoch,
      );
      await syncFromFirebase(_currentUser!);
      if (referralCode != null && referralCode.trim().isNotEmpty)
        await _firebase.applyReferralCode(
          userUid: firebaseUID,
          code: referralCode.trim().toUpperCase(),
        );
      if (role == UserRole.veterinarian ||
          role == UserRole.grooming ||
          role == UserRole.boarding) {
        await _firebase.saveVet(
          VetModel(
            id: firebaseUID,
            name: name,
            qualification: role == UserRole.veterinarian
                ? 'Verified Veterinarian'
                : 'Pet Care Professional',
            tag: role.displayName,
            phone: phone ?? '',
            isVerified: role == UserRole.veterinarian,
            rating: 0.0,
            reviewsCount: 0,
          ),
        );
      }
    } catch (e) {
      _syncError = 'Signup error: ${e.toString()}';
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _firebase.signOut();
    _currentUser = null;
    _pets.clear();
    _events.clear();
    _orders.clear();
    _serviceRecords.clear();
    _posts.clear();
    _cartItems.clear();
    notifyListeners();
  }

  Future<void> deleteAccount() async {
    if (_currentUser == null) return;
    final uid = _currentUser!.uid;
    await _firebase.deleteUserData(uid);
    await _firebase.deleteAccount();
    await logout();
  }

  Future<void> addPet(PetModel pet) async {
    _pets.add(pet);
    notifyListeners();
    await _firebase.savePet(pet);
    await _schedulePetReminders(pet);
  }

  Future<void> updatePet(PetModel updatedPet) async {
    final idx = _pets.indexWhere((p) => p.petID == updatedPet.petID);
    if (idx != -1) {
      _pets[idx] = updatedPet;
      notifyListeners();
      await _firebase.savePet(updatedPet);
      await _schedulePetReminders(updatedPet);
    }
  }

  Future<void> deletePet(String petId) async {
    _pets.removeWhere((p) => p.petID == petId);
    notifyListeners();
    await _firebase.deletePet(petId);
  }

  Future<void> _schedulePetReminders(PetModel pet) async {
    if (pet.feedingTimes.isNotEmpty) {
      final now = DateTime.now();
      for (int i = 0; i < pet.feedingTimes.length; i++) {
        DateTime scheduledDate = _parseScheduledTime(now, pet.feedingTimes[i]);
        if (scheduledDate.isBefore(now))
          scheduledDate = scheduledDate.add(const Duration(days: 1));
        await NativeBridgeService.scheduleAlarm(
          id: 'feed_${pet.petID}_$i',
          title: 'Meal Time for ${pet.name}!',
          body: 'Time for meal.',
          category: 'feeding',
          timestamp: scheduledDate.millisecondsSinceEpoch,
          isFeeding: true,
        );
      }
    }
  }

  Future<void> addEvent(EventModel event) async {
    _events.add(event);
    notifyListeners();
    await _firebase.saveEvent(event);
  }

  Future<void> deleteEvent(String eventId) async {
    final old = _events.firstWhere((e) => e.id == eventId);
    _events.removeWhere((e) => e.id == eventId);
    notifyListeners();
    await _firebase.deleteEvent(old.userId, old.date, eventId);
    await NativeBridgeService.cancelAlarm(eventId);
  }

  Future<void> toggleEventCompletion(String eventId) async {
    final idx = _events.indexWhere((e) => e.id == eventId);
    if (idx != -1) {
      _events[idx] = _events[idx].copyWith(
        isCompleted: !_events[idx].isCompleted,
      );
      notifyListeners();
      await _firebase.saveEvent(_events[idx]);
    }
  }

  Future<String> runAiHealthDiagnosis({
    required String petName,
    required String prompt,
    File? imageFile,
  }) async {
    try {
      String? base64Image;
      if (imageFile != null)
        base64Image = base64Encode(await imageFile.readAsBytes());
      final result = await _callAiProxy('health_diagnosis', {
        'petName': petName,
        'prompt': prompt,
        'image': base64Image,
      });
      return result['response'].toString();
    } catch (e) {
      return "AI Error: $e";
    }
  }

  Future<void> saveAiDiagnosisToPetRecord({
    required String petId,
    required String petName,
    required String title,
    required String diagnosis,
    required String suggestion,
  }) async {
    final record = ServiceRecordModel(
      recordId: 'rec_${_uuid.v4().substring(0, 6)}',
      petId: petId,
      petName: petName,
      serviceType: 'AI Diagnostic',
      providerId: 'ai_scanner',
      providerName: 'AI Health Diagnostic System',
      providerRole: 'Veterinary AI',
      date: DateTime.now().toString().substring(0, 10),
      title: title,
      description: diagnosis,
      diagnosis: diagnosis,
      suggestion: suggestion,
      isSharedWithVets: true,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    _serviceRecords.insert(0, record);
    _localCache.saveRecords(_serviceRecords);
    notifyListeners();
    await _firebase.saveServiceRecord(record);
  }

  Future<void> addServiceRecord(ServiceRecordModel record) async {
    _serviceRecords.insert(0, record);
    _localCache.saveRecords(_serviceRecords);
    notifyListeners();
    await _firebase.saveServiceRecord(record);
  }

  Future<void> deleteServiceRecord(String recordId) async {
    final record = _serviceRecords.firstWhere((r) => r.recordId == recordId);
    _serviceRecords.removeWhere((r) => r.recordId == recordId);
    _localCache.saveRecords(_serviceRecords);
    notifyListeners();
    await _firebase.deleteServiceRecord(recordId, reportUrl: record.reportUrl);
  }

  Future<void> uploadDiagnosticReport({
    required String petId,
    required String petName,
    required String title,
    required File file,
    String? description,
  }) async {
    _setLoading(true);
    try {
      final fileName = 'report_${DateTime.now().millisecondsSinceEpoch}.pdf';
      final storagePath = 'pets/$petId/reports/$fileName';
      final reportUrl = await _firebase.uploadFile(
        path: storagePath,
        file: file,
        contentType: 'application/pdf',
      );

      final record = ServiceRecordModel(
        recordId: 'rec_${_uuid.v4().substring(0, 6)}',
        petId: petId,
        petName: petName,
        serviceType: 'Diagnostic Report',
        providerId: _currentUser?.uid ?? 'user',
        providerName: _currentUser?.name ?? 'Owner',
        providerRole: 'Pet Owner',
        date: DateTime.now().toString().substring(0, 10),
        title: title,
        description: description ?? 'PDF Diagnostic Report uploaded by owner.',
        reportUrl: reportUrl,
        isSharedWithVets: true,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      );

      await addServiceRecord(record);
    } catch (e) {
      debugPrint('[AppStateRepository] uploadDiagnosticReport error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> toggleReportSharing(String recordId, bool isShared) async {
    final idx = _serviceRecords.indexWhere((r) => r.recordId == recordId);
    if (idx != -1) {
      _serviceRecords[idx] = ServiceRecordModel(
        recordId: _serviceRecords[idx].recordId,
        petId: _serviceRecords[idx].petId,
        petName: _serviceRecords[idx].petName,
        serviceType: _serviceRecords[idx].serviceType,
        providerId: _serviceRecords[idx].providerId,
        providerName: _serviceRecords[idx].providerName,
        providerRole: _serviceRecords[idx].providerRole,
        date: _serviceRecords[idx].date,
        title: _serviceRecords[idx].title,
        description: _serviceRecords[idx].description,
        diagnosis: _serviceRecords[idx].diagnosis,
        suggestion: _serviceRecords[idx].suggestion,
        reportUrl: _serviceRecords[idx].reportUrl,
        isSharedWithVets: isShared,
        timestamp: _serviceRecords[idx].timestamp,
      );
      notifyListeners();
      await _firebase.saveServiceRecord(_serviceRecords[idx]);
    }
  }

  void addToCart(ProductModel product) {
    final idx = _cartItems.indexWhere((item) => item.product.id == product.id);
    if (idx != -1)
      _cartItems[idx].quantity += 1;
    else
      _cartItems.add(CartItemModel(product: product, quantity: 1));
    notifyListeners();
  }

  void updateCartQuantity(String productId, int delta) {
    final idx = _cartItems.indexWhere((item) => item.product.id == productId);
    if (idx != -1) {
      _cartItems[idx].quantity += delta;
      if (_cartItems[idx].quantity <= 0) _cartItems.removeAt(idx);
      notifyListeners();
    }
  }

  void clearCart() {
    _cartItems.clear();
    notifyListeners();
  }

  Future<OrderModel> placeOrder({
    required String address,
    required String phone,
    required String paymentMethod,
    double? shippingCharges,
  }) async {
    final order = OrderModel(
      orderId: 'ORD-${_uuid.v4().substring(0, 5).toUpperCase()}',
      userId: _currentUser?.uid ?? 'guest',
      userName: _currentUser?.name ?? 'Guest',
      address: address,
      phone: phone,
      paymentMethod: paymentMethod,
      subtotal: cartSubtotal,
      shippingCharges: shippingCharges ?? cartShipping,
      discount: cartDiscount,
      couponCode: _appliedCoupon?.code,
      total: cartTotal,
      timestamp: DateTime.now().millisecondsSinceEpoch,
      status: OrderStatus.pending,
      items: List.from(_cartItems),
    );
    _orders.insert(0, order);
    _cartItems.clear();
    notifyListeners();
    await _firebase.placeOrder(order);
    return order;
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    final idx = _orders.indexWhere((o) => o.orderId == orderId);
    if (idx != -1) {
      _orders[idx] = _orders[idx].copyWith(status: newStatus);
      notifyListeners();
      await _firebase.updateOrderStatus(orderId, newStatus.displayName);
    }
  }

  Future<void> addProduct(ProductModel product) async {
    _products.insert(0, product);
    notifyListeners();
    await _firebase.saveProduct(product);
  }

  Future<void> updateProduct(ProductModel updatedProduct) async {
    final idx = _products.indexWhere((p) => p.id == updatedProduct.id);
    if (idx != -1) {
      _products[idx] = updatedProduct;
      notifyListeners();
      await _firebase.saveProduct(updatedProduct);
    }
  }

  Future<void> updateProductStock(String productId, int newStock) async {
    final idx = _products.indexWhere((p) => p.id == productId);
    if (idx != -1) {
      _products[idx] = _products[idx].copyWith(stockQuantity: newStock);
      notifyListeners();
      await _firebase.saveProduct(_products[idx]);
    }
  }

  Future<void> deleteProduct(String productId) async {
    _products.removeWhere((p) => p.id == productId);
    notifyListeners();
    await _firebase.deleteProduct(productId);
  }

  Future<void> addPost(FeedPostModel post) async {
    _posts.insert(0, post);
    notifyListeners();
    await _firebase.savePost(post);
  }

  Future<void> sharePost({
    required FeedPostModel originalPost,
    String caption = '',
  }) async {
    final newPost = FeedPostModel(
      postId: 'post_${_uuid.v4().substring(0, 8)}',
      userId: _currentUser?.uid ?? 'guest',
      userName: _currentUser?.name ?? 'User',
      userPhoto: _currentUser?.photoUrl,
      postType: originalPost.postType,
      content: caption.isNotEmpty ? caption : 'Shared a story',
      timestamp: DateTime.now().millisecondsSinceEpoch,
      sharedPostId: originalPost.postId,
      sharedPostAuthor: originalPost.userName,
      sharedPostContent: originalPost.content,
    );
    _posts.insert(0, newPost);
    originalPost.sharesCount += 1;
    notifyListeners();
    await _firebase.savePost(newPost);
    await _firebase.incrementPostShares(originalPost.postId);
  }

  Future<void> incrementPostShares(String postId) async {
    final idx = _posts.indexWhere((p) => p.postId == postId);
    if (idx != -1) {
      _posts[idx].sharesCount += 1;
      notifyListeners();
    }
    await _firebase.incrementPostShares(postId);
  }

  Future<void> togglePostLike(String postId) async {
    final post = _posts.firstWhere((p) => p.postId == postId);
    final userId = _currentUser?.uid ?? 'guest';
    final wasLiked = post.isLikedByUser(userId);
    post.toggleLike(userId);
    notifyListeners();
    await _firebase.togglePostLike(postId, userId, !wasLiked);
  }

  void listenToComments(String postId) {
    _firebase.streamComments(postId).listen((fetched) {
      _postComments[postId] = fetched;
      notifyListeners();
    });
  }

  List<CommentModel> getCommentsForPost(String postId) =>
      _postComments[postId] ?? [];

  Future<void> addComment(String postId, String text) async {
    final comment = CommentModel(
      commentId: 'cmt_${_uuid.v4().substring(0, 6)}',
      postId: postId,
      userId: _currentUser?.uid ?? 'guest',
      userName: _currentUser?.name ?? 'Lover',
      text: text,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    if (!_postComments.containsKey(postId)) _postComments[postId] = [];
    _postComments[postId]!.add(comment);
    final postIdx = _posts.indexWhere((p) => p.postId == postId);
    if (postIdx != -1) _posts[postIdx].commentsCount += 1;
    notifyListeners();
    await _firebase.addComment(postId, comment);
  }

  Future<void> toggleUserSuspension(String userId) async {
    final idx = _allUsers.indexWhere((u) => u.uid == userId);
    if (idx != -1) {
      final updated = _allUsers[idx].copyWith(
        isSuspended: !_allUsers[idx].isSuspended,
      );
      _allUsers[idx] = updated;
      notifyListeners();
      await _firebase.saveUserProfile(updated);
    }
  }

  Future<void> toggleUserVerification(String userId) async {
    final idx = _allUsers.indexWhere((u) => u.uid == userId);
    if (idx != -1) {
      final updated = _allUsers[idx].copyWith(
        isVerified: !_allUsers[idx].isVerified,
      );
      _allUsers[idx] = updated;
      notifyListeners();
      await _firebase.saveUserProfile(updated);
      try {
        await _firebase.toggleVetVerification(userId, updated.isVerified);
      } catch (_) {}
    }
  }

  Future<void> toggleVetVerification(String vetId) async {
    final idx = _vets.indexWhere((v) => v.id == vetId);
    if (idx != -1) {
      final newVerified = !_vets[idx].isVerified;
      _vets[idx] = _vets[idx].copyWith(isVerified: newVerified);
      notifyListeners();
      await _firebase.toggleVetVerification(vetId, newVerified);
    }
  }

  Future<void> updateUserRole(String userId, UserRole newRole) async {
    final idx = _allUsers.indexWhere((u) => u.uid == userId);
    if (idx != -1) {
      final updated = _allUsers[idx].copyWith(role: newRole);
      _allUsers[idx] = updated;
      notifyListeners();
      await _firebase.saveUserProfile(updated);
    }
  }

  Future<void> saveVetProfile(VetModel vet) async {
    final idx = _vets.indexWhere((v) => v.id == vet.id);
    if (idx != -1) {
      _vets[idx] = vet;
    } else {
      _vets.insert(0, vet);
    }
    notifyListeners();
    await _firebase.saveVet(vet);
    logAudit('Service Onboarded', 'Service ${vet.name} saved/updated');
  }

  Future<void> setSystemBanner(String? message) async {
    _systemBanner = message;
    notifyListeners();
    await _firebase.saveGlobalSetting('system_banner', message);
    logAudit(
      'System Banner',
      message != null && message.isNotEmpty
          ? 'Updated banner text'
          : 'Cleared banner',
    );
  }

  Future<void> setMaintenanceMode(bool enabled) async {
    _isMaintenanceMode = enabled;
    notifyListeners();
    await _firebase.saveGlobalSetting('maintenance_mode', enabled);
    logAudit('Maintenance Mode', enabled ? 'Enabled' : 'Disabled');
  }

  Future<void> setAiEnabled(bool enabled) async {
    _isAiEnabled = enabled;
    notifyListeners();
    await _firebase.saveGlobalSetting('ai_enabled', enabled);
    logAudit('AI Diagnostic Engine', enabled ? 'Enabled' : 'Disabled');
  }

  Future<void> setRegistrationAllowed(bool enabled) async {
    _isRegistrationAllowed = enabled;
    notifyListeners();
    await _firebase.saveGlobalSetting('registration_allowed', enabled);
    logAudit('User Registrations', enabled ? 'Allowed' : 'Locked');
  }

  Future<void> setBaseShippingFee(double fee) async {
    _baseShippingFee = fee;
    notifyListeners();
    await _firebase.saveGlobalSetting('base_shipping_fee', fee);
    logAudit('Base Shipping Fee', 'Updated to ৳${fee.toStringAsFixed(2)}');
  }

  Future<void> addCoupon(CouponModel coupon) async {
    await _firebase.saveCoupon(coupon);
  }

  Future<void> deleteCoupon(String code) async {
    await _firebase.deleteCoupon(code);
  }

  void clearAuditLogs() {
    _auditLogs.clear();
    notifyListeners();
  }

  void logAudit(String action, String details) {
    final timeStr = DateTime.now().toString().substring(11, 19);
    _auditLogs.insert(0, '[$timeStr] $action: $details');
    if (_auditLogs.length > 50) _auditLogs.removeLast();
  }

  void addNotification({
    required String title,
    required String message,
    required NotificationType type,
  }) async {
    final n = NotificationModel(
      id: _uuid.v4().substring(0, 8),
      title: title,
      message: message,
      type: type,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    _notifications.insert(0, n);
    notifyListeners();
    if (_currentUser != null)
      await _firebase.saveNotification(_currentUser!.uid, n);
  }

  Future<void> sendBroadcastNotification({
    required String title,
    required String message,
    required String targetGroup,
  }) async {
    List<UserModel> targets = [];
    if (targetGroup == 'Everyone in App')
      targets = await _firebase.fetchUsers();
    else {
      String role = targetGroup == 'All Pet Owners'
          ? 'Pet Owner'
          : targetGroup == 'All Veterinarians'
          ? 'Veterinarian'
          : 'Pet Shop';
      targets = await _firebase.fetchUsersByRole(role);
    }
    for (final u in targets) {
      final n = NotificationModel(
        id: _uuid.v4().substring(0, 8),
        title: title,
        message: message,
        type: NotificationType.system,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      );
      await _firebase.saveNotification(u.uid, n);
    }
    try {
      await FirebaseFunctions.instance.httpsCallable('send_broadcast').call({
        'title': title,
        'message': message,
        'targetGroup': targetGroup,
      });
    } catch (_) {}
  }

  void markNotificationAsRead(String id) async {
    final idx = _notifications.indexWhere((n) => n.id == id);
    if (idx != -1) {
      _notifications[idx].isRead = true;
      notifyListeners();
    }
    if (_currentUser != null)
      await _firebase.markNotificationAsRead(_currentUser!.uid, id);
  }

  void markAllNotificationsAsRead() async {
    for (var n in _notifications) n.isRead = true;
    notifyListeners();
    if (_currentUser != null) {
      for (var n in _notifications)
        await _firebase.markNotificationAsRead(_currentUser!.uid, n.id);
    }
  }

  void removeNotification(String id) async {
    _notifications.removeWhere((n) => n.id == id);
    notifyListeners();
    if (_currentUser != null)
      await _firebase.removeNotification(_currentUser!.uid, id);
  }

  void clearNotifications() async {
    _notifications.clear();
    notifyListeners();
    if (_currentUser != null)
      await _firebase.clearAllNotifications(_currentUser!.uid);
  }

  Future<void> updateVetAggregate(
    String vetId,
    double rating,
    int count,
  ) async {
    final idx = _vets.indexWhere((v) => v.id == vetId);
    if (idx != -1) {
      _vets[idx] = _vets[idx].copyWith(rating: rating, reviewsCount: count);
      notifyListeners();
      await _firebase.saveVet(_vets[idx]);
    }
  }

  Future<void> updateVetPrice(String vetId, String newPrice) async {
    final idx = _vets.indexWhere((v) => v.id == vetId);
    if (idx != -1) {
      _vets[idx] = _vets[idx].copyWith(price: newPrice);
      notifyListeners();
      await _firebase.saveVet(_vets[idx]);
    }
  }

  Future<void> toggleFavoriteVet(String vetId) async {
    if (_currentUser == null) return;
    final currentFavorites = List<String>.from(_currentUser!.favoriteVetIds);
    if (currentFavorites.contains(vetId))
      currentFavorites.remove(vetId);
    else
      currentFavorites.add(vetId);
    _currentUser = _currentUser!.copyWith(favoriteVetIds: currentFavorites);
    notifyListeners();
    await _firebase.saveUserProfile(_currentUser!);
  }

  Future<void> loadReviews(String targetId) async {
    final fetched = await _firebase.fetchReviews(targetId);
    _reviews
      ..clear()
      ..addAll(fetched);
    notifyListeners();
  }

  Future<void> addReview({
    required String targetId,
    required double rating,
    required String comment,
  }) async {
    if (_currentUser == null) return;
    final review = ReviewModel(
      id: _uuid.v4().substring(0, 8),
      targetId: targetId,
      reviewerId: _currentUser!.uid,
      reviewerName: _currentUser!.name,
      reviewerPhoto: _currentUser!.photoUrl,
      rating: rating,
      comment: comment,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    _reviews.insert(0, review);
    notifyListeners();
    await _firebase.saveReview(review);
  }

  Future<List<String>> runAiNutritionSchedule({
    required String petName,
    required String breed,
    required String age,
    required String weight,
  }) async {
    try {
      final result = await _callAiProxy('nutrition_schedule', {
        'petName': petName,
        'breed': breed,
        'age': age,
        'weight': weight,
      });
      return List<String>.from(result['schedule']);
    } catch (_) {
      return ['08:00', '13:00', '19:00'];
    }
  }

  Future<Map<String, dynamic>> runAiNutritionRecommendation({
    required String petName,
    required String breed,
    required String age,
    required String weight,
    String? currentDiet,
  }) async {
    try {
      final result = await _callAiProxy('nutrition_recommendation', {
        'petName': petName,
        'breed': breed,
        'age': age,
        'weight': weight,
        'currentDiet': currentDiet,
      });
      return Map<String, dynamic>.from(result['recommendation']);
    } catch (_) {
      return {'calories': 'N/A', 'nutrients': [], 'recommendations': []};
    }
  }

  Future<void> updatePetNutrition({
    required String petId,
    String? currentFoodName,
    String? foodType,
    List<String>? feedingTimes,
    String? hungerStatus,
    String? lastFedTime,
    int? calorieGoal,
  }) async {
    final idx = _pets.indexWhere((p) => p.petID == petId);
    if (idx != -1) {
      _pets[idx] = _pets[idx].copyWith(
        currentFoodName: currentFoodName,
        foodType: foodType,
        feedingTimes: feedingTimes,
        hungerStatus: hungerStatus,
        lastFedTime: lastFedTime,
        dailyCalorieGoal: calorieGoal,
      );
      notifyListeners();
      await _firebase.savePet(_pets[idx]);
      await _schedulePetReminders(_pets[idx]);
    }
  }

  Future<String?> identifyBreed({
    required String? imagePath,
    File? imageFile,
  }) async {
    try {
      String base64Image;
      if (imageFile != null)
        base64Image = base64.encode(await imageFile.readAsBytes());
      else if (imagePath != null && !imagePath.startsWith('http'))
        base64Image = base64.encode(await File(imagePath).readAsBytes());
      else
        return null;
      final result = await _callAiProxy('breed_finder', {'image': base64Image});
      return result['breed'].toString();
    } catch (_) {
      return null;
    }
  }

  Future<bool> redeemReferralCode(String code) async {
    if (_currentUser == null) return false;
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty || _currentUser!.referralCode?.toUpperCase() == trimmed)
      return false;
    if (_currentUser!.referredBy != null &&
        _currentUser!.referredBy!.isNotEmpty)
      return false;
    _setLoading(true);
    try {
      final res = await _firebase.applyReferralCode(
        userUid: _currentUser!.uid,
        code: trimmed,
      );
      if (res.success) {
        _currentUser = _currentUser!.copyWith(referredBy: trimmed);
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateProfile({
    required String name,
    String? phone,
    String? photoUrl,
    String? address,
    double? latitude,
    double? longitude,
    String? bio,
    String? specialization,
    String? clinicName,
    int? yearsExperience,
    bool? isVerified,
  }) async {
    if (_currentUser == null) return;
    _currentUser = _currentUser!.copyWith(
      name: name,
      phone: phone,
      photoUrl: photoUrl,
      address: address,
      latitude: latitude,
      longitude: longitude,
      bio: bio,
      specialization: specialization,
      clinicName: clinicName,
      yearsExperience: yearsExperience,
      isVerified: isVerified,
    );
    notifyListeners();
    await _firebase.saveUserProfile(_currentUser!);
  }

  DateTime _parseScheduledTime(DateTime baseDate, String timeStr) {
    try {
      final parts = timeStr.replaceAll(RegExp(r'[^0-9:]'), '').split(':');
      int h = int.parse(parts[0]);
      int m = parts.length > 1 ? int.parse(parts[1]) : 0;
      if (timeStr.toLowerCase().contains('pm') && h < 12)
        h += 12;
      else if (timeStr.toLowerCase().contains('am') && h == 12)
        h = 0;
      return DateTime(baseDate.year, baseDate.month, baseDate.day, h, m);
    } catch (_) {
      return baseDate;
    }
  }
}
