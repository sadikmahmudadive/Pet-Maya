import 'package:firebase_database/firebase_database.dart';
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

class RealtimeDatabaseService {
  static final RealtimeDatabaseService _instance = RealtimeDatabaseService._internal();
  factory RealtimeDatabaseService() => _instance;
  RealtimeDatabaseService._internal();

  final FirebaseDatabase _db = FirebaseDatabase.instance;

  // References
  DatabaseReference get _usersRef => _db.ref('users');
  DatabaseReference get _petsRef => _db.ref('pets');
  DatabaseReference get _productsRef => _db.ref('products');
  DatabaseReference get _ordersRef => _db.ref('orders');
  DatabaseReference get _vetsRef => _db.ref('vets');
  DatabaseReference get _recordsRef => _db.ref('service_records');
  DatabaseReference get _postsRef => _db.ref('community_posts');
  DatabaseReference get _appointmentsRef => _db.ref('appointments');
  DatabaseReference get _reviewsRef => _db.ref('reviews');
  DatabaseReference get _notificationsRef => _db.ref('notifications');

  Map<dynamic, dynamic> _parseSnapshot(dynamic value) {
    if (value == null) return {};
    if (value is List) return value.asMap();
    if (value is Map) return value;
    return {};
  }

  // ─── USER PROFILE ────────────────────────────────────────────────────────

  Future<void> saveUserProfile(app_models.UserModel user) async {
    await _usersRef.child(user.uid).update(user.toMap());
  }

  Future<app_models.UserModel?> fetchUserProfile(String uid) async {
    final snapshot = await _usersRef.child(uid).get();
    if (!snapshot.exists) return null;
    return app_models.UserModel.fromMap(uid, Map<String, dynamic>.from(snapshot.value as Map));
  }

