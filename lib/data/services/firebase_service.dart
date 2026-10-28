import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';

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
import '../models/coupon_model.dart';
import '../models/promo_model.dart';
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
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    clientId: (!kIsWeb && Platform.isIOS)
        ? '335402911476-q0ibcv1sfoli6tg8l9j63ghp9iq71bfj.apps.googleusercontent.com'
        : null,
    serverClientId:
        '335402911476-29mje5mt1utr9ttpkecf1gc8dsev2rgu.apps.googleusercontent.com',
  );

  void _initPersistence() {
    try {
      _db.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );
      debugPrint(
        '[FirebaseService] Firestore offline persistence initialized (unlimited cache).',
      );
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
  CollectionReference get _couponsCol => _db.collection('coupons');
  CollectionReference get _promosCol => _db.collection('promos');

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
        debugPrint(
          "[FirebaseService] Google Play Services sign-in attempt failed: $playServicesError",
        );
        // Secondary Attempt: Auto-configured GoogleSignIn without hardcoded serverClientId
        try {
          final fallbackSignIn = GoogleSignIn(
            clientId: (!kIsWeb && Platform.isIOS)
                ? '335402911476-q0ibcv1sfoli6tg8l9j63ghp9iq71bfj.apps.googleusercontent.com'
                : null,
          );
          await fallbackSignIn.signOut().catchError((_) => null);
          googleUser = await fallbackSignIn.signIn();
        } catch (fallbackError) {
          debugPrint(
            "[FirebaseService] Fallback GoogleSignIn also failed: $fallbackError",
          );
        }
      }

      if (googleUser != null) {
        final GoogleSignInAuthentication googleAuth =
            await googleUser.authentication;
        final OAuthCredential credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );
        return await _auth.signInWithCredential(credential);
      }

      // 2. Resilient Fallback: Direct Firebase Google Auth Provider
      // This bypasses Google Play Services SHA-1 signature mismatch errors on Closed Testing builds
      debugPrint(
        "[FirebaseService] Attempting Firebase OAuth Provider flow for Google...",
      );
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

  // ─── STORAGE ─────────────────────────────────────────────────────────────

  Future<String> uploadFile({
    required String path,
    required File file,
    String? contentType,
  }) async {
    final ref = _storage.ref().child(path);
    final metadata = SettableMetadata(contentType: contentType);
    final uploadTask = ref.putFile(file, metadata);
    final snapshot = await uploadTask;
    return await snapshot.ref.getDownloadURL();
  }

  // ─── USER PROFILE ────────────────────────────────────────────────────────

  /// Fields only admins or Cloud Functions may change (see firestore.rules).
  static const _serverControlledUserFields = [
    'isVerified',
    'isSuspended',
    'referredBy',
    'points',
    'role',
  ];

  /// First write of a new account's profile (role chosen at sign-up,
  /// unverified, starter points).
  Future<void> createUserProfile(app_models.UserModel user) async {
    final data = user.toMap()
      ..['isVerified'] = false
      ..['isSuspended'] = false
      ..remove('referredBy');
    await _usersCol.doc(user.uid).set(data, SetOptions(merge: true));
  }

  /// Saves profile edits. The signed-in user's own saves skip fields only
  /// admins/functions may change; pass [asAdmin] for admin tools that manage
  /// other accounts (verification, suspension, role).
  Future<void> saveUserProfile(
    app_models.UserModel user, {
    bool asAdmin = false,
  }) async {
    final data = user.toMap();
    if (!asAdmin) {
      for (final f in _serverControlledUserFields) {
        data.remove(f);
      }
    }
    await _usersCol.doc(user.uid).set(data, SetOptions(merge: true));
  }

  Future<app_models.UserModel?> fetchUserProfile(String uid) async {
    final doc = await _usersCol.doc(uid).get();
    if (!doc.exists || doc.data() == null) return null;
    return app_models.UserModel.fromMap(
      uid,
      doc.data()! as Map<String, dynamic>,
    );
  }

  /// Name, photo and role of another user (public_profiles, kept in sync by
  /// the sync_public_profile function). Contains no contact details.
  Future<app_models.UserModel?> fetchPublicProfile(String uid) async {
    final doc = await _db.collection('public_profiles').doc(uid).get();
    final data = doc.data();
    if (!doc.exists || data == null) return null;
    return app_models.UserModel.fromMap(uid, {
      'name': data['name'],
      'photoUrl': data['photoUrl'],
      'role': data['role'],
      'isVerified': data['isVerified'] == true,
    });
  }

  Stream<app_models.UserModel?> streamUserProfile(String uid) {
    return _usersCol.doc(uid).snapshots().map((doc) {
      if (!doc.exists || doc.data() == null) return null;
      return app_models.UserModel.fromMap(
        uid,
        doc.data()! as Map<String, dynamic>,
      );
    });
  }

  Future<List<app_models.UserModel>> fetchUsers() async {
    final snap = await _usersCol.get();
    return snap.docs
        .map(
          (d) => app_models.UserModel.fromMap(
            d.id,
            d.data()! as Map<String, dynamic>,
          ),
        )
        .toList();
  }

  Stream<List<app_models.UserModel>> streamAllUsers() {
    return _usersCol.snapshots().map(
      (snap) => snap.docs
          .map(
            (d) => app_models.UserModel.fromMap(
              d.id,
              d.data()! as Map<String, dynamic>,
            ),
          )
          .toList(),
    );
  }

  Future<List<app_models.UserModel>> fetchUsersByRole(String role) async {
    final snap = await _usersCol.where('role', isEqualTo: role).get();
    return snap.docs
        .map(
          (d) => app_models.UserModel.fromMap(
            d.id,
            d.data()! as Map<String, dynamic>,
          ),
        )
        .toList();
  }

  /// Applies a referral code for the signed-in user. The referrer's +5 points
  /// are credited by the `apply_referral` Cloud Function (clients can't write
  /// other users' documents), once per account.
  Future<({bool success, String? errorMessage})> applyReferralCode({
    required String userUid,
    required String code,
  }) async {
    final normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.isEmpty) {
      return (success: false, errorMessage: 'Referral code cannot be empty');
    }
    try {
      await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('apply_referral')
          .call({'code': normalizedCode});
      return (success: true, errorMessage: null);
    } on FirebaseFunctionsException catch (e) {
      return (
        success: false,
        errorMessage: e.message ?? 'Failed to apply referral code',
      );
    } catch (e) {
      debugPrint('[FirebaseService] applyReferralCode error: $e');
      return (success: false, errorMessage: 'Failed to apply referral code');
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
    final eventsSnap = await _eventsCol
        .where('userId', isEqualTo: userId)
        .get();
    for (var doc in eventsSnap.docs) {
      await doc.reference.delete();
    }

    // 4. Delete user's notifications
    final notifsSnap = await _notificationsCol
        .doc(userId)
        .collection('items')
        .get();
    for (var doc in notifsSnap.docs) {
      await doc.reference.delete();
    }
    await _notificationsCol.doc(userId).delete();

    // 5. Delete user's orders
    final ordersSnap = await _ordersCol
        .where('userId', isEqualTo: userId)
        .get();
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
    return snap.docs
        .map((d) => PetModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
        .toList();
  }

  Stream<List<PetModel>> streamPets(String ownerUID) {
    Query query = _petsCol;
    if (ownerUID.isNotEmpty) {
      query = _petsCol.where('ownerID', isEqualTo: ownerUID);
    }
    return query.snapshots().map(
      (snap) => snap.docs
          .map((d) => PetModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
          .toList(),
    );
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
    return snap.docs
        .map((d) => EventModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
        .toList();
  }

  Stream<List<EventModel>> streamEvents(String userId) {
    if (userId.isEmpty) return Stream.value([]);
    return _eventsCol
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map(
          (snap) => snap.docs
              .map(
                (d) =>
                    EventModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
              )
              .toList(),
        );
  }

  Stream<List<EventModel>> streamEventsForProvider(String providerId) {
    return _eventsCol
        .where('providerId', isEqualTo: providerId)
        .snapshots()
        .map(
          (snap) => snap.docs
              .map(
                (d) =>
                    EventModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
              )
              .toList(),
        );
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
    return snap.docs
        .map(
          (d) => ProductModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
        )
        .toList();
  }

  Stream<List<ProductModel>> streamProducts() {
    return _productsCol.snapshots().map(
      (snap) => snap.docs
          .map(
            (d) =>
                ProductModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
          )
          .toList(),
    );
  }

  Future<void> saveProduct(ProductModel product) async {
    await _productsCol
        .doc(product.id)
        .set(product.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteProduct(String productId) async {
    await _productsCol.doc(productId).delete();
  }

  Future<void> updateProductStock(String productId, int newStock) async {
    await _productsCol.doc(productId).update({'stockQuantity': newStock});
  }

  // ─── ORDERS ──────────────────────────────────────────────────────────────

  Future<List<OrderModel>> fetchOrders(String userId) async {
    final snap = await _ordersCol.where('userId', isEqualTo: userId).get();
    final list = snap.docs
        .map((d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
        .toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Future<List<OrderModel>> fetchAllOrders() async {
    final snap = await _ordersCol.get();
    final list = snap.docs
        .map((d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>))
        .toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Stream<List<OrderModel>> streamAllOrders() {
    return _ordersCol.snapshots().map((snap) {
      final list = snap.docs
          .map(
            (d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
          )
          .toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  Stream<List<OrderModel>> streamUserOrders(String userId) {
    return _ordersCol.where('userId', isEqualTo: userId).snapshots().map((
      snap,
    ) {
      final list = snap.docs
          .map(
            (d) => OrderModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
          )
          .toList();
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
        .map(
          (doc) =>
              VetModel.fromMap(doc.id, doc.data()! as Map<String, dynamic>),
        )
        .toList();
  }

  Stream<List<VetModel>> streamVets() {
    return _vetsCol.snapshots().map((snap) {
      return snap.docs
          .map(
            (doc) =>
                VetModel.fromMap(doc.id, doc.data()! as Map<String, dynamic>),
          )
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
    final list = snap.docs
        .map(
          (d) => ServiceRecordModel.fromMap(
            d.id,
            d.data()! as Map<String, dynamic>,
          ),
        )
        .toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Future<List<ServiceRecordModel>> fetchAllServiceRecords() async {
    final snap = await _recordsCol.get();
    final list = snap.docs
        .map(
          (d) => ServiceRecordModel.fromMap(
            d.id,
            d.data()! as Map<String, dynamic>,
          ),
        )
        .toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Stream<List<ServiceRecordModel>> streamServiceRecords(String petId) {
    Query query = _recordsCol;
    if (petId.isNotEmpty) {
      query = _recordsCol.where('petId', isEqualTo: petId);
    }
    return query.snapshots().map((snap) {
      final list = snap.docs
          .map(
            (d) => ServiceRecordModel.fromMap(
              d.id,
              d.data()! as Map<String, dynamic>,
            ),
          )
          .toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  /// Records of the owner's pets (firestore.rules matches on ownerId).
  Stream<List<ServiceRecordModel>> streamServiceRecordsForOwner(String ownerId) {
    return _recordsCol.where('ownerId', isEqualTo: ownerId).snapshots().map((
      snap,
    ) {
      final list = snap.docs
          .map(
            (d) => ServiceRecordModel.fromMap(
              d.id,
              d.data()! as Map<String, dynamic>,
            ),
          )
          .toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  /// Owners may only flip sharing on their records (not edit clinical data).
  Future<void> setRecordSharing(String recordId, bool isShared) async {
    await _recordsCol.doc(recordId).update({'isSharedWithVets': isShared});
  }

  Future<void> saveServiceRecord(ServiceRecordModel record) async {
    await _recordsCol
        .doc(record.recordId)
        .set(record.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteServiceRecord(String recordId, {String? reportUrl}) async {
    // 1. Delete PDF from Storage if exists
    if (reportUrl != null && reportUrl.isNotEmpty) {
      try {
        final ref = _storage.refFromURL(reportUrl);
        await ref.delete();
      } catch (e) {
        debugPrint('[FirebaseService] Error deleting report file: $e');
      }
    }
    // 2. Delete document from Firestore
    await _recordsCol.doc(recordId).delete();
  }

  // ─── COMMUNITY FEED ──────────────────────────────────────────────────────

  Stream<List<FeedPostModel>> streamPosts() {
    return _postsCol.snapshots().map((snap) {
      final list = snap.docs
          .map(
            (d) =>
                FeedPostModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
          )
          .toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  Future<({bool success, String verdict, String message, String? id})> submitPost(
    FeedPostModel post, {
    String? category,
    bool isAmberAlert = false,
    String? petName,
    String? petBreed,
    String? location,
    String? contactPhone,
    String? microchipId,
  }) async {
    try {
      final res = await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('submit_post')
          .call({
            'postId': post.postId,
            'content': post.content,
            'postType': post.postType,
            'category': category ?? post.postType,
            'imageUrl': post.imageUrl,
            'sharedPostId': post.sharedPostId,
            'sharedPostAuthor': post.sharedPostAuthor,
            'sharedPostContent': post.sharedPostContent,
            'sharedPostImageUrl': post.sharedPostImageUrl,
            'isAmberAlert': isAmberAlert,
            'petName': petName,
            'petBreed': petBreed,
            'location': location,
            'contactPhone': contactPhone,
            'microchipId': microchipId,
          });
      final data = Map<String, dynamic>.from(res.data as Map);
      final ok = data['ok'] == true;
      final verdict = (data['verdict'] ?? (ok ? 'approve' : 'reject')).toString();
      final msg = (data['message'] ?? (ok ? 'Post published!' : 'Post rejected.')).toString();
      return (success: ok, verdict: verdict, message: msg, id: data['postId']?.toString());
    } on FirebaseFunctionsException catch (e) {
      return (success: false, verdict: 'reject', message: e.message ?? 'Submission rejected.', id: null);
    } catch (e) {
      debugPrint('[FirebaseService] submitPost error: $e');
      return (success: false, verdict: 'reject', message: 'Failed to submit post. Please try again.', id: null);
    }
  }

  Future<void> savePost(FeedPostModel post) async {
    await submitPost(post);
  }

  Future<({bool success, String verdict, String message, String? id})> submitComment({
    required String postId,
    required String text,
    String? commentId,
  }) async {
    try {
      final res = await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('submit_comment')
          .call({
            'postId': postId,
            'text': text,
            'commentId': commentId,
          });
      final data = Map<String, dynamic>.from(res.data as Map);
      final ok = data['ok'] == true;
      final verdict = (data['verdict'] ?? (ok ? 'approve' : 'reject')).toString();
      final msg = (data['message'] ?? (ok ? 'Comment added!' : 'Comment rejected.')).toString();
      return (success: ok, verdict: verdict, message: msg, id: data['commentId']?.toString());
    } on FirebaseFunctionsException catch (e) {
      return (success: false, verdict: 'reject', message: e.message ?? 'Comment rejected.', id: null);
    } catch (e) {
      debugPrint('[FirebaseService] submitComment error: $e');
      return (success: false, verdict: 'reject', message: 'Failed to add comment. Please try again.', id: null);
    }
  }

  Future<({bool success, String message})> reportContent({
    required String targetId,
    String targetType = 'post',
    String? commentId,
    String reason = 'Inappropriate content',
  }) async {
    try {
      final res = await FirebaseFunctions.instanceFor(region: 'us-central1')
          .httpsCallable('report_content')
          .call({
            'targetId': targetId,
            'targetType': targetType,
            'commentId': commentId,
            'reason': reason,
          });
      final data = Map<String, dynamic>.from(res.data as Map);
      return (
        success: data['ok'] == true,
        message: 'Report submitted. Thank you for keeping our community safe.',
      );
    } catch (e) {
      return (success: false, message: 'Could not submit report.');
    }
  }

  Future<void> togglePostLike(String postId, String userId, bool liked) async {
    await togglePostReaction(postId, userId, 'Like', liked, true);
  }

  Future<void> togglePostReaction(
    String postId,
    String userId,
    String reactionType,
    bool isReacted,
    bool isNewReaction,
  ) async {
    if (userId.isEmpty || userId == 'guest') return;
    final ref = _postsCol.doc(postId);
    if (isReacted) {
      final Map<String, dynamic> updateData = {
        'likedByUserIds': FieldValue.arrayUnion([userId]),
        'likedBy': {userId: true},
        'userReactions': {userId: reactionType},
        // Clean up legacy dotted field if present
        'userReactions.$userId': FieldValue.delete(),
      };
      if (isNewReaction) {
        updateData['likesCount'] = FieldValue.increment(1);
        updateData['likes'] = FieldValue.increment(1);
      }
      await ref.set(updateData, SetOptions(merge: true));
    } else {
      await ref.set({
        'likesCount': FieldValue.increment(-1),
        'likes': FieldValue.increment(-1),
        'likedByUserIds': FieldValue.arrayRemove([userId]),
        'likedBy': {userId: false},
        'userReactions': {userId: FieldValue.delete()},
        'userReactions.$userId': FieldValue.delete(),
      }, SetOptions(merge: true));
    }
  }

  Future<void> incrementPostShares(String postId) async {
    await _postsCol.doc(postId).set({
      'sharesCount': FieldValue.increment(1),
    }, SetOptions(merge: true));
  }

  Stream<List<CommentModel>> streamComments(String postId) {
    return _postsCol.doc(postId).collection('comments').snapshots().map((snap) {
      final list = snap.docs
          .map((d) => CommentModel.fromMap(d.id, d.data()))
          .toList();
      list.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      return list;
    });
  }

  Future<void> addComment(String postId, CommentModel comment) async {
    await submitComment(
      postId: postId,
      text: comment.text,
      commentId: comment.commentId,
    );
  }

  // ─── REVIEWS ─────────────────────────────────────────────────────────────

  Future<void> saveReview(ReviewModel review) async {
    await _reviewsCol
        .doc(review.id)
        .set(review.toMap(), SetOptions(merge: true));
  }

  Future<List<ReviewModel>> fetchReviews(String targetId) async {
    final snap = await _reviewsCol.where('targetId', isEqualTo: targetId).get();
    return snap.docs
        .map(
          (d) => ReviewModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
        )
        .toList();
  }

  Stream<List<ReviewModel>> streamReviews(String targetId) {
    return _reviewsCol
        .where('targetId', isEqualTo: targetId)
        .snapshots()
        .map(
          (snap) => snap.docs
              .map(
                (d) => ReviewModel.fromMap(
                  d.id,
                  d.data()! as Map<String, dynamic>,
                ),
              )
              .toList(),
        );
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

  Future<void> saveNotification(
    String userId,
    NotificationModel notification,
  ) async {
    await _notificationsCol
        .doc(userId)
        .collection('items')
        .doc(notification.id)
        .set(notification.toMap(), SetOptions(merge: true));
  }

  Stream<List<NotificationModel>> streamNotifications(String userId) {
    return _notificationsCol.doc(userId).collection('items').snapshots().map((
      snap,
    ) {
      final list = snap.docs
          .map((d) => NotificationModel.fromMap(d.id, d.data()))
          .toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  Future<void> markNotificationAsRead(String userId, String id) async {
    await _notificationsCol.doc(userId).collection('items').doc(id).update({
      'isRead': true,
    });
  }

  Future<void> removeNotification(String userId, String id) async {
    await _notificationsCol.doc(userId).collection('items').doc(id).delete();
  }

  /// Deletes every notification of [userId]. Works through them in batches of 400 (a batch holds at most 500
  /// writes), so even thousands of notifications are removed in a few round trips instead of one request each.
  Future<void> clearAllNotifications(String userId) async {
    final items = _notificationsCol.doc(userId).collection('items');
    while (true) {
      final snap = await items.limit(400).get();
      if (snap.docs.isEmpty) return;
      final batch = _db.batch();
      for (final doc in snap.docs) {
        batch.delete(doc.reference);
      }
      await batch.commit();
      if (snap.docs.length < 400) return;
    }
  }

  // ─── BLOGS ──────────────────────────────────────────────────────────────

  /// Articles are parsed newest first. Documents without a timestamp keep their place at the end.
  List<BlogPostModel> _parseBlogs(QuerySnapshot<Object?> snap) {
    final list = snap.docs
        .map(
          (d) => BlogPostModel.fromMap(d.id, d.data()! as Map<String, dynamic>),
        )
        .toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  /// The blog feed. Everyone except admins may only read approved articles (the security rules refuse any other
  /// query), so this asks for exactly that: the newest [limit] approved posts. Admins stream everything so the
  /// moderation screen can see pending and rejected posts.
  ///
  /// The approved query is ordered by time, which needs the composite index in firestore.indexes.json. If that has
  /// not been deployed yet the ordered query fails with `failed-precondition`; the plain approved query is used
  /// instead and sorted here, so the blog keeps working either way.
  Stream<List<BlogPostModel>> streamBlogs({bool all = false, int limit = 50}) async* {
    if (all) {
      await for (final snap in _blogsCol.limit(500).snapshots()) {
        yield _parseBlogs(snap);
      }
      return;
    }
    final approved = _blogsCol.where('isApproved', isEqualTo: true);
    try {
      await for (final snap in approved
          .orderBy('timestamp', descending: true)
          .limit(limit)
          .snapshots()) {
        yield _parseBlogs(snap);
      }
    } on FirebaseException catch (e) {
      if (e.code != 'failed-precondition') rethrow;
      debugPrint('[FirebaseService] blogs index missing, using unordered query');
      await for (final snap in approved.limit(limit).snapshots()) {
        yield _parseBlogs(snap);
      }
    }
  }

  Future<void> saveBlog(BlogPostModel blog) async {
    await _blogsCol.doc(blog.id).set(blog.toMap(), SetOptions(merge: true));
  }

  Future<void> updateBlogStatus(
    String blogId,
    String status,
    bool isApproved,
  ) async {
    await _blogsCol.doc(blogId).set({
      'status': status,
      'isApproved': isApproved,
    }, SetOptions(merge: true));
  }

  Future<void> deleteBlog(String blogId) async {
    await _blogsCol.doc(blogId).delete();
  }

  // ─── COUPONS ────────────────────────────────────────────────────────────

  Future<List<CouponModel>> fetchCoupons() async {
    final snap = await _couponsCol.get();
    return snap.docs
        .map((d) => CouponModel.fromMap(d.data()! as Map<String, dynamic>))
        .toList();
  }

  Stream<List<CouponModel>> streamCoupons() {
    return _couponsCol.snapshots().map(
      (snap) => snap.docs
          .map((d) => CouponModel.fromMap(d.data()! as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<void> saveCoupon(CouponModel coupon) async {
    await _couponsCol
        .doc(coupon.code)
        .set(coupon.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteCoupon(String code) async {
    await _couponsCol.doc(code).delete();
  }

  // ─── PROMOS ─────────────────────────────────────────────────────────────

  Future<List<PromoModel>> fetchPromos() async {
    final snap = await _promosCol.get();
    final list = snap.docs
        .map((d) => PromoModel.fromMap(d.data()! as Map<String, dynamic>))
        .toList();
    list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
    return list;
  }

  Stream<List<PromoModel>> streamPromos() {
    return _promosCol.snapshots().map((snap) {
      final list = snap.docs
          .map((d) => PromoModel.fromMap(d.data()! as Map<String, dynamic>))
          .toList();
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  Future<void> savePromo(PromoModel promo) async {
    await _promosCol.doc(promo.id).set(promo.toMap(), SetOptions(merge: true));
  }

  Future<void> deletePromo(String promoId) async {
    await _promosCol.doc(promoId).delete();
  }

  // ─── GLOBAL SETTINGS ────────────────────────────────────────────────────

  Future<void> saveGlobalSetting(String key, dynamic value) async {
    await _db.collection('settings').doc('global').set({
      key: value,
    }, SetOptions(merge: true));
  }

  Stream<DocumentSnapshot> streamGlobalSettings() {
    return _db.collection('settings').doc('global').snapshots();
  }
}
