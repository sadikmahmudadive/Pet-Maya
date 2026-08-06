import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

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
import '../services/realtime_database_service.dart';
import '../../core/services/notification_service.dart';

class AppStateRepository extends ChangeNotifier {
  static final AppStateRepository _instance = AppStateRepository._internal();
  factory AppStateRepository() => _instance;

  final _uuid = const Uuid();
  final _firebase = FirebaseService();
  final _rtdb = RealtimeDatabaseService();

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
    
    // Generate birthday events dynamically
    for (final pet in _pets) {
      if (pet.dob.isNotEmpty) {
        try {
          final dob = DateTime.parse(pet.dob);
          final now = DateTime.now();
          
          // Generate birthdays for a 3-year window (past, current, next)
          for (int yearOffset = -1; yearOffset <= 1; yearOffset++) {
            final bday = DateTime(now.year + yearOffset, dob.month, dob.day);
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
              isCompleted: bday.isBefore(DateTime(now.year, now.month, now.day)),
            ));
          }
        } catch (_) {}
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
    // Attempt to restore session on initialization
    _restoreExistingSession();
    _setupNotificationListener();
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
        final profile = await _rtdb.fetchUserProfile(fUser.uid);
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

  // ─── FIREBASE SYNC ENTRY POINT ────────────────────────────────────────────
  /// Called after login to fetch and stream all user data from Realtime Database.
  Future<void> syncFromFirebase(UserModel user) async {
    _setLoading(true);
    debugPrint('[AppStateRepository] Syncing for UID: ${user.uid} (${user.role.displayName})');
    try {
      // 1. Refresh FCM Token and update profile
      final fcmToken = await NotificationService().getToken();
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
        fcmToken: fcmToken ?? user.fcmToken,
        latitude: user.latitude,
        longitude: user.longitude,
      );

      // Save / update user profile in RTDB
      await _rtdb.saveUserProfile(updatedUser);
      _currentUser = updatedUser;

      // Always load shared data (products, vets)
      await _loadProducts();
      _listenToVets();
      await _loadCommunityPosts();

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
          await loadAllUsers();
          break;
      }

      // Stream notifications for the current user
      _listenToNotifications(user.uid);

