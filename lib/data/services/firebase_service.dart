import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';

import '../models/pet_model.dart';
import '../models/event_model.dart';
import '../models/product_model.dart';
import '../models/order_model.dart';
import '../models/vet_model.dart';
import '../models/service_record_model.dart';
import '../models/feed_post_model.dart';
import '../models/comment_model.dart';
import '../models/review_model.dart';
import '../models/notification_model.dart';
import '../models/blog_post_model.dart';
import '../models/user_model.dart' as app_models;

/// FirebaseService handles all Firestore and Auth operations with offline-first persistence.
class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal() {
    _initPersistence();
  }

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
    ],
    serverClientId: '335402911476-29mje5mt1utr9ttpkecf1gc8dsev2rgu.apps.googleusercontent.com',
  );

  void _initPersistence() {
    try {
      _db.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );
      debugPrint('[FirebaseService] Firestore offline persistence initialized (unlimited cache).');
    } catch (e) {
      debugPrint('[FirebaseService] Firestore settings notice: $e');
    }
  }

  // Collection References
  CollectionReference get _usersCol => _db.collection('users');
  CollectionReference get _petsCol => _db.collection('pets');
  CollectionReference get _productsCol => _db.collection('products');
  CollectionReference get _ordersCol => _db.collection('orders');
  CollectionReference get _vetsCol => _db.collection('vets');
  CollectionReference get _recordsCol => _db.collection('service_records');
  CollectionReference get _postsCol => _db.collection('community_posts');
  CollectionReference get _eventsCol => _db.collection('events');
  CollectionReference get _reviewsCol => _db.collection('reviews');
  CollectionReference get _notificationsCol => _db.collection('notifications');
  CollectionReference get _blogsCol => _db.collection('blogs');

  // ─── AUTH ────────────────────────────────────────────────────────────────

  User? get currentFirebaseUser => _auth.currentUser;

  Future<UserCredential?> signInAnonymouslyIfNeeded() async {
    if (_auth.currentUser == null) {
      return await _auth.signInAnonymously();
    }
    return null;
  }

  Future<UserCredential?> signInWithGoogle() async {
    try {
      // 1. Primary Attempt: Standard Google Play Services Native Sign-In
      GoogleSignInAccount? googleUser;
      try {
        try {
          await _googleSignIn.signOut();
        } catch (_) {}
        googleUser = await _googleSignIn.signIn();
      } catch (playServicesError) {
        debugPrint("[FirebaseService] Google Play Services sign-in attempt failed: $playServicesError");
        // Secondary Attempt: Auto-configured GoogleSignIn without hardcoded serverClientId
        try {
          final fallbackSignIn = GoogleSignIn();
          await fallbackSignIn.signOut().catchError((_) => null);
          googleUser = await fallbackSignIn.signIn();
        } catch (fallbackError) {
          debugPrint("[FirebaseService] Fallback GoogleSignIn also failed: $fallbackError");
        }
      }

      if (googleUser != null) {
        final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
        final OAuthCredential credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );
        return await _auth.signInWithCredential(credential);
      }

      // 2. Resilient Fallback: Direct Firebase Google Auth Provider
      // This bypasses Google Play Services SHA-1 signature mismatch errors on Closed Testing builds
      debugPrint("[FirebaseService] Attempting Firebase OAuth Provider flow for Google...");
      final googleProvider = GoogleAuthProvider();
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      return await _auth.signInWithProvider(googleProvider);
    } catch (e) {
      debugPrint("[FirebaseService] Google Sign-In ultimate error: $e");
      rethrow;
    }
  }

  Future<UserCredential> createAccount(String email, String password) =>
      _auth.createUserWithEmailAndPassword(email: email, password: password);

  Future<UserCredential> signIn(String email, String password) =>
      _auth.signInWithEmailAndPassword(email: email, password: password);

  Future<void> sendPasswordResetEmail(String email) =>
      _auth.sendPasswordResetEmail(email: email);

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }

  Future<void> deleteAccount() async {
    final user = _auth.currentUser;
    if (user != null) {
      await user.delete();
    }
  }

  // ─── USER PROFILE ────────────────────────────────────────────────────────

  Future<void> saveUserProfile(app_models.UserModel user) async {
    await _usersCol.doc(user.uid).set(user.toMap(), SetOptions(merge: true));
  }

  Future<app_models.UserModel?> fetchUserProfile(String uid) async {
    final doc = await _usersCol.doc(uid).get();
    if (!doc.exists || doc.data() == null) return null;
    return app_models.UserModel.fromMap(uid, doc.data()! as Map<String, dynamic>);
  }

  Stream<app_models.UserModel?> streamUserProfile(String uid) {
    return _usersCol.doc(uid).snapshots().map((doc) {
      if (!doc.exists || doc.data() == null) return null;
      return app_models.UserModel.fromMap(uid, doc.data()! as Map<String, dynamic>);
    });
  }

  Future<List<app_models.UserModel>> fetchUsers() async {
    final snap = await _usersCol.get();
    return snap.docs
        .map((d) => app_models.UserModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
        .toList();
  }

  Future<List<app_models.UserModel>> fetchUsersByRole(String role) async {
    final snap = await _usersCol.where('role', isEqualTo: role).get();
    return snap.docs
        .map((d) => app_models.UserModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
        .toList();
  }

  /// Applies a referral code for a user, awarding +5 points to the referrer.
  Future<({bool success, String? errorMessage})> applyReferralCode({
    required String userUid,
    required String code,
  }) async {
    try {
      final normalizedCode = code.trim().toUpperCase();
      if (normalizedCode.isEmpty) {
        return (success: false, errorMessage: 'Referral code cannot be empty');
      }

      // 1. Find referrer user with matching referralCode
      final snap = await _usersCol.where('referralCode', isEqualTo: normalizedCode).limit(1).get();
      if (snap.docs.isEmpty) {
        return (success: false, errorMessage: 'Referral code "$normalizedCode" is invalid or does not exist');
      }

      final referrerDoc = snap.docs.first;
      final referrerUid = referrerDoc.id;

      // 2. Prevent self-referral
      if (referrerUid == userUid) {
        return (success: false, errorMessage: 'You cannot use your own referral code');
      }

      // 3. Prevent duplicate referral redemption by current user
      final userDoc = await _usersCol.doc(userUid).get();
      if (userDoc.exists && userDoc.data() != null) {
        final userData = userDoc.data() as Map<String, dynamic>;
        if (userData['referredBy'] != null && (userData['referredBy'] as String).isNotEmpty) {
          return (success: false, errorMessage: 'You have already redeemed a referral code');
        }
      }

      // 4. Award +5 points to referrer
      await _usersCol.doc(referrerUid).update({
        'points': FieldValue.increment(5),
      });

      // 5. Record referral on current user document
      await _usersCol.doc(userUid).set({
        'referredBy': normalizedCode,
      }, SetOptions(merge: true));

      // 6. Push notification to referrer
      final notifId = 'notif_${DateTime.now().millisecondsSinceEpoch}';
      await _notificationsCol.doc(referrerUid).collection('items').doc(notifId).set({
        'id': notifId,
        'title': '🎉 +5 Referral Points Earned!',
        'message': 'A friend just joined Pet Maya using your referral code $normalizedCode. You received 5 points!',
        'type': 'reward',
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'isRead': false,
      }).catchError((_) => null);

      return (success: true, errorMessage: null);
    } catch (e) {
      debugPrint('[FirebaseService] applyReferralCode error: $e');
      return (success: false, errorMessage: 'Failed to apply referral code: ${e.toString()}');
    }
  }

  /// Purge all user data from Firestore
  Future<void> deleteUserData(String userId) async {
    // 1. Delete user profile
    await _usersCol.doc(userId).delete();

    // 2. Delete user's pets
    final petsSnap = await _petsCol.where('ownerID', isEqualTo: userId).get();
    for (var doc in petsSnap.docs) {
      await doc.reference.delete();
    }

    // 3. Delete user's events
    final eventsSnap = await _eventsCol.where('userId', isEqualTo: userId).get();
    for (var doc in eventsSnap.docs) {
      await doc.reference.delete();
    }

    // 4. Delete user's notifications
    final notifsSnap = await _notificationsCol.doc(userId).collection('items').get();
    for (var doc in notifsSnap.docs) {
      await doc.reference.delete();
    }
    await _notificationsCol.doc(userId).delete();

    // 5. Delete user's orders
    final ordersSnap = await _ordersCol.where('userId', isEqualTo: userId).get();
    for (var doc in ordersSnap.docs) {
      await doc.reference.delete();
    }
  }

  // ─── PETS ────────────────────────────────────────────────────────────────

  Future<List<PetModel>> fetchPets(String ownerUID) async {
    Query query = _petsCol;
    if (ownerUID.isNotEmpty) {
      query = _petsCol.where('ownerID', isEqualTo: ownerUID);
    }
    final snap = await query.get();
    return snap.docs.map((d) => PetModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
  }

  Stream<List<PetModel>> streamPets(String ownerUID) {
    Query query = _petsCol;
    if (ownerUID.isNotEmpty) {
      query = _petsCol.where('ownerID', isEqualTo: ownerUID);
    }
    return query.snapshots().map((snap) =>
        snap.docs.map((d) => PetModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList());
  }

  Future<void> savePet(PetModel pet) async {
    await _petsCol.doc(pet.petID).set(pet.toMap(), SetOptions(merge: true));
  }

  Future<void> deletePet(String petId) async {
    await _petsCol.doc(petId).delete();
  }

  // ─── EVENTS / CALENDAR ───────────────────────────────────────────────────

  Future<List<EventModel>> fetchEvents(String userId) async {
    Query query = _eventsCol;
    if (userId.isNotEmpty) {
      query = _eventsCol.where('userId', isEqualTo: userId);
    }
    final snap = await query.get();
    return snap.docs.map((d) => EventModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
  }

  Stream<List<EventModel>> streamEvents(String userId) {
    if (userId.isEmpty) return Stream.value([]);
    return _eventsCol
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snap) => snap.docs.map((d) => EventModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList());
  }

  Stream<List<EventModel>> streamEventsForProvider(String providerId) {
    return _eventsCol
        .where('providerId', isEqualTo: providerId)
        .snapshots()
        .map((snap) => snap.docs.map((d) => EventModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList());
  }

  Future<void> saveEvent(EventModel event) async {
    await _eventsCol.doc(event.id).set(event.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteEvent(String userId, DateTime date, String eventId) async {
    await _eventsCol.doc(eventId).delete();
  }

  // ─── PRODUCTS ────────────────────────────────────────────────────────────

  Future<List<ProductModel>> fetchProducts() async {
    final snap = await _productsCol.get();
    return snap.docs.map((d) => ProductModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
  }

  Stream<List<ProductModel>> streamProducts() {
    return _productsCol
        .snapshots()
        .map((snap) => snap.docs.map((d) => ProductModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList());
  }

  Future<void> saveProduct(ProductModel product) async {
    await _productsCol.doc(product.id).set(product.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteProduct(String productId) async {
    await _productsCol.doc(productId).delete();
  }

  Future<void> updateProductStock(String productId, int newStock) async {
    await _productsCol.doc(productId).update({'stockQuantity': newStock});
  }

  // ─── ORDERS ──────────────────────────────────────────────────────────────

  Future<List<OrderModel>> fetchOrders(String userId) async {
    final snap = await _ordersCol
        .where('userId', isEqualTo: userId)
        .get();
    final list = snap.docs.map((d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Future<List<OrderModel>> fetchAllOrders() async {
    final snap = await _ordersCol.get();
    final list = snap.docs.map((d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Stream<List<OrderModel>> streamAllOrders() {
    return _ordersCol
        .snapshots()
        .map((snap) {
          final list = snap.docs.map((d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
          list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
          return list;
        });
  }

  Stream<List<OrderModel>> streamUserOrders(String userId) {
    return _ordersCol
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snap) {
          final list = snap.docs.map((d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
          list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
          return list;
        });
  }

  Future<void> placeOrder(OrderModel order) async {
    await _ordersCol.doc(order.orderId).set(order.toMap());
  }

  Future<void> updateOrderStatus(String orderId, String newStatus) async {
    await _ordersCol.doc(orderId).update({'status': newStatus});
  }

  // ─── VETS / SERVICE PROVIDERS ────────────────────────────────────────────

  Future<List<VetModel>> fetchVets() async {
    final snap = await _vetsCol.get();
    return snap.docs
        .map((doc) => VetModel.fromMap(doc.id, doc.data()! as Map<String, dynamic>))
        .toList();
  }

  Stream<List<VetModel>> streamVets() {
    return _vetsCol.snapshots().map((snap) {
      return snap.docs
          .map((doc) => VetModel.fromMap(doc.id, doc.data()! as Map<String, dynamic>))
          .toList();
    });
  }

  Future<void> saveVet(VetModel vet) async {
    await _vetsCol.doc(vet.id).set(vet.toMap(), SetOptions(merge: true));
  }

  Future<void> toggleVetVerification(String vetId, bool isVerified) async {
    await _usersCol.doc(vetId).update({'isVerified': isVerified});
    try {
      await _vetsCol.doc(vetId).update({'isVerified': isVerified});
    } catch (_) {}
  }

  Future<void> updateVetPrice(String vetId, String price) async {
    await _usersCol.doc(vetId).update({'price': price});
    try {
      await _vetsCol.doc(vetId).update({'price': price});
    } catch (_) {}
  }

  // ─── MEDICAL / SERVICE RECORDS ───────────────────────────────────────────

  Future<List<ServiceRecordModel>> fetchServiceRecords(String petId) async {
    Query query = _recordsCol;
    if (petId.isNotEmpty) {
      query = _recordsCol.where('petId', isEqualTo: petId);
    }
    final snap = await query.get();
    final list = snap.docs.map((d) => ServiceRecordModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Future<List<ServiceRecordModel>> fetchAllServiceRecords() async {
    final snap = await _recordsCol.get();
    final list = snap.docs.map((d) => ServiceRecordModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Stream<List<ServiceRecordModel>> streamServiceRecords(String petId) {
    Query query = _recordsCol;
    if (petId.isNotEmpty) {
      query = _recordsCol.where('petId', isEqualTo: petId);
    }
    return query.snapshots().map((snap) {
      final list = snap.docs.map((d) => ServiceRecordModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  Future<void> saveServiceRecord(ServiceRecordModel record) async {
    await _recordsCol.doc(record.recordId).set(record.toMap(), SetOptions(merge: true));
  }

  // ─── COMMUNITY FEED ──────────────────────────────────────────────────────

  Stream<List<FeedPostModel>> streamPosts() {
    return _postsCol
        .snapshots()
        .map((snap) {
          final list = snap.docs.map((d) => FeedPostModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
          list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
          return list;
        });
  }

  Future<void> savePost(FeedPostModel post) async {
    await _postsCol.doc(post.postId).set(post.toMap(), SetOptions(merge: true));
  }

  Future<void> togglePostLike(String postId, String userId, bool liked) async {
    final ref = _postsCol.doc(postId);
    if (liked) {
      await ref.set({
        'likesCount': FieldValue.increment(1),
        'likes': FieldValue.increment(1),
        'likedByUserIds': FieldValue.arrayUnion([userId]),
        'likedBy': {userId: true},
      }, SetOptions(merge: true));
    } else {
      await ref.set({
        'likesCount': FieldValue.increment(-1),
        'likes': FieldValue.increment(-1),
        'likedByUserIds': FieldValue.arrayRemove([userId]),
        'likedBy': {userId: false},
      }, SetOptions(merge: true));
    }
  }

  Future<void> incrementPostShares(String postId) async {
    await _postsCol.doc(postId).set({'sharesCount': FieldValue.increment(1)}, SetOptions(merge: true));
  }

  Stream<List<CommentModel>> streamComments(String postId) {
    return _postsCol
        .doc(postId)
        .collection('comments')
        .snapshots()
        .map((snap) {
          final list = snap.docs.map((d) => CommentModel.fromMap(d.id, d.data())).toList();
          list.sort((a, b) => a.timestamp.compareTo(b.timestamp));
          return list;
        });
  }

  Future<void> addComment(String postId, CommentModel comment) async {
    final cMap = comment.toMap();
    await _postsCol.doc(postId).set({
      'commentsCount': FieldValue.increment(1),
      'comments': FieldValue.arrayUnion([cMap]),
    }, SetOptions(merge: true));
    await _postsCol
        .doc(postId)
        .collection('comments')
        .doc(comment.commentId)
        .set(cMap, SetOptions(merge: true));
  }

  // ─── REVIEWS ─────────────────────────────────────────────────────────────

  Future<void> saveReview(ReviewModel review) async {
    await _reviewsCol.doc(review.id).set(review.toMap(), SetOptions(merge: true));
  }

  Future<List<ReviewModel>> fetchReviews(String targetId) async {
    final snap = await _reviewsCol.where('targetId', isEqualTo: targetId).get();
    return snap.docs.map((d) => ReviewModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
  }

  Stream<List<ReviewModel>> streamReviews(String targetId) {
    return _reviewsCol
        .where('targetId', isEqualTo: targetId)
        .snapshots()
        .map((snap) => snap.docs.map((d) => ReviewModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList());
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

  Future<void> saveNotification(String userId, NotificationModel notification) async {
    await _notificationsCol
        .doc(userId)
        .collection('items')
        .doc(notification.id)
        .set(notification.toMap(), SetOptions(merge: true));
  }

  Stream<List<NotificationModel>> streamNotifications(String userId) {
    return _notificationsCol
        .doc(userId)
        .collection('items')
        .snapshots()
        .map((snap) {
          final list = snap.docs.map((d) => NotificationModel.fromMap(d.id, d.data())).toList();
          list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
          return list;
        });
  }

  Future<void> markNotificationAsRead(String userId, String id) async {
    await _notificationsCol
        .doc(userId)
        .collection('items')
        .doc(id)
        .update({'isRead': true});
  }

  Future<void> removeNotification(String userId, String id) async {
    await _notificationsCol
        .doc(userId)
        .collection('items')
        .doc(id)
        .delete();
  }

  Future<void> clearAllNotifications(String userId) async {
    final snap = await _notificationsCol.doc(userId).collection('items').get();
    for (var doc in snap.docs) {
      await doc.reference.delete();
    }
  }

  // ─── BLOGS ──────────────────────────────────────────────────────────────

  Future<List<BlogPostModel>> fetchBlogs() async {
    final snap = await _blogsCol.get();
    final list = snap.docs.map((d) => BlogPostModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Stream<List<BlogPostModel>> streamBlogs() {
    return _blogsCol.snapshots().map((snap) {
      final list = snap.docs.map((d) => BlogPostModel.fromMap(d.id, d.data()! as Map<String, dynamic>)).toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  Future<void> saveBlog(BlogPostModel blog) async {
    await _blogsCol.doc(blog.id).set(blog.toMap(), SetOptions(merge: true));
  }

  Future<void> updateBlogStatus(String blogId, String status, bool isApproved) async {
    await _blogsCol.doc(blogId).set({
      'status': status,
      'isApproved': isApproved,
    }, SetOptions(merge: true));
  }

  Future<void> deleteBlog(String blogId) async {
    await _blogsCol.doc(blogId).delete();
  }

  // ─── GLOBAL SETTINGS ────────────────────────────────────────────────────

  Future<void> saveGlobalSetting(String key, dynamic value) async {
    await _db.collection('settings').doc('global').set({key: value}, SetOptions(merge: true));
  }

  Stream<DocumentSnapshot> streamGlobalSettings() {
    return _db.collection('settings').doc('global').snapshots();
  }
}



