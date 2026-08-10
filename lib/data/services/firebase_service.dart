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
import '../models/user_model.dart' as app_models;

/// FirebaseService handles all Firestore read/write operations.
/// Collections mirror the original Tail Wagging Android database schema.
class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    // Providing the serverClientId from google-services.json for better reliability
    serverClientId: '849611779485-lio20ffads3jjfkppr7fhncs5v17ojue.apps.googleusercontent.com',
  );

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
    await _db.collection('users').doc(user.uid).set(user.toMap(), SetOptions(merge: true));
  }

  Future<app_models.UserModel?> fetchUserProfile(String uid) async {
    final doc = await _db.collection('users').doc(uid).get();
    if (!doc.exists || doc.data() == null) return null;
    return app_models.UserModel.fromMap(uid, doc.data()!);
  }

  // ─── PETS ────────────────────────────────────────────────────────────────

  Future<List<PetModel>> fetchPets(String ownerUID) async {
    final snap = await _db
        .collection('pets')
        .where('ownerID', isEqualTo: ownerUID)
        .orderBy('name')
        .get();
    return snap.docs.map((d) => PetModel.fromMap(d.id, d.data())).toList();
  }

  Stream<List<PetModel>> streamPets(String ownerUID) {
    return _db
        .collection('pets')
        .where('ownerID', isEqualTo: ownerUID)
        .orderBy('name')
        .snapshots()
        .map((snap) => snap.docs.map((d) => PetModel.fromMap(d.id, d.data())).toList());
  }

  Future<void> savePet(PetModel pet) async {
    await _db.collection('pets').doc(pet.petID).set(pet.toMap(), SetOptions(merge: true));
  }

  Future<void> deletePet(String petId) async {
    await _db.collection('pets').doc(petId).delete();
  }

  // ─── EVENTS / CALENDAR ───────────────────────────────────────────────────

  Future<List<EventModel>> fetchEvents(String userId) async {
    final snap = await _db
        .collection('events')
        .where('userId', isEqualTo: userId)
        .orderBy('date')
        .get();
    return snap.docs.map((d) => EventModel.fromMap(d.id, d.data())).toList();
  }

  Stream<List<EventModel>> streamEvents(String userId) {
    return _db
        .collection('events')
        .where('userId', isEqualTo: userId)
        .orderBy('date')
        .snapshots()
        .map((snap) => snap.docs.map((d) => EventModel.fromMap(d.id, d.data())).toList());
  }

  Future<void> saveEvent(EventModel event) async {
    await _db.collection('events').doc(event.id).set(event.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteEvent(String eventId) async {
    await _db.collection('events').doc(eventId).delete();
  }

  // ─── PRODUCTS ────────────────────────────────────────────────────────────

  Future<List<ProductModel>> fetchProducts() async {
    final snap = await _db.collection('products').orderBy('name').get();
    return snap.docs.map((d) => ProductModel.fromMap(d.id, d.data())).toList();
  }

  Stream<List<ProductModel>> streamProducts() {
    return _db
        .collection('products')
        .orderBy('name')
        .snapshots()
        .map((snap) => snap.docs.map((d) => ProductModel.fromMap(d.id, d.data())).toList());
  }

  Future<void> saveProduct(ProductModel product) async {
    await _db.collection('products').doc(product.id).set(product.toMap(), SetOptions(merge: true));
  }

  Future<void> deleteProduct(String productId) async {
    await _db.collection('products').doc(productId).delete();
  }

  Future<void> updateProductStock(String productId, int newStock) async {
    await _db.collection('products').doc(productId).update({'stockQuantity': newStock});
  }

  // ─── ORDERS ──────────────────────────────────────────────────────────────

  Future<List<OrderModel>> fetchOrders(String userId) async {
    final snap = await _db
        .collection('orders')
        .where('userId', isEqualTo: userId)
        .orderBy('timestamp', descending: true)
        .get();
    return snap.docs.map((d) => OrderModel.fromMap(d.id, d.data())).toList();
  }

  /// Fetch ALL orders (for merchant/admin view)
  Future<List<OrderModel>> fetchAllOrders() async {
    final snap = await _db.collection('orders').orderBy('timestamp', descending: true).get();
    return snap.docs.map((d) => OrderModel.fromMap(d.id, d.data())).toList();
  }

  Stream<List<OrderModel>> streamAllOrders() {
    return _db
        .collection('orders')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => OrderModel.fromMap(d.id, d.data())).toList());
  }

  Future<void> placeOrder(OrderModel order) async {
    await _db.collection('orders').doc(order.orderId).set(order.toMap());
  }

  Future<void> updateOrderStatus(String orderId, String newStatus) async {
    await _db.collection('orders').doc(orderId).update({'status': newStatus});
  }

  // ─── VETS / SERVICE PROVIDERS ────────────────────────────────────────────

  Future<List<VetModel>> fetchVets() async {
    final snap = await _db.collection('vets').get();
    return snap.docs.map((d) => VetModel.fromMap(d.id, d.data())).toList();
  }

  Stream<List<VetModel>> streamVets() {
    return _db
        .collection('vets')
        .snapshots()
        .map((snap) => snap.docs.map((d) => VetModel.fromMap(d.id, d.data())).toList());
  }

  Future<void> saveVet(VetModel vet) async {
    await _db.collection('vets').doc(vet.id).set(vet.toMap(), SetOptions(merge: true));
  }

  Future<void> toggleVetVerification(String vetId, bool isVerified) async {
    await _db.collection('vets').doc(vetId).update({'isVerified': isVerified});
  }

  // ─── MEDICAL / SERVICE RECORDS ───────────────────────────────────────────

  Future<List<ServiceRecordModel>> fetchServiceRecords(String petId) async {
    final snap = await _db
        .collection('service_records')
        .where('petId', isEqualTo: petId)
        .orderBy('timestamp', descending: true)
        .get();
    return snap.docs.map((d) => ServiceRecordModel.fromMap(d.id, d.data())).toList();
  }

  Future<List<ServiceRecordModel>> fetchAllServiceRecords() async {
    final snap = await _db
        .collection('service_records')
        .orderBy('timestamp', descending: true)
        .get();
    return snap.docs.map((d) => ServiceRecordModel.fromMap(d.id, d.data())).toList();
  }

  Future<void> saveServiceRecord(ServiceRecordModel record) async {
    await _db.collection('service_records').doc(record.recordId).set(record.toMap(), SetOptions(merge: true));
  }

  // ─── COMMUNITY FEED ──────────────────────────────────────────────────────

  Stream<List<FeedPostModel>> streamPosts() {
    return _db
        .collection('community_posts')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => FeedPostModel.fromMap(d.id, d.data())).toList());
  }

  Future<void> savePost(FeedPostModel post) async {
    await _db.collection('community_posts').doc(post.postId).set(post.toMap(), SetOptions(merge: true));
  }

  Future<void> togglePostLike(String postId, String userId, bool liked) async {
    final ref = _db.collection('community_posts').doc(postId);
    if (liked) {
      await ref.update({'likedByUserIds': FieldValue.arrayUnion([userId])});
    } else {
      await ref.update({'likedByUserIds': FieldValue.arrayRemove([userId])});
    }
  }

  Stream<List<CommentModel>> streamComments(String postId) {
    return _db
        .collection('community_posts')
        .doc(postId)
        .collection('comments')
        .orderBy('timestamp')
        .snapshots()
        .map((snap) => snap.docs.map((d) => CommentModel.fromMap(d.id, d.data())).toList());
  }

  Future<void> addComment(String postId, CommentModel comment) async {
    await _db
        .collection('community_posts')
        .doc(postId)
        .collection('comments')
        .doc(comment.commentId)
        .set(comment.toMap());
  }
}