      logAudit('Firebase Sync', 'Data loaded for ${user.name} (${user.role.displayName})');
    } catch (e) {
      _syncError = 'Oops! The treats got lost. Try again?';
      debugPrint('[AppStateRepository] syncFromFirebase error: $e');
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  // ─── DATA LOADERS & STREAMERS ─────────────────────────────────────────────

  void _listenToPets(String ownerUID) {
    _rtdb.streamPets(ownerUID).listen((fetched) {
      _pets
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToPets error: $e'));
  }

  void _listenToVets() {
    _rtdb.streamVets().listen((fetched) {
      _vets
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToVets error: $e'));
  }

  void _listenToEvents(String userId) {
    _rtdb.streamEvents(userId).listen((fetched) {
      _events
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToEvents error: $e'));
  }

  void _listenToEventsForProvider(String providerId) {
    _rtdb.streamEventsForProvider(providerId).listen((fetched) {
      _events
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToEventsForProvider error: $e'));
  }

  void _listenToServiceRecords(String petId) {
    _rtdb.streamServiceRecords(petId).listen((fetched) {
      _serviceRecords
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToServiceRecords error: $e'));
  }

  void _listenToAllOrders() {
    _rtdb.streamAllOrders().listen((fetched) {
      _orders
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToAllOrders error: $e'));
  }

  void _listenToUserOrders(String userId) {
    _rtdb.streamUserOrders(userId).listen((fetched) {
      _orders
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToUserOrders error: $e'));
  }

  void _listenToNotifications(String userId) {
    _rtdb.streamNotifications(userId).listen((fetched) {
      _notifications
        ..clear()
        ..addAll(fetched);
      notifyListeners();
    }, onError: (e) => debugPrint('[AppStateRepository] _listenToNotifications error: $e'));
  }

  Future<void> _loadEvents(String userId) async {
    try {
      final fetched = await _rtdb.fetchEvents(userId);
      _events
        ..clear()
        ..addAll(fetched);
    } catch (e) {
      debugPrint('[AppStateRepository] _loadEvents error: $e');
    }
  }

  Future<void> _loadAllEvents() async {
    try {
      final fetched = await _rtdb.fetchEvents('');
      _events
        ..clear()
        ..addAll(fetched);
    } catch (e) {
      debugPrint('[AppStateRepository] _loadAllEvents error: $e');
    }
  }

  Future<void> _loadProducts() async {
    try {
      final fetched = await _rtdb.fetchProducts();
      _products
        ..clear()
        ..addAll(fetched);
    } catch (e) {
      debugPrint('[AppStateRepository] _loadProducts error: $e');
    }
  }

  Future<void> _loadUserOrders(String userId) async {
    try {
      final fetched = await _rtdb.fetchOrders(userId);
      _orders
        ..clear()
        ..addAll(fetched);
    } catch (e) {
      debugPrint('[AppStateRepository] _loadUserOrders error: $e');
    }
  }

  Future<void> _loadAllOrders() async {
    try {
      final fetched = await _rtdb.fetchAllOrders();
      _orders
        ..clear()
        ..addAll(fetched);
    } catch (e) {
      debugPrint('[AppStateRepository] _loadAllOrders error: $e');
    }
  }

  Future<void> _loadAllServiceRecords() async {
    try {
      final fetched = await _rtdb.fetchAllServiceRecords();
      _serviceRecords
        ..clear()
        ..addAll(fetched);
    } catch (e) {
      debugPrint('[AppStateRepository] _loadAllServiceRecords error: $e');
    }
  }

  Future<void> loadAllUsers() async {
    try {
      final fetched = await _rtdb.fetchUsers();
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
      _rtdb.streamPosts().listen((fetchedPosts) {
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

      // Check if user already exists in RTDB to keep their role
      final existingProfile = await _rtdb.fetchUserProfile(firebaseUID);
      
      _currentUser = UserModel(
        uid: firebaseUID,
        name: existingProfile?.name ?? name,
        email: email,
        role: existingProfile?.role ?? effectiveRole,
        photoUrl: existingProfile?.photoUrl,
        phone: existingProfile?.phone,
        isVerified: existingProfile?.isVerified ?? (effectiveRole == UserRole.veterinarian),
      );

      // Sync data from RTDB based on the user's role
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

      // Fetch profile from RTDB to get the role
      final profile = await _rtdb.fetchUserProfile(firebaseUID);
      
      if (profile == null) {
        throw 'User profile not found. Please register first.';
      }

      _currentUser = profile;

      // Sync data from RTDB based on the user's role
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
        var profile = await _rtdb.fetchUserProfile(fUser.uid);
        
        if (profile == null) {
          // New Google User - create profile with default role (usually petOwner)
          profile = UserModel(
            uid: fUser.uid,
            name: fUser.displayName ?? 'Google User',
            email: fUser.email ?? '',
            photoUrl: fUser.photoURL,
            role: defaultRole ?? UserRole.petOwner,
            isVerified: false,
          );
          await _rtdb.saveUserProfile(profile);
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
      );

      // Save to RTDB and sync
      await syncFromFirebase(_currentUser!);

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
        await _rtdb.saveVet(vetEntry);
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

  // ─── PET OPERATIONS ──────────────────────────────────────────────────────

  Future<void> addPet(PetModel pet) async {
    _pets.add(pet);
    notifyListeners();
    await _rtdb.savePet(pet);
    logAudit('Pet Added', 'Added pet: ${pet.name} (${pet.breed})');
  }

  Future<void> updatePet(PetModel updatedPet) async {
    final idx = _pets.indexWhere((p) => p.petID == updatedPet.petID);
    if (idx != -1) {
      _pets[idx] = updatedPet;
      notifyListeners();
      await _rtdb.savePet(updatedPet);
      logAudit('Pet Updated', 'Updated details for ${updatedPet.name}');
    }
  }

  Future<void> deletePet(String petId) async {
    final pet = _pets.firstWhere((p) => p.petID == petId, orElse: () => _pets.first);
    _pets.removeWhere((p) => p.petID == petId);
    notifyListeners();
    await _rtdb.deletePet(petId);
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
      await _rtdb.savePet(updated);
    }
  }

  // ─── CALENDAR & REMINDERS ────────────────────────────────────────────────

  Future<void> addEvent(EventModel event) async {
    _events.add(event);
    notifyListeners();
    await _rtdb.saveEvent(event);
    logAudit('Event Scheduled', 'Scheduled ${event.title} for ${event.petName}');
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
      await _rtdb.saveEvent(updated);
    }
  }

  // ─── AI HEALTH DIAGNOSTIC ────────────────────────────────────────────────

  Future<String> runAiHealthDiagnosis({
    required String petName,
    required String prompt,
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
            'model': 'gpt-4o-mini',
            'messages': [
              {
                'role': 'system',
                'content': 'You are a compassionate veterinary AI assistant. Analyze pet symptoms described or shown, outline possible causes, severity level, home care tips, and state clearly when to see a veterinarian.'
              },
              {'role': 'user', 'content': 'Pet Name: $petName. Issue description: $prompt'}
            ],
            'temperature': 0.7,
          }),
        );
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          return data['choices'][0]['message']['content'];
        }
      } catch (_) {}
    }

    await Future.delayed(const Duration(milliseconds: 1400));
    return '''🔍 **AI Health Diagnostic Assessment for $petName**

**1. Observations & Primary Symptoms:**
• Mild localized skin sensitivity / irritation observed in target area.
• No deep lacerations or acute purulent discharge visible.

**2. Potential Causes:**
• Environmental contact allergen (grass, seasonal pollen, or carpet cleaner).
• Mild flea allergy dermatitis or superficial moisture irritation.

**3. Recommended Action & First Aid:**
• Gently clean the area with mild saline solution or chlorhexidine wipe.
• Avoid letting $petName lick or scratch the area (use an Elizabethan collar if needed).
• Apply soothing organic chamomile / aloe gel.

⚠️ *Severity Level: LOW TO MODERATE. If redness expands, swells, or pain increases within 24-48 hours, please book an in-person veterinary checkup immediately.*''';
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
    await _rtdb.saveServiceRecord(record);
    logAudit('Medical Record Saved', 'Saved AI diagnosis to $petName record');
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
    // Persist to RTDB
    await _rtdb.placeOrder(order);
    logAudit('Order Placed', 'Order ${order.orderId} created for \$${order.total.toStringAsFixed(2)}');
    return order;
  }

  Future<void> updateOrderStatus(String orderId, OrderStatus newStatus) async {
    // This would need a specific update in rtdb service if we want to be surgical, 
    // but we can just save the whole order again for now if needed or add an update method.
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
      await _rtdb.placeOrder(updated);
      logAudit('Order Updated', 'Order $orderId status changed to ${newStatus.displayName}');
    }
  }

  // ─── INVENTORY MANAGEMENT ────────────────────────────────────────────────

  Future<void> addProduct(ProductModel product) async {
    _products.insert(0, product);
    notifyListeners();
    await _rtdb.saveProduct(product);
    logAudit('Product Added', 'Added product ${product.name} to shop');
  }

  Future<void> updateProduct(ProductModel updatedProduct) async {
    final idx = _products.indexWhere((p) => p.id == updatedProduct.id);
    if (idx != -1) {
      _products[idx] = updatedProduct;
      notifyListeners();
      await _rtdb.saveProduct(updatedProduct);
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
      await _rtdb.saveProduct(updated);
      logAudit('Stock Updated', 'Stock for ${p.name} updated to $newStock');
    }
  }

  Future<void> deleteProduct(String productId) async {
    _products.removeWhere((p) => p.id == productId);
    notifyListeners();
    await _rtdb.deleteProduct(productId);
  }

  // ─── COMMUNITY INTERACTIONS ──────────────────────────────────────────────

  Future<void> addPost(FeedPostModel post) async {
    _posts.insert(0, post);
    notifyListeners();
    await _rtdb.savePost(post);
    logAudit('Community Post', 'User ${_currentUser?.name} created a post');
  }

  Future<void> togglePostLike(String postId) async {
    final post = _posts.firstWhere((p) => p.postId == postId);
    final userId = _currentUser?.uid ?? 'usr_guest';
    final wasLiked = post.isLikedByUser(userId);
    post.toggleLike(userId);
    notifyListeners();
    await _rtdb.togglePostLike(postId, userId, !wasLiked);
  }

  List<CommentModel> getCommentsForPost(String postId) {
    return _postComments[postId] ?? [];
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
    if (!_postComments.containsKey(postId)) {
      _postComments[postId] = [];
    }
    _postComments[postId]!.add(comment);
    final postIdx = _posts.indexWhere((p) => p.postId == postId);
    if (postIdx != -1) {
      _posts[postIdx].commentsCount += 1;
    }
    notifyListeners();
    await _rtdb.addComment(postId, comment);
  }

  // ─── SERVICE RECORDS ─────────────────────────────────────────────────────

  Future<void> addServiceRecord(ServiceRecordModel record) async {
    _serviceRecords.insert(0, record);
    notifyListeners();
    await _rtdb.saveServiceRecord(record);
    logAudit('Medical Record Saved', 'Clinical chart saved for ${record.petName}');
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
      await _rtdb.saveVet(updated);
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
    
    if (_currentUser != null) {
      await _rtdb.saveNotification(_currentUser!.uid, notification);
    }
  }

  void markNotificationAsRead(String id) async {
    if (_currentUser != null) {
      await _rtdb.markNotificationAsRead(_currentUser!.uid, id);
    }
  }

  void markAllNotificationsAsRead() async {
    if (_currentUser != null) {
      for (var n in _notifications) {
        if (!n.isRead) {
          await _rtdb.markNotificationAsRead(_currentUser!.uid, n.id);
        }
      }
    }
  }

  void clearNotifications() async {
    if (_currentUser != null) {
      await _rtdb.clearAllNotifications(_currentUser!.uid);
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
    await _rtdb.saveUserProfile(updatedUser);
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
    await _rtdb.saveUserProfile(updatedUser);
    logAudit('Profile Updated', 'User ${updatedUser.name} updated their profile info');
  }

  // ─── REVIEWS ─────────────────────────────────────────────────────────────

  Future<void> loadReviews(String targetId) async {
    try {
      final fetched = await _rtdb.fetchReviews(targetId);
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
    await _rtdb.saveReview(review);
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
            'model': 'gpt-4o-mini',
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
            'model': 'gpt-4o-mini',
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

  Future<String> identifyBreed({required String imagePath}) async {
    final openAiApiKey = dotenv.env['OPENAI_API_KEY'];
    if (openAiApiKey != null && openAiApiKey.isNotEmpty) {
      // Real API implementation would go here (Base64 image to OpenAI Vision)
    }

    await Future.delayed(const Duration(seconds: 2));
    // Mock identifying popular breeds for demo parity
    final breeds = ['Golden Retriever', 'German Shepherd', 'Poodle', 'Persian Cat', 'Maine Coon'];
    return breeds[DateTime.now().second % breeds.length];
  }
}
