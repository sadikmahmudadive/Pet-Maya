enum UserRole {
  petOwner('Pet Owner'),
  veterinarian('Veterinarian'),
  grooming('Grooming'),
  boarding('Boarding'),
  petShop('Pet Shop'),
  admin('Admin');

  final String displayName;
  const UserRole(this.displayName);

  static UserRole fromString(String? role) {
    if (role == null) return UserRole.petOwner;
    final normalized = role.trim().toLowerCase();
    if (normalized.contains('veterinarian') || normalized.contains('vet')) {
      return UserRole.veterinarian;
    } else if (normalized.contains('grooming') || normalized.contains('groomer')) {
      return UserRole.grooming;
    } else if (normalized.contains('boarding')) {
      return UserRole.boarding;
    } else if (normalized.contains('shop')) {
      return UserRole.petShop;
    } else if (normalized.contains('admin')) {
      return UserRole.admin;
    }
    return UserRole.petOwner;
  }
}

class UserModel {
  final String uid;
  final String name;
  final String email;
  final String? photoUrl;
  final String? phone;
  final String? address;
  final UserRole role;
  final bool isVerified;
  final List<String> favoriteVetIds;
  final int points;
  final String? referralCode;
  final String? fcmToken;
  final double? latitude;
  final double? longitude;

  UserModel({
    required this.uid,
    required this.name,
    required this.email,
    this.photoUrl,
    this.phone,
    this.address,
    this.role = UserRole.petOwner,
    this.isVerified = false,
    this.favoriteVetIds = const [],
    this.points = 0,
    this.referralCode,
    this.fcmToken,
    this.latitude,
    this.longitude,
  });

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'name': name,
      'email': email,
      'photoUrl': photoUrl,
      'phone': phone,
      'address': address,
      'role': role.displayName,
      'isVerified': isVerified,
      'favoriteVetIds': favoriteVetIds,
      'points': points,
      'referralCode': referralCode,
      'fcmToken': fcmToken,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory UserModel.fromMap(String uid, Map<dynamic, dynamic> map) {
    return UserModel(
      uid: uid,
      name: map['name'] ?? 'User',
      email: map['email'] ?? '',
      photoUrl: map['photoUrl'],
      phone: map['phone'],
      address: map['address'],
      role: UserRole.fromString(map['role']),
      isVerified: map['isVerified'] ?? false,
      favoriteVetIds: (map['favoriteVetIds'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      points: (map['points'] as num?)?.toInt() ?? 0,
      referralCode: map['referralCode'],
      fcmToken: map['fcmToken'],
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
    );
  }
}