  Future<List<app_models.UserModel>> fetchUsers() async {
    final snapshot = await _usersRef.get();
    if (!snapshot.exists) return [];

    final data = _parseSnapshot(snapshot.value);
    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return app_models.UserModel.fromMap(key, val);
    }).toList();
  }

  // ─── PETS ────────────────────────────────────────────────────────────────

  Future<List<PetModel>> fetchPets(String ownerUID) async {
    DataSnapshot snapshot;
    if (ownerUID.isEmpty) {
      snapshot = await _petsRef.get();
    } else {
      snapshot = await _petsRef.orderByChild('ownerID').equalTo(ownerUID).get();
    }
    
    if (!snapshot.exists) return [];
    final data = _parseSnapshot(snapshot.value);

    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return PetModel.fromMap(key, val);
    }).toList();
  }

  Stream<List<PetModel>> streamPets(String ownerUID) {
    Query query = _petsRef;
    if (ownerUID.isNotEmpty) {
      query = _petsRef.orderByChild('ownerID').equalTo(ownerUID);
    }
    return query.onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return PetModel.fromMap(key, val);
      }).toList();
    });
  }

  Future<void> savePet(PetModel pet) async {
    await _petsRef.child(pet.petID).set(pet.toMap());
  }

  Future<void> deletePet(String petId) async {
    await _petsRef.child(petId).remove();
  }

  // ─── EVENTS ──────────────────────────────────────────────────────────────

  Future<List<EventModel>> fetchEvents(String userId) async {
    DataSnapshot snapshot;
    if (userId.isEmpty) {
      snapshot = await _appointmentsRef.get();
    } else {
      snapshot = await _appointmentsRef.orderByChild('userId').equalTo(userId).get();
    }
    if (!snapshot.exists) return [];
    
    final data = _parseSnapshot(snapshot.value);
    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return EventModel.fromMap(key, val);
    }).toList();
  }

  Stream<List<EventModel>> streamEvents(String userId) {
    Query query = _appointmentsRef;
    if (userId.isNotEmpty) {
      query = _appointmentsRef.orderByChild('userId').equalTo(userId);
    }
    return query.onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return EventModel.fromMap(key, val);
      }).toList();
    });
  }

  Stream<List<EventModel>> streamEventsForProvider(String providerId) {
    return _appointmentsRef.orderByChild('providerId').equalTo(providerId).onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return EventModel.fromMap(key, val);
      }).toList();
    });
  }

  Future<void> saveEvent(EventModel event) async {
    await _appointmentsRef.child(event.id).set(event.toMap());
  }

  // ─── PRODUCTS ────────────────────────────────────────────────────────────

  Future<List<ProductModel>> fetchProducts() async {
    final snapshot = await _productsRef.get();
    if (!snapshot.exists) return [];
    
    final data = _parseSnapshot(snapshot.value);
    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return ProductModel.fromMap(key, val);
    }).toList();
  }

  Future<void> saveProduct(ProductModel product) async {
    await _productsRef.child(product.id).set(product.toMap());
  }

  Future<void> deleteProduct(String productId) async {
    await _productsRef.child(productId).remove();
  }

  // ─── ORDERS ──────────────────────────────────────────────────────────────

  Future<List<OrderModel>> fetchOrders(String userId) async {
    final snapshot = await _ordersRef.orderByChild('userId').equalTo(userId).get();
    if (!snapshot.exists) return [];
    
    final data = _parseSnapshot(snapshot.value);
    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return OrderModel.fromMap(key, val);
    }).toList();
  }

  Future<List<OrderModel>> fetchAllOrders() async {
    final snapshot = await _ordersRef.get();
    if (!snapshot.exists) return [];
    
    final data = _parseSnapshot(snapshot.value);
    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return OrderModel.fromMap(key, val);
    }).toList();
  }

  Stream<List<OrderModel>> streamAllOrders() {
    return _ordersRef.onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return OrderModel.fromMap(key, val);
      }).toList();
    });
  }

  Stream<List<OrderModel>> streamUserOrders(String userId) {
    return _ordersRef.orderByChild('userId').equalTo(userId).onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return OrderModel.fromMap(key, val);
      }).toList();
    });
  }

  Future<void> placeOrder(OrderModel order) async {
    await _ordersRef.child(order.orderId).set(order.toMap());
  }

  // ─── VETS / SERVICE PROVIDERS (Pulling from Users Node) ──────────────────

  Future<List<VetModel>> fetchVets() async {
    final snapshot = await _usersRef.get();
    if (!snapshot.exists) return [];
    
    final data = _parseSnapshot(snapshot.value);
    return data.entries
        .where((e) {
          if (e.value == null) return false;
          final val = e.value as Map;
          final role = val['role']?.toString().toLowerCase() ?? '';
          return role.contains('veterinarian') || role.contains('vet') || 
                 role.contains('grooming') || role.contains('boarding');
        })
        .map((e) => VetModel.fromMap(e.key.toString(), Map<String, dynamic>.from(e.value as Map)))
        .toList();
  }

  Stream<List<VetModel>> streamVets() {
    return _usersRef.onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries
          .where((e) {
            if (e.value == null) return false;
            final val = e.value as Map;
            final role = val['role']?.toString().toLowerCase() ?? '';
            return role.contains('veterinarian') || role.contains('vet') || 
                   role.contains('grooming') || role.contains('boarding');
          })
          .map((e) => VetModel.fromMap(e.key.toString(), Map<String, dynamic>.from(e.value as Map)))
          .toList();
    });
  }

  Future<void> saveVet(VetModel vet) async {
    await _vetsRef.child(vet.id).set(vet.toMap());
  }

  // ─── RECORDS ─────────────────────────────────────────────────────────────

  Future<List<ServiceRecordModel>> fetchAllServiceRecords() async {
    final snapshot = await _recordsRef.get();
    if (!snapshot.exists) return [];
    
    final data = _parseSnapshot(snapshot.value);
    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return ServiceRecordModel.fromMap(key, val);
    }).toList();
  }

  Stream<List<ServiceRecordModel>> streamServiceRecords(String petId) {
    Query query = _recordsRef;
    if (petId.isNotEmpty) {
      query = _recordsRef.orderByChild('petId').equalTo(petId);
    }
    return query.onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return ServiceRecordModel.fromMap(key, val);
      }).toList();
    });
  }

  Future<void> saveServiceRecord(ServiceRecordModel record) async {
    await _recordsRef.child(record.recordId).set(record.toMap());
  }

  // ─── COMMUNITY ───────────────────────────────────────────────────────────

  Stream<List<FeedPostModel>> streamPosts() {
    return _postsRef.onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      return data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return FeedPostModel.fromMap(key, val);
      }).toList();
    });
  }

  Future<void> savePost(FeedPostModel post) async {
    await _postsRef.child(post.postId).set(post.toMap());
  }

  Future<void> togglePostLike(String postId, String userId, bool liked) async {
    final ref = _postsRef.child(postId).child('likedByUserIds');
    final snapshot = await ref.get();
    List<String> likedIds = [];
    if (snapshot.exists) {
      likedIds = List<String>.from(snapshot.value as List);
    }

    if (liked) {
      if (!likedIds.contains(userId)) likedIds.add(userId);
    } else {
      likedIds.remove(userId);
    }
    await ref.set(likedIds);
  }

  Future<void> addComment(String postId, CommentModel comment) async {
    await _postsRef.child(postId).child('comments').child(comment.commentId).set(comment.toMap());
  }

  // ─── REVIEWS ─────────────────────────────────────────────────────────────

  Future<void> saveReview(ReviewModel review) async {
    await _reviewsRef.child(review.id).set(review.toMap());
  }

  Future<List<ReviewModel>> fetchReviews(String targetId) async {
    final snapshot = await _reviewsRef.orderByChild('targetId').equalTo(targetId).get();
    if (!snapshot.exists) return [];

    final data = _parseSnapshot(snapshot.value);
    return data.entries.where((e) => e.value != null).map((e) {
      final key = e.key.toString();
      final val = Map<String, dynamic>.from(e.value as Map);
      return ReviewModel.fromMap(key, val);
    }).toList();
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────────────────────

  Future<void> saveNotification(String userId, NotificationModel notification) async {
    await _notificationsRef.child(userId).child(notification.id).set(notification.toMap());
  }

  Stream<List<NotificationModel>> streamNotifications(String userId) {
    return _notificationsRef.child(userId).onValue.map((event) {
      final data = _parseSnapshot(event.snapshot.value);
      final list = data.entries.where((e) => e.value != null).map((e) {
        final key = e.key.toString();
        final val = Map<String, dynamic>.from(e.value as Map);
        return NotificationModel.fromMap(key, val);
      }).toList();
      
      // Sort newest first
      list.sort((a, b) => b.timestamp.compareTo(a.timestamp));
      return list;
    });
  }

  Future<void> markNotificationAsRead(String userId, String id) async {
    await _notificationsRef.child(userId).child(id).update({'isRead': true});
  }

  Future<void> clearAllNotifications(String userId) async {
    await _notificationsRef.child(userId).remove();
  }
}
