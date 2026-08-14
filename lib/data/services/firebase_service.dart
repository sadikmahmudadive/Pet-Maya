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
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final OAuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      return await _auth.signInWithCredential(credential);
    } catch (e) {
      debugPrint("Error signing in with Google: $e");
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

  Future<List<app_models.UserModel>> fetchUsers() async {
    final snap = await _usersCol.get();
    return snap.docs
        .map((d) => app_models.UserModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
        .toList();
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
    final snap = await _usersCol.get();
    return snap.docs
        .where((doc) {
          final data = doc.data() as Map<String, dynamic>?;
          if (data == null) return false;
          final role = data['role']?.toString().toLowerCase() ?? '';
          final email = data['email']?.toString().toLowerCase() ?? '';
          final name = data['name']?.toString().toLowerCase() ?? '';
          if (email.contains('test') || email.contains('example') ||
              name.contains('test') || name.contains('demo')) return false;
          return role.contains('veterinarian') || role.contains('vet') ||
                 role.contains('grooming') || role.contains('boarding');
        })
        .map((doc) => VetModel.fromMap(doc.id, doc.data()! as Map<String, dynamic>))
        .toList();
  }

  Stream<List<VetModel>> streamVets() {
    return _usersCol.snapshots().map((snap) {
      return snap.docs
          .where((doc) {
            final data = doc.data() as Map<String, dynamic>?;
            if (data == null) return false;
            final role = data['role']?.toString().toLowerCase() ?? '';
            final email = data['email']?.toString().toLowerCase() ?? '';
            final name = data['name']?.toString().toLowerCase() ?? '';
            if (email.contains('test') || email.contains('example') ||
                name.contains('test') || name.contains('demo')) return false;
            return role.contains('veterinarian') || role.contains('vet') ||
                   role.contains('grooming') || role.contains('boarding');
          })
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
      await ref.update({'likedByUserIds': FieldValue.arrayUnion([userId])});
    } else {
      await ref.update({'likedByUserIds': FieldValue.arrayRemove([userId])});
    }
  }

  Future<void> incrementPostShares(String postId) async {
    await _postsCol.doc(postId).update({'sharesCount': FieldValue.increment(1)});
  }

  Stream<List<CommentModel>> streamComments(String postId) {
    return _postsCol
        .doc(postId)
        .collection('comments')
        .snapshots()
        .map((snap) {
          final list = snap.docs.map((d) => CommentModel.fromMap(d.id, d.data() as Map<String, dynamic>)).toList();
          list.sort((a, b) => a.timestamp.compareTo(b.timestamp));
          return list;
        });
  }

  Future<void> addComment(String postId, CommentModel comment) async {
    await _postsCol.doc(postId).update({'commentsCount': FieldValue.increment(1)});
    await _postsCol
        .doc(postId)
        .collection('comments')
        .doc(comment.commentId)
        .set(comment.toMap());
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
          final list = snap.docs.map((d) => NotificationModel.fromMap(d.id, d.data() as Map<String, dynamic>)).toList();
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
}
