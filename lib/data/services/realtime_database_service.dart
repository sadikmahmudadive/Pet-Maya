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
  DatabaseReference get _eventsRef => _db.ref('events'); // Corrected path
  DatabaseReference get _reviewsRef => _db.ref('reviews');
  DatabaseReference get _notificationsRef => _db.ref('notifications');
  DatabaseReference get _commentsRef => _db.ref('comments');

  /// Initialize offline capabilities for critical data nodes
  Future<void> enableOfflineSync(String userId) async {
    // Enable disk persistence if not already enabled via native code
    // Note: On some platforms, this must be called before any other DB usage.
    // _db.setPersistenceEnabled(true); 

    // Requirement: Global persistence for shared nodes
    await _productsRef.keepSynced(true);
    await _vetsRef.keepSynced(true);
    await _postsRef.keepSynced(true);

    // Requirement: Critical user nodes are always available and updated
    if (userId.isNotEmpty) {
      await _usersRef.child(userId).keepSynced(true);
      // Synchronize all pets for this owner explicitly
      await _petsRef.orderByChild('ownerID').equalTo(userId).ref.keepSynced(true);
      await _notificationsRef.child(userId).keepSynced(true);
    }
  }

  /// Purge all user data from RTDB
  Future<void> deleteUserData(String userId) async {
    // 1. Delete user profile
    await _usersRef.child(userId).remove();

    // 2. Delete user's pets
    final petsSnapshot = await _petsRef.orderByChild('ownerID').equalTo(userId).get();
    if (petsSnapshot.exists) {
      final data = _parseSnapshot(petsSnapshot.value);
      for (var petId in data.keys) {
        await _petsRef.child(petId.toString()).remove();
      }
    }

    // 3. Delete user's events
    await _eventsRef.child(userId).remove();

    // 4. Delete user's notifications
    await _notificationsRef.child(userId).remove();

    // 5. Delete user's orders
    final ordersSnapshot = await _ordersRef.orderByChild('userId').equalTo(userId).get();
    if (ordersSnapshot.exists) {
      final data = _parseSnapshot(ordersSnapshot.value);
      for (var orderId in data.keys) {
        await _ordersRef.child(orderId.toString()).remove();
      }
    }
  }

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

  // ─── EVENTS & CALENDAR ──────────────────────────────────────────────────

  Future<List<EventModel>> fetchEvents(String userId) async {
    if (userId.isEmpty) {
      // Admin view: fetch all events
      final snapshot = await _eventsRef.get();
      if (!snapshot.exists) return [];
      return _parseEventsFromDeepMap(snapshot.value);
    } else {
      // User view: fetch only their events
      final snapshot = await _eventsRef.child(userId).get();
      if (!snapshot.exists) return [];
      return _parseEventsFromDateNestedMap(snapshot.value);
    }
  }

  Stream<List<EventModel>> streamEvents(String userId) {
    if (userId.isEmpty) return Stream.value([]);
    return _eventsRef.child(userId).onValue.map((event) {
      return _parseEventsFromDateNestedMap(event.snapshot.value);
    });
  }

  /// Parses events from events/{userId}/{date}/{eventId}
  List<EventModel> _parseEventsFromDateNestedMap(dynamic value) {
    if (value == null) return [];
    final List<EventModel> events = [];
    final dateMap = _parseSnapshot(value);
    
    for (var dateEntry in dateMap.entries) {
      final eventsForDate = _parseSnapshot(dateEntry.value);
      for (var eventEntry in eventsForDate.entries) {
        if (eventEntry.value != null) {
          events.add(EventModel.fromMap(
            eventEntry.key.toString(), 
            Map<String, dynamic>.from(eventEntry.value as Map)
          ));
        }
      }
    }
    return events;
  }

  /// Parses events from events/{userId}/{date}/{eventId} where userId is also a key
  List<EventModel> _parseEventsFromDeepMap(dynamic value) {
    if (value == null) return [];
    final List<EventModel> allEvents = [];
    final userMap = _parseSnapshot(value);
    for (var userEntry in userMap.entries) {
      allEvents.addAll(_parseEventsFromDateNestedMap(userEntry.value));
    }
    return allEvents;
  }

  Stream<List<EventModel>> streamEventsForProvider(String providerId) {
    // Note: Cross-user queries are harder with date nesting. 
    // We stream all for now and filter locally, or would need a flat 'index' node.
    return _eventsRef.onValue.map((event) {
      final all = _parseEventsFromDeepMap(event.snapshot.value);
      return all.where((e) => e.providerId == providerId).toList();
    });
  }

  Future<void> saveEvent(EventModel event) async {
    final dateKey = event.date.toIso8601String().substring(0, 10); // yyyy-MM-dd
    await _eventsRef
        .child(event.userId)
        .child(dateKey)
        .child(event.id)
        .set(event.toMap());
  }

  Future<void> deleteEvent(String userId, DateTime date, String eventId) async {
    final dateKey = date.toIso8601String().substring(0, 10);
    await _eventsRef.child(userId).child(dateKey).child(eventId).remove();
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
          final email = val['email']?.toString().toLowerCase() ?? '';
          final name = val['name']?.toString().toLowerCase() ?? '';
          
          // Filter out test/dummy profiles
          if (email.contains('test') || email.contains('example') || 
              name.contains('test') || name.contains('demo')) return false;

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
            final email = val['email']?.toString().toLowerCase() ?? '';
            final name = val['name']?.toString().toLowerCase() ?? '';

            // Filter out test/dummy profiles
            if (email.contains('test') || email.contains('example') || 
                name.contains('test') || name.contains('demo')) return false;

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
    // Increment commentsCount transactionally in the post node
    await _postsRef.child(postId).child('commentsCount').runTransaction((Object? count) {
      if (count == null) return Transaction.success(1);
      return Transaction.success((count as int) + 1);
    });
    
    // Save to the dedicated top-level comments node (matching your DB structure)
    await _commentsRef.child(postId).child(comment.commentId).set(comment.toMap());
  }

  Stream<List<CommentModel>> streamComments(String postId) {
    return _commentsRef.child(postId).onValue.map((event) {
      final value = event.snapshot.value;
      if (value == null) return [];
      
      final data = _parseSnapshot(value);
      return data.entries.where((e) => e.value != null).map((e) {
        return CommentModel.fromMap(e.key.toString(), Map<String, dynamic>.from(e.value as Map));
      }).toList()..sort((a, b) => a.timestamp.compareTo(b.timestamp));
    });
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

  Future<void> removeNotification(String userId, String id) async {
    await _notificationsRef.child(userId).child(id).remove();
  }

  Future<void> clearAllNotifications(String userId) async {
    await _notificationsRef.child(userId).remove();
  }
}
