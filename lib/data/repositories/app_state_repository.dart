import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
import '../services/firebase_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/native_bridge_service.dart';
import '../../main.dart';
import '../../presentation/common_widgets/premium_toast.dart';
import '../../presentation/common_widgets/premium_notification.dart';

class AppStateRepository extends ChangeNotifier {
  static final AppStateRepository _instance = AppStateRepository._internal();
  factory AppStateRepository() => _instance;

  final _uuid = const Uuid();
  final _firebase = FirebaseService();

  // Theme Mode State & Persistence
  ThemeMode _themeMode = ThemeMode.system;
  ThemeMode get themeMode => _themeMode;
  static const String _themeModeKey = 'app_theme_mode';

  // Current User Session
  UserModel? _currentUser;
  UserModel? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  // Initialization flag
  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;

  // Loading state
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  String? _syncError;
  String? get syncError => _syncError;

  // Data Collections (local reactive cache)
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

  // Getters
  List<PetModel> get pets => List.unmodifiable(_pets);
  
  List<EventModel> get events {
    final all = List<EventModel>.from(_events);
    
    // Generate birthday events dynamically ONLY for Pet Owners (never on clinical provider portals)
    if (_currentUser?.role == UserRole.petOwner) {
      for (final pet in _pets) {
        if (pet.dob.isNotEmpty) {
          try {
            final dob = DateTime.parse(pet.dob);
            final now = DateTime.now();
            final today = DateTime(now.year, now.month, now.day);
            
            // Generate birthday for the current year only to avoid duplicate clutter in lists
            final bday = DateTime(now.year, dob.month, dob.day);
            all.add(EventModel(
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
            ));
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
  List<VetModel> get vets => List.unmodifiable(_vets);
  List<ServiceRecordModel> get serviceRecords => List.unmodifiable(_serviceRecords);
  List<FeedPostModel> get posts => List.unmodifiable(_posts);
  List<String> get auditLogs => List.unmodifiable(_auditLogs);
  List<String> get systemBroadcasts => List.unmodifiable(_systemBroadcasts);
  List<UserModel> get allUsers => List.unmodifiable(_allUsers);
  List<NotificationModel> get notifications => List.unmodifiable(_notifications);
  List<ReviewModel> get reviews => List.unmodifiable(_reviews);
  int get unreadNotificationCount => _notifications.where((n) => !n.isRead).length;

  double get cartSubtotal => _cartItems.fold(0.0, (sum, item) => sum + item.totalPrice);
  double get cartShipping => _cartItems.isEmpty ? 0.0 : 5.0;
  double get cartTotal => cartSubtotal + cartShipping;
  int get cartCount => _cartItems.fold(0, (sum, item) => sum + item.quantity);

  AppStateRepository._internal() {
    _loadSavedThemeMode();
    // Attempt to restore session on initialization
    _restoreExistingSession();
    _setupNotificationListener();
  }

  Future<void> _loadSavedThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_themeModeKey);
      if (saved == 'light') {
        _themeMode = ThemeMode.light;
      } else if (saved == 'dark') {
        _themeMode = ThemeMode.dark;
      } else {
        _themeMode = ThemeMode.system;
      }
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
      final modeStr = mode == ThemeMode.light
          ? 'light'
          : mode == ThemeMode.dark
              ? 'dark'
              : 'system';
      await prefs.setString(_themeModeKey, modeStr);
    } catch (e) {
      debugPrint('[AppStateRepository] Error saving theme mode: $e');
    }
  }

  Future<void> toggleThemeMode(BuildContext context) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final nextMode = isDark ? ThemeMode.light : ThemeMode.dark;
    await setThemeMode(nextMode);
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
          await syncFromFirebase(_currentUser!);
          debugPrint('[AppStateRepository] Session restored for: ${_currentUser!.name}');
        }
      } catch (e) {
        debugPrint('[AppStateRepository] Session restoration failed: $e');
      }
    }
    _isInitialized = true;
    notifyListeners();
  }

  void showToast(String message, {ToastType type = ToastType.success, BuildContext? context}) {
    final effectiveContext = context ?? TailWaggingApp.navigatorKey.currentContext;
    if (effectiveContext != null) {
      PremiumToast.show(effectiveContext, message, type: type);
    }
  }

  // ─── FIREBASE SYNC ENTRY POINT ────────────────────────────────────────────
  /// Called after login to fetch and stream all user data from Cloud Firestore.
  Future<void> syncFromFirebase(UserModel user) async {
    // Aggressively load from local cache first to make the app feel instant
    _setLoading(false); // Don't block UI if cache exists
    debugPrint('[AppStateRepository] High-Speed Sync for UID: ${user.uid}');
    try {
      // 1. Refresh FCM Token and update profile (Async background)
      NotificationService().getToken().then((fcmToken) {
        if (fcmToken != null) {
          final updatedUser = UserModel(
            uid: user.uid,
            name: user.name,
            email: user.email,
            photoUrl: user.photoUrl,
            phone: user.phone,
            address: user.address,
            role: user.role,
            isVerified: user.isVerified,
            favoriteVetIds: user.favoriteVetIds,
            points: user.points,
            referralCode: user.referralCode,
            fcmToken: fcmToken,
            latitude: user.latitude,
            longitude: user.longitude,
          );
          _firebase.saveUserProfile(updatedUser);
          _currentUser = updatedUser;
        }
      });

      _currentUser = user;

      // Concurrent Data Loading (Parallel processing for speed)
      Future.wait([
        _loadProducts(),
        _loadCommunityPosts(),
      ]);
      
      _listenToVets();

      // Role-specific data - Use Streams for real-time sync
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
          _listenToPets(''); // Real-time patient directory sync from all clinic records
          _listenToEventsForProvider(user.uid); 
          _listenToServiceRecords(''); 
          _listenToAllOrders(); 
          break;
        case UserRole.petShop:
          _listenToAllOrders();
          break;
        case UserRole.admin:
          _listenToPets(''); 
          _listenToEvents('');
          _listenToServiceRecords('');
          _listenToAllOrders();
          loadAllUsers(); // No await needed for background load
          break;
      }

      // Stream notifications for the current user
      _listenToNotifications(user.uid);

      logAudit('Firebase Sync', 'Data loaded for ${user.name} (${user.role.displayName})');
    } catch (e) {
      debugPrint('[AppStateRepository] syncFromFirebase error: $e');
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  // ─── DATA LOADERS & STREAMERS ─────────────────────────────────────────────

  void _listenToPets(String ownerUID) {
    _firebase.streamPets(ownerUID).listen((fetched) {
      _pets
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToPets error: $e'));
  }

  void _listenToVets() {
    _firebase.streamVets().listen((fetched) {
      _vets
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToVets error: $e'));
  }

  void _listenToEvents(String userId) {
    _firebase.streamEvents(userId).listen((fetched) {
      _events
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToEvents error: $e'));
  }

  void _listenToEventsForProvider(String providerId) {
    _firebase.streamEventsForProvider(providerId).listen((fetched) {
      _events
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToEventsForProvider error: $e'));
  }

  void _listenToServiceRecords(String petId) {
    _firebase.streamServiceRecords(petId).listen((fetched) {
      _serviceRecords
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToServiceRecords error: $e'));
  }

  void _listenToAllOrders() {
    _firebase.streamAllOrders().listen((fetched) {
      _orders
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToAllOrders error: $e'));
  }

  void _listenToUserOrders(String userId) {
    _firebase.streamUserOrders(userId).listen((fetched) {
      _orders
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToUserOrders error: $e'));
  }

  void _listenToNotifications(String userId) {
    _firebase.streamNotifications(userId).listen((fetched) {
      _notifications
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToNotifications error: $e'));
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
    try {
      _firebase.streamPosts().listen((fetchedPosts) {
        _posts
          ..clear()
          ..addAll(fetchedPosts);
        notifyListeners();
      });
    } catch (e) {
      debugPrint('[AppStateRepository] _loadCommunityPosts error: $e');
    }
  }

  // ─── AUTH ────────────────────────────────────────────────────────────────

  Future<void> loginAs({
    required String email,
    required String name,
    required UserRole role,
  }) async {
    _setLoading(true);
    try {
      // Sign into Firebase Auth
      await _firebase.signInAnonymouslyIfNeeded();
      final firebaseUID = _firebase.currentFirebaseUser?.uid ?? 'usr_${_uuid.v4().substring(0, 8)}';

      // Auto-escalate email to admin role
      UserRole effectiveRole = role;
      if (email.toLowerCase() == 'admin@mail.com') effectiveRole = UserRole.admin;

      // Check if user already exists in Firestore to keep their role
      final existingProfile = await _firebase.fetchUserProfile(firebaseUID);
      
      _currentUser = UserModel(
        uid: firebaseUID,
        name: existingProfile?.name ?? name,
        email: email,
        role: existingProfile?.role ?? effectiveRole,
        photoUrl: existingProfile?.photoUrl,
        phone: existingProfile?.phone,
        isVerified: existingProfile?.isVerified ?? (effectiveRole == UserRole.veterinarian),
      );

      // Sync data from Firestore based on the user's role
      await syncFromFirebase(_currentUser!);
      logAudit('User Login', 'User $name logged in as ${_currentUser!.role.displayName}');
    } catch (e) {
      _syncError = 'Login error: $e';
      debugPrint('[AppStateRepository] loginAs error: $e');
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
      final firebaseUID = userCredential.user!.uid;

      // Fetch profile from Firestore to get the role
      final profile = await _firebase.fetchUserProfile(firebaseUID);
      
      if (profile == null) {
        throw 'User profile not found. Please register first.';
      }

      _currentUser = profile;

      // Sync data from Firestore based on the user's role
      await syncFromFirebase(_currentUser!);
      logAudit('User Login', 'User ${_currentUser!.name} logged in via Email');
    } catch (e) {
      _syncError = 'Login error: ${e.toString()}';
      debugPrint('[AppStateRepository] signInWithEmail error: $e');
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
        
        // Check if profile exists
        var profile = await _firebase.fetchUserProfile(fUser.uid);
        
        if (profile == null) {
          // New Google User - create profile with default role (usually petOwner)
          final myReferralCode = UserModel.generateReferralCode(fUser.uid);
          profile = UserModel(
            uid: fUser.uid,
            name: fUser.displayName ?? 'Google User',
            email: fUser.email ?? '',
            photoUrl: fUser.photoURL,
            role: defaultRole ?? UserRole.petOwner,
            isVerified: false,
            points: 15,
            referralCode: myReferralCode,
          );
          await _firebase.saveUserProfile(profile);
        } else if (profile.referralCode == null || profile.referralCode!.isEmpty) {
          // Backfill referral code if missing
          final myReferralCode = UserModel.generateReferralCode(fUser.uid);
          profile = profile.copyWith(
            referralCode: myReferralCode,
            points: profile.points <= 0 ? 15 : profile.points,
          );
          await _firebase.saveUserProfile(profile);
        }

        _currentUser = profile;
        await syncFromFirebase(_currentUser!);
        logAudit('Google Login', 'User ${_currentUser!.name} logged in via Google');
      }
    } catch (e) {
      _syncError = 'Google Login error: $e';
      debugPrint('[AppStateRepository] loginWithGoogle error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> sendPasswordResetEmail(String email) async {
    try {
      await _firebase.sendPasswordResetEmail(email);
    } catch (e) {
      debugPrint('[AppStateRepository] sendPasswordResetEmail error: $e');
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
      final myReferralCode = UserModel.generateReferralCode(firebaseUID);

      _currentUser = UserModel(
        uid: firebaseUID,
        name: name,
        email: email,
        role: role,
        phone: phone,
        isVerified: role == UserRole.veterinarian,
        points: 15,
        referralCode: myReferralCode,
      );

      // Save to Firestore and sync
      await syncFromFirebase(_currentUser!);

      // Process referral code if provided
      if (referralCode != null && referralCode.trim().isNotEmpty) {
        await _firebase.applyReferralCode(
          userUid: firebaseUID,
          code: referralCode.trim().toUpperCase(),
        );
      }

      // If they are a service provider, also add them to the public directory
      if (role == UserRole.veterinarian || role == UserRole.grooming || role == UserRole.boarding) {
        final vetEntry = VetModel(
          id: firebaseUID,
          name: name,
          qualification: role == UserRole.veterinarian ? 'Verified Veterinarian' : 'Pet Care Professional',
          tag: role.displayName,
          phone: phone ?? '',
          isVerified: role == UserRole.veterinarian, // Admin manually verifies usually, but we set true for demo
        );
        await _firebase.saveVet(vetEntry);
      }

      logAudit('User Signup', 'User $name registered as ${role.displayName}');
    } catch (e) {
      _syncError = 'Signup error: ${e.toString()}';
      debugPrint('[AppStateRepository] signUp error: $e');
      rethrow;
    } finally {
      _setLoading(false);
    }
  }

  /// Redeem / apply a friend's referral code to award them 5 points.
  Future<bool> redeemReferralCode(String code) async {
    if (_currentUser == null) return false;
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty) {
      showToast('Please enter a valid referral code', type: ToastType.warning);
      return false;
    }
    if (_currentUser!.referralCode?.toUpperCase() == trimmed) {
      showToast('You cannot use your own referral code', type: ToastType.warning);
      return false;
    }
    if (_currentUser!.referredBy != null && _currentUser!.referredBy!.isNotEmpty) {
      showToast('You have already redeemed a referral code', type: ToastType.info);
      return false;
    }

    _setLoading(true);
    try {
      final res = await _firebase.applyReferralCode(
        userUid: _currentUser!.uid,
        code: trimmed,
      );
      if (res.success) {
        _currentUser = _currentUser!.copyWith(referredBy: trimmed);
        notifyListeners();
        showToast('🎉 Referral code applied! +5 points awarded to your friend.', type: ToastType.success);
        return true;
      } else {
        showToast(res.errorMessage ?? 'Invalid referral code', type: ToastType.error);
        return false;
      }
    } catch (e) {
      showToast('Failed to apply referral code: $e', type: ToastType.error);
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    if (_currentUser != null) {
      logAudit('User Logout', 'User ${_currentUser!.name} logged out');
    }
    await _firebase.signOut();
    _currentUser = null;
    _pets.clear();
    _events.clear();
    _orders.clear();
    _serviceRecords.clear();
    _posts.clear();
    _postComments.clear();
    _cartItems.clear();
    _syncError = null;
    notifyListeners();
  }

  Future<void> deleteAccount() async {
    if (_currentUser == null) return;
    
    final uid = _currentUser!.uid;
    logAudit('Account Deletion', 'User $uid requested permanent deletion');
    
    // 1. Purge Firestore user data
    await _firebase.deleteUserData(uid);
    
    // 2. Delete Authentication Account
    await _firebase.deleteAccount();
    
    // 3. Cleanup local state
    _currentUser = null;
    _pets.clear();
    _events.clear();
    _orders.clear();
    _serviceRecords.clear();
    _posts.clear();
    _postComments.clear();
    _cartItems.clear();
    _syncError = null;

    notifyListeners();
  }

  // ─── PET OPERATIONS & MULTI-CATEGORY NOTIFICATIONS ────────────────────────

  Future<void> _schedulePetReminders(PetModel pet) async {
    // 1. Schedule Feeding Reminders
    if (pet.feedingTimes.isNotEmpty) {
      final now = DateTime.now();
      for (int i = 0; i < pet.feedingTimes.length; i++) {
        final timeStr = pet.feedingTimes[i];
        final alarmId = 'feed_${pet.petID}_$i';
        
        DateTime scheduledDate = _parseScheduledTime(now, timeStr);
        if (scheduledDate.isBefore(now)) {
          scheduledDate = scheduledDate.add(const Duration(days: 1));
        }

        final foodDesc = (pet.currentFoodName != null && pet.currentFoodName!.isNotEmpty)
            ? pet.currentFoodName!
            : 'healthy meal';

        await NativeBridgeService.scheduleAlarm(
          id: alarmId,
          title: 'Meal Time for ${pet.name}! 🍲',
          body: 'Time for ${pet.name}\'s scheduled meal ($foodDesc).',
          category: 'feeding',
          timestamp: scheduledDate.millisecondsSinceEpoch,
          isFeeding: true,
        );
      }
    }

    // 2. Schedule Health & Medication Reminders
    if (pet.medicationTime != null && pet.medicationTime!.trim().isNotEmpty) {
      final now = DateTime.now();
      DateTime scheduledMedDate = _parseScheduledTime(now, pet.medicationTime!);
      if (scheduledMedDate.isBefore(now)) {
        scheduledMedDate = scheduledMedDate.add(const Duration(days: 1));
      }

      await NativeBridgeService.scheduleAlarm(
        id: 'med_${pet.petID}',
        title: 'Medication Alert: ${pet.name} 💊',
        body: 'Time to administer scheduled medication for ${pet.name}.',
        category: 'health',
        timestamp: scheduledMedDate.millisecondsSinceEpoch,
        isFeeding: false,
      );
    }
  }

  Future<void> addPet(PetModel pet) async {
    _pets.add(pet);
    notifyListeners();
    await _firebase.savePet(pet);
    await _schedulePetReminders(pet);
    logAudit('Pet Added', 'Added pet: ${pet.name} (${pet.breed})');
    addNotification(
      title: 'New Pet Added! 🐾',
      message: '${pet.name} has been added to your profile.',
      type: NotificationType.health,
    );
  }

  Future<void> updatePet(PetModel updatedPet) async {
    final idx = _pets.indexWhere((p) => p.petID == updatedPet.petID);
    if (idx != -1) {
      _pets[idx] = updatedPet;
      notifyListeners();
      await _firebase.savePet(updatedPet);
      await _schedulePetReminders(updatedPet);
      logAudit('Pet Updated', 'Updated details for ${updatedPet.name}');
    }
  }

  Future<void> deletePet(String petId) async {
    final pet = _pets.firstWhere((p) => p.petID == petId, orElse: () => _pets.first);
    _pets.removeWhere((p) => p.petID == petId);
    notifyListeners();
    await _firebase.deletePet(petId);

    // Cancel related alarms
    for (int i = 0; i < 10; i++) {
      await NativeBridgeService.cancelAlarm('feed_${petId}_$i');
    }
    await NativeBridgeService.cancelAlarm('med_$petId');

    logAudit('Pet Deleted', 'Removed pet: ${pet.name}');
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
      final old = _pets[idx];
      final updated = PetModel(
        petID: old.petID,
        ownerID: old.ownerID,
        name: old.name,
        breed: old.breed,
        gender: old.gender,
        age: old.age,
        dob: old.dob,
        color: old.color,
        sound: old.sound,
        height: old.height,
        weight: old.weight,
        photoUrl: old.photoUrl,
        vaccinationDetails: old.vaccinationDetails,
        medicationTime: old.medicationTime,
        description: old.description,
        feedingTimes: feedingTimes ?? old.feedingTimes,
        currentFoodName: currentFoodName ?? old.currentFoodName,
        foodType: foodType ?? old.foodType,
        allergies: old.allergies,
        mood: old.mood,
        hungerStatus: hungerStatus ?? old.hungerStatus,
        healthIndex: old.healthIndex,
        dailyCalorieGoal: calorieGoal ?? old.dailyCalorieGoal,
        lastFedTime: lastFedTime ?? old.lastFedTime,
      );
      _pets[idx] = updated;
      notifyListeners();
      await _firebase.savePet(updated);
      await _schedulePetReminders(updated);
    }
  }

  DateTime _parseScheduledTime(DateTime baseDate, String timeStr) {
    int hour = 9;
    int minute = 0;
    try {
      final cleanStr = timeStr.trim();
      final isPM = cleanStr.toLowerCase().contains('pm');
      final isAM = cleanStr.toLowerCase().contains('am');
      
      final digitsAndColons = cleanStr.replaceAll(RegExp(r'[^0-9:]'), '');
      final parts = digitsAndColons.split(':');
      
      if (parts.isNotEmpty) {
        hour = int.tryParse(parts[0]) ?? 9;
      }
      if (parts.length > 1) {
        minute = int.tryParse(parts[1]) ?? 0;
      }

      if (isPM && hour < 12) {
        hour += 12;
      } else if (isAM && hour == 12) {
        hour = 0;
      }
    } catch (e) {
      debugPrint('[AppStateRepository] _parseScheduledTime notice: $e');
    }

    return DateTime(baseDate.year, baseDate.month, baseDate.day, hour, minute);
  }

  // ─── CALENDAR & REMINDERS ────────────────────────────────────────────────

  Future<void> addEvent(EventModel event) async {
    _events.add(event);
    notifyListeners();
    await _firebase.saveEvent(event);
    
    // Multi-Category Local Reminder Engine (AlarmManager)
    if (event.isReminderEnabled) {
      final scheduledTime = _parseScheduledTime(event.date, event.fromTime);
      final cat = event.category.toLowerCase();
      String alarmCategory = 'event';
      if (cat == 'food' || cat == 'feeding') {
        alarmCategory = 'feeding';
      } else if (cat.contains('med') || cat.contains('vaccin') || cat.contains('vet') || cat.contains('health')) {
        alarmCategory = 'health';
      }

      await NativeBridgeService.scheduleAlarm(
        id: event.id,
        title: event.title,
        body: '${event.category} reminder for ${event.petName} (${event.fromTime})',
        category: alarmCategory,
        timestamp: scheduledTime.millisecondsSinceEpoch,
        isFeeding: alarmCategory == 'feeding',
      );
    }

    logAudit('Event Scheduled', 'Scheduled ${event.title} for ${event.petName}');
  }

  Future<void> deleteEvent(String eventId) async {
    final idx = _events.indexWhere((e) => e.id == eventId);
    if (idx != -1) {
      final old = _events[idx];
      _events.removeAt(idx);
      notifyListeners();
      await _firebase.deleteEvent(old.userId, old.date, eventId);
      
      // Cancel Local Alarm
      await NativeBridgeService.cancelAlarm(eventId);
      
      logAudit('Event Removed', 'Event ID $eventId removed from schedule');
    }
  }

  Future<void> toggleEventCompletion(String eventId) async {
    final idx = _events.indexWhere((e) => e.id == eventId);
    if (idx != -1) {
      final old = _events[idx];
      final updated = EventModel(
        id: old.id,
        userId: old.userId,
        title: old.title,
        category: old.category,
        note: old.note,
        petName: old.petName,
        petId: old.petId,
        date: old.date,
        fromTime: old.fromTime,
        toTime: old.toTime,
        isReminderEnabled: old.isReminderEnabled,
        isCompleted: !old.isCompleted,
      );
      _events[idx] = updated;
      notifyListeners();
      await _firebase.saveEvent(updated);
    }
  }

  // ─── AI HEALTH DIAGNOSTIC ────────────────────────────────────────────────

  Future<String> runAiHealthDiagnosis({
    required String petName,
    required String prompt,
    File? imageFile,
  }) async {
    final openAiApiKey = dotenv.env['OPENAI_API_KEY'];
    if (openAiApiKey != null && openAiApiKey.isNotEmpty) {
      try {
        List<Map<String, dynamic>> content = [
          {
            'type': 'text',
            'text': 'Pet Name: $petName. Issue description: $prompt'
          }
        ];

        if (imageFile != null) {
          final bytes = await imageFile.readAsBytes();
          final base64Image = base64Encode(bytes);
          content.add({
            'type': 'image_url',
            'image_url': {'url': 'data:image/jpeg;base64,$base64Image'}
          });
        }

        final response = await http.post(
          Uri.parse('https://api.openai.com/v1/chat/completions'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $openAiApiKey',
          },
          body: jsonEncode({
            'model': 'gpt-4o', // Use full gpt-4o for vision capabilities
            'messages': [
              {
                'role': 'system',
                'content': '''You are a highly experienced, compassionate Senior Veterinarian. 
                
                IMPORTANT RULES:
                1. HIGHLIGHT KEY TERMS: Use double asterisks ** around any suspected diseases, medical conditions, symptoms, or specific body parts mentioned (e.g., **ringworm**, **lesion**, **eye area**).
                2. Use clear, plain text with natural spacing for the rest of the content.
                3. VISUAL EVIDENCE: Describe exactly what you see in the specific photo provided. Be precise about location and appearance.
                4. DIAGNOSTIC REASONING: Provide a specific assessment. Do not give the same general advice for every pet.
                5. TONE: Empathetic and reassuring.
                6. VET URGENCY: Clearly state if this is an Emergency, Non-Urgent, or Routine concern.
                7. NO SYMBOLS: Aside from the ** markers for highlighting, do not use hashtags (#) or other markdown symbols.'''
              },
              {'role': 'user', 'content': content}
            ],
            'temperature': 0.5, // Lower temperature for more consistent, clinical accuracy
            'max_tokens': 1000,
          }),
        );
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final aiResponse = data['choices'][0]['message']['content'].toString();
          // DO NOT strip asterisks anymore as they are used for highlighting
          return aiResponse.replaceAll('#', '').trim();
        } else {
          final errorData = jsonDecode(response.body);
          final errorMsg = errorData['error']?['message'] ?? 'Unknown Error';
          debugPrint('[AI Scanner] API Error (${response.statusCode}): $errorMsg');
          
          if (response.statusCode == 401) {
            return "Authentication Error: Please check the API key configuration. Details: $errorMsg";
          } else if (response.statusCode == 429) {
            return "The AI is currently busy (Rate Limit). Please wait a moment and try again. Details: $errorMsg";
          } else if (response.statusCode == 400) {
            return "The request was not understood by the AI. This usually happens with very large images. Details: $errorMsg";
          }
          
          return "I'm having trouble connecting to my medical database (Error $errorMsg). Please ensure your internet is stable and try again.";
        }
      } catch (e) {
        debugPrint('[AI Scanner] Exception: $e');
        return "I encountered a system error ($e) while analyzing the image. Please try again later.";
      }
    }

    // Fallback if no API key is found
    return "AI Diagnostic capability is currently unavailable. Please contact support or check your network settings.";
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
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    _serviceRecords.insert(0, record);
    notifyListeners();
    await _firebase.saveServiceRecord(record);
    logAudit('Medical Record Saved', 'Saved AI diagnosis to $petName record');

    // Trigger Push / Health Notification
    await NotificationService().showHealthAlert(
      title: 'Health Vault: $petName 🩺',
      body: 'New medical record saved: $title',
    );
    addNotification(
      title: 'New Health Record: $petName 🩺',
      message: '$title has been archived in the Health Vault.',
      type: NotificationType.health,
    );
  }

  Future<void> addServiceRecord(ServiceRecordModel record) async {
    _serviceRecords.removeWhere((r) => r.recordId == record.recordId);
    _serviceRecords.insert(0, record);
    notifyListeners();
    await _firebase.saveServiceRecord(record);
    logAudit('Clinical Record Added', '${record.providerName} logged consultation for ${record.petName}');
    
    // Trigger notification
    await NotificationService().showHealthAlert(
      title: 'Clinical Consultation Logged 🩺',
      body: '${record.title} for ${record.petName} by ${record.providerName}',
    );
    addNotification(
      title: 'Clinical Consultation 🩺',
      message: 'Consultation record for ${record.petName} has been saved.',
      type: NotificationType.health,
    );
  }

  // ─── SHOPPING CART & ORDERS ──────────────────────────────────────────────

  void addToCart(ProductModel product) {
    final idx = _cartItems.indexWhere((item) => item.product.id == product.id);
    if (idx != -1) {
      _cartItems[idx].quantity += 1;
    } else {
      _cartItems.add(CartItemModel(product: product, quantity: 1));
    }
    notifyListeners();
  }

  void updateCartQuantity(String productId, int delta) {
    final idx = _cartItems.indexWhere((item) => item.product.id == productId);
    if (idx != -1) {
      _cartItems[idx].quantity += delta;
      if (_cartItems[idx].quantity <= 0) {
        _cartItems.removeAt(idx);
      }
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
  }) async {
    final order = OrderModel(
      orderId: 'ORD-${_uuid.v4().substring(0, 5).toUpperCase()}',
      userId: _currentUser?.uid ?? 'guest',
      userName: _currentUser?.name ?? 'Guest User',
      address: address,
      phone: phone,
      paymentMethod: paymentMethod,
      subtotal: cartSubtotal,
      shippingCharges: cartShipping,
      total: cartTotal,
      timestamp: DateTime.now().millisecondsSinceEpoch,
      status: OrderStatus.pending,
      items: List.from(_cartItems),
    );
    _orders.insert(0, order);
    _cartItems.clear();
    notifyListeners();
    // Persist to Firestore
    await _firebase.placeOrder(order);
    logAudit('Order Placed', 'Order ${order.orderId} created for ৳${order.total.toStringAsFixed(2)}');
    addNotification(
      title: 'Order Confirmed! 🛍️',
      message: 'Your order #${order.orderId} for ৳${order.total.toStringAsFixed(2)} has been placed successfully.',
      type: NotificationType.order,
    );
    return order;
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    final idx = _orders.indexWhere((o) => o.orderId == orderId);
    if (idx != -1) {
      final old = _orders[idx];
      final updated = OrderModel(
        orderId: old.orderId,
        userId: old.userId,
        userName: old.userName,
        address: old.address,
        phone: old.phone,
        paymentMethod: old.paymentMethod,
        subtotal: old.subtotal,
        shippingCharges: old.shippingCharges,
        total: old.total,
        timestamp: old.timestamp,
        status: newStatus,
        items: old.items,
      );
      _orders[idx] = updated;
      notifyListeners();
      await _firebase.updateOrderStatus(orderId, newStatus.displayName);
      logAudit('Order Updated', 'Order $orderId status changed to ${newStatus.displayName}');
    }
  }

  // ─── INVENTORY MANAGEMENT ────────────────────────────────────────────────

  Future<void> addProduct(ProductModel product) async {
    _products.insert(0, product);
    notifyListeners();
    await _firebase.saveProduct(product);
    logAudit('Product Added', 'Added product ${product.name} to shop');
  }

  Future<void> updateProduct(ProductModel updatedProduct) async {
    final idx = _products.indexWhere((p) => p.id == updatedProduct.id);
    if (idx != -1) {
      _products[idx] = updatedProduct;
      notifyListeners();
      await _firebase.saveProduct(updatedProduct);
      logAudit('Product Updated', 'Updated inventory for ${updatedProduct.name}');
    }
  }

  Future<void> updateProductStock(String productId, int newStock) async {
    final idx = _products.indexWhere((p) => p.id == productId);
    if (idx != -1) {
      final p = _products[idx];
      final updated = ProductModel(
        id: p.id,
        shopId: p.shopId,
        name: p.name,
        category: p.category,
        price: p.price,
        stockQuantity: newStock,
        imageUrl: p.imageUrl,
        description: p.description,
        brand: p.brand,
        soldCount: p.soldCount,
      );
      _products[idx] = updated;
      notifyListeners();
      await _firebase.saveProduct(updated);
      logAudit('Stock Updated', 'Stock for ${p.name} updated to $newStock');
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
    logAudit('Community Post', 'User ${_currentUser?.name} created a post');
  }

  Future<void> sharePost({
    required FeedPostModel originalPost,
    String caption = '',
  }) async {
    final newPost = FeedPostModel(
      postId: 'post_${const Uuid().v4().substring(0, 8)}',
      userId: _currentUser?.uid ?? 'user_1',
      userName: _currentUser?.name ?? 'Pet Lover',
      userPhoto: _currentUser?.photoUrl,
      postType: originalPost.postType,
      content: caption.isNotEmpty ? caption : 'Shared a story by ${originalPost.userName}',
      imageUrl: null,
      timestamp: DateTime.now().millisecondsSinceEpoch,
      sharedPostId: originalPost.postId,
      sharedPostAuthor: originalPost.userName,
      sharedPostContent: originalPost.content,
      sharedPostImageUrl: originalPost.imageUrl,
    );

    _posts.insert(0, newPost);
    originalPost.sharesCount += 1;
    notifyListeners();

    await _firebase.savePost(newPost);
    await _firebase.incrementPostShares(originalPost.postId);

    addNotification(
      title: 'Post Shared! 🚀',
      message: 'You shared ${originalPost.userName}\'s post with the community.',
      type: NotificationType.social,
    );
    logAudit('Post Shared', '${_currentUser?.name} shared post ${originalPost.postId}');
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
    final userId = _currentUser?.uid ?? 'usr_guest';
    final wasLiked = post.isLikedByUser(userId);
    post.toggleLike(userId);
    notifyListeners();
    await _firebase.togglePostLike(postId, userId, !wasLiked);
  }

  List<CommentModel> getCommentsForPost(String postId) {
    return _postComments[postId] ?? [];
  }

  void listenToComments(String postId) {
    _firebase.streamComments(postId).listen((fetchedComments) {
      debugPrint('[AppStateRepository] Received ${fetchedComments.length} comments for post $postId');
      _postComments[postId] = fetchedComments;
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] listenToComments error: $e'));
  }

  Future<void> addComment(String postId, String text) async {
    final comment = CommentModel(
      commentId: 'cmt_${_uuid.v4().substring(0, 6)}',
      postId: postId,
      userId: _currentUser?.uid ?? 'usr_guest',
      userName: _currentUser?.name ?? 'Pet Lover',
      userPhoto: _currentUser?.photoUrl,
      text: text,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    // Optimistic UI update
    if (!_postComments.containsKey(postId)) {
      _postComments[postId] = [];
    }
    _postComments[postId]!.add(comment);
    
    final postIdx = _posts.indexWhere((p) => p.postId == postId);
    if (postIdx != -1) {
      _posts[postIdx].commentsCount += 1;
    }
    notifyListeners();

    await _firebase.addComment(postId, comment);
  }

  // ─── VET VERIFICATION ────────────────────────────────────────────────────

  Future<void> toggleVetVerification(String vetId) async {
    final idx = _vets.indexWhere((v) => v.id == vetId);
    if (idx != -1) {
      final old = _vets[idx];
      final newVerified = !old.isVerified;
      final updated = VetModel(
        id: old.id,
        name: old.name,
        qualification: old.qualification,
        rating: old.rating,
        reviewsCount: old.reviewsCount,
        tag: old.tag,
        distance: old.distance,
        price: old.price,
        phone: old.phone,
        experience: old.experience,
        photoUrl: old.photoUrl,
        businessHours: old.businessHours,
        bio: old.bio,
        isVerified: newVerified,
      );
      _vets[idx] = updated;
      notifyListeners();
      await _firebase.toggleVetVerification(vetId, newVerified);
      logAudit('Vet Verification', 'Toggled verified status for ${old.name}');
    }
  }

  // ─── ADMIN BROADCAST & LOGS ──────────────────────────────────────────────

  void sendBroadcast(String message) {
    _systemBroadcasts.insert(0, message);
    logAudit('System Broadcast', 'Admin sent broadcast: "$message"');
    addNotification(
      title: 'System Update',
      message: message,
      type: NotificationType.system,
    );
    notifyListeners();
  }

  void logAudit(String action, String details) {
    final timeStr = DateTime.now().toString().substring(11, 19);
    _auditLogs.insert(0, '[$timeStr] $action: $details');
    if (_auditLogs.length > 50) _auditLogs.removeLast();
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

  void addNotification({
    required String title,
    required String message,
    required NotificationType type,
  }) async {
    final notification = NotificationModel(
      id: _uuid.v4().substring(0, 8),
      title: title,
      message: message,
      type: type,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );
    
    _notifications.removeWhere((n) => n.id == notification.id);
    _notifications.insert(0, notification);
    notifyListeners();

    if (_currentUser != null) {
      await _firebase.saveNotification(_currentUser!.uid, notification);
      
      // Show Premium In-App Overlay safely
      PremiumNotificationOverlay.show(
        TailWaggingApp.navigatorKey.currentContext,
        title: title,
        message: message,
        type: type,
      );
    }
  }

  void markNotificationAsRead(String id) async {
    final idx = _notifications.indexWhere((n) => n.id == id);
    if (idx != -1) {
      _notifications[idx].isRead = true;
      notifyListeners();
    }
    if (_currentUser != null) {
      await _firebase.markNotificationAsRead(_currentUser!.uid, id);
    }
  }

  void removeNotification(String id) async {
    _notifications.removeWhere((n) => n.id == id);
    notifyListeners();
    if (_currentUser != null) {
      await _firebase.removeNotification(_currentUser!.uid, id);
    }
  }

  void markAllNotificationsAsRead() async {
    for (var n in _notifications) {
      n.isRead = true;
    }
    notifyListeners();
    if (_currentUser != null) {
      for (var n in _notifications) {
        await _firebase.markNotificationAsRead(_currentUser!.uid, n.id);
      }
    }
  }

  void clearNotifications() async {
    _notifications.clear();
    notifyListeners();
    if (_currentUser != null) {
      await _firebase.clearAllNotifications(_currentUser!.uid);
    }
  }

  // ─── FAVORITES ───────────────────────────────────────────────────────────

  Future<void> toggleFavoriteVet(String vetId) async {
    if (_currentUser == null) return;

    final currentFavorites = List<String>.from(_currentUser!.favoriteVetIds);
    if (currentFavorites.contains(vetId)) {
      currentFavorites.remove(vetId);
    } else {
      currentFavorites.add(vetId);
    }

    final updatedUser = UserModel(
      uid: _currentUser!.uid,
      name: _currentUser!.name,
      email: _currentUser!.email,
      photoUrl: _currentUser!.photoUrl,
      phone: _currentUser!.phone,
      address: _currentUser!.address,
      latitude: _currentUser!.latitude,
      longitude: _currentUser!.longitude,
      role: _currentUser!.role,
      isVerified: _currentUser!.isVerified,
      favoriteVetIds: currentFavorites,
      points: _currentUser!.points,
      referralCode: _currentUser!.referralCode,
      fcmToken: _currentUser!.fcmToken,
    );

    _currentUser = updatedUser;
    notifyListeners();
    await _firebase.saveUserProfile(updatedUser);
  }

  Future<void> updateProfile({
    required String name,
    String? phone,
    String? photoUrl,
    String? address,
    double? latitude,
    double? longitude,
  }) async {
    if (_currentUser == null) return;

    final updatedUser = UserModel(
      uid: _currentUser!.uid,
      name: name,
      email: _currentUser!.email,
      photoUrl: photoUrl ?? _currentUser!.photoUrl,
      phone: phone ?? _currentUser!.phone,
      address: address ?? _currentUser!.address,
      latitude: latitude ?? _currentUser!.latitude,
      longitude: longitude ?? _currentUser!.longitude,
      role: _currentUser!.role,
      isVerified: _currentUser!.isVerified,
      favoriteVetIds: _currentUser!.favoriteVetIds,
      points: _currentUser!.points,
      referralCode: _currentUser!.referralCode,
      fcmToken: _currentUser!.fcmToken,
    );

    _currentUser = updatedUser;
    notifyListeners();
    await _firebase.saveUserProfile(updatedUser);
    logAudit('Profile Updated', 'User ${updatedUser.name} updated their profile info');
  }

  // ─── REVIEWS ─────────────────────────────────────────────────────────────

  Future<void> loadReviews(String targetId) async {
    try {
      final fetched = await _firebase.fetchReviews(targetId);
      _reviews
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    } catch (e) {
      debugPrint('[AppStateRepository] loadReviews error: $e');
    }
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
    logAudit('Review Added', 'User ${_currentUser!.name} reviewed provider (ID: $targetId)');
  }

  // ─── AI NUTRITION & DIET ──────────────────────────────────────────────────

  Future<List<String>> runAiNutritionSchedule({
    required String petName,
    required String breed,
    required String age,
    required String weight,
  }) async {
    final openAiApiKey = dotenv.env['OPENAI_API_KEY'];
    if (openAiApiKey != null && openAiApiKey.isNotEmpty) {
      try {
        final response = await http.post(
          Uri.parse('https://api.openai.com/v1/chat/completions'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $openAiApiKey',
          },
          body: jsonEncode({
            'model': 'gpt-4o',
            'messages': [
              {
                'role': 'system',
                'content': 'You are a pet nutrition expert. Provide a recommended feeding schedule (times only, format HH:MM) as a JSON array for the given pet details. Return ONLY the JSON array.'
              },
              {'role': 'user', 'content': 'Pet: $petName, Breed: $breed, Age: $age, Weight: $weight'}
            ],
            'temperature': 0.7,
          }),
        );
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final content = data['choices'][0]['message']['content'].toString().trim();
          // Remove potential markdown code blocks if the AI includes them
          final cleanJson = content.replaceAll('```json', '').replaceAll('```', '').trim();
          final List<dynamic> suggested = jsonDecode(cleanJson);
          return suggested.map((e) => e.toString()).toList();
        }
      } catch (_) {}
    }

    // Fallback default schedule
    await Future.delayed(const Duration(milliseconds: 1500));
    return ['08:00', '13:00', '19:00'];
  }

  Future<Map<String, dynamic>> runAiNutritionRecommendation({
    required String petName,
    required String breed,
    required String age,
    required String weight,
    String? currentDiet,
  }) async {
    final openAiApiKey = dotenv.env['OPENAI_API_KEY'];
    if (openAiApiKey != null && openAiApiKey.isNotEmpty) {
      try {
        final response = await http.post(
          Uri.parse('https://api.openai.com/v1/chat/completions'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $openAiApiKey',
          },
          body: jsonEncode({
            'model': 'gpt-4o',
            'messages': [
              {
                'role': 'system',
                'content': 'You are a specialized veterinary nutritionist. Analyze the pet\'s profile and provide a professional dietary plan as JSON. Include "calories", "nutrients" (list of strings), and "recommendations" (list of strings). Return ONLY valid JSON.'
              },
              {'role': 'user', 'content': 'Pet: $petName, Breed: $breed, Age: $age, Weight: $weight. Current Diet: ${currentDiet ?? 'Not specified'}'}
            ],
            'temperature': 0.7,
          }),
        );
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final content = data['choices'][0]['message']['content'].toString().trim();
          // Remove potential markdown code blocks if the AI includes them
          final cleanJson = content.replaceAll('```json', '').replaceAll('```', '').trim();
          return jsonDecode(cleanJson);
        }
      } catch (_) {}
    }

    await Future.delayed(const Duration(milliseconds: 1800));
    return {
      'calories': '350-400 kcal/day based on weight ($weight) and age ($age).',
      'nutrients': [
        'High-quality animal-based protein (min 26%)',
        'Omega-3 and Omega-6 fatty acids for coat health',
        'Balanced fiber (3-5%) for digestive stability'
      ],
      'recommendations': [
        'Transition slowly over 7-10 days if changing brands.',
        'Maintain consistent feeding times to regulate metabolism.',
        'Ensure fresh water is available at all times.'
      ]
    };
  }

  // ─── AI BREED FINDER ─────────────────────────────────────────────────────

  Future<String?> identifyBreed({required String? imagePath, File? imageFile}) async {
    final openAiApiKey = dotenv.env['OPENAI_API_KEY'];
    if (openAiApiKey == null || openAiApiKey.isEmpty) {
      return 'Generic Breed';
    }

    try {
      String base64Image;
      if (imageFile != null) {
        base64Image = base64.encode(await imageFile.readAsBytes());
      } else if (imagePath != null && !imagePath.startsWith('http')) {
        base64Image = base64.encode(await File(imagePath).readAsBytes());
      } else if (imagePath != null && imagePath.startsWith('http')) {
        final response = await http.get(Uri.parse(imagePath));
        if (response.statusCode == 200) {
          base64Image = base64.encode(response.bodyBytes);
        } else {
          return null;
        }
      } else {
        return null;
      }

      final response = await http.post(
        Uri.parse('https://api.openai.com/v1/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $openAiApiKey',
        },
        body: jsonEncode({
          'model': 'gpt-4o',
          'messages': [
            {
              'role': 'system',
              'content': 'You are a professional veterinarian breed identification expert. Return only the breed name, nothing else. If multiple breeds are visible, identify the most prominent one. If it is a mixed breed, state the two most likely breeds.'
            },
            {
              'role': 'user',
              'content': [
                {'type': 'text', 'text': 'Identify the breed of this pet. Return only the name.'},
                {
                  'type': 'image_url',
                  'image_url': {'url': 'data:image/jpeg;base64,$base64Image'}
                }
              ]
            }
          ],
          'max_tokens': 50,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['choices'][0]['message']['content'].toString().trim();
      }
    } catch (e) {
      debugPrint('[AI Breed Finder] Exception: $e');
    }

    return null;
  }
}


