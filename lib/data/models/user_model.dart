enum UserRole {
  petOwner("Pet Owner"),
  veterinarian("Veterinarian"),
  grooming("Grooming"),
  boarding("Boarding"),
  petShop("Pet Shop"),
  shelter("Shelter & Spa"),
  admin("Admin"),
  superAdmin("Super Admin");

  final String displayName;
  const UserRole(this.displayName);

  static UserRole fromString(String? role) {
    if (role == null) return UserRole.petOwner;
    final normalized = role.trim().toLowerCase();
    if (normalized.contains("veterinarian") || normalized.contains("vet")) return UserRole.veterinarian;
    if (normalized.contains("grooming") || normalized.contains("groomer")) return UserRole.grooming;
    if (normalized.contains("boarding")) return UserRole.boarding;
    if (normalized.contains("shelter") || normalized.contains("spa")) return UserRole.shelter;
    if (normalized.contains("shop")) return UserRole.petShop;
    if (normalized.contains("super")) return UserRole.superAdmin;
    if (normalized.contains("admin")) return UserRole.admin;
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
  final bool isSuspended;
  final int joinedTimestamp;
  final List<String> favoriteVetIds;
  final int points;
  final String? referralCode;
  final String? referredBy;
  final String? fcmToken;
  final double? latitude;
  final double? longitude;
  final String? bio;
  final String? specialization;
  final String? clinicName;
  final int? yearsExperience;

  UserModel({
    required this.uid, required this.name, required this.email, this.photoUrl, this.phone, this.address,
    this.role = UserRole.petOwner, this.isVerified = false, this.isSuspended = false, required this.joinedTimestamp,
    this.favoriteVetIds = const [], this.points = 15, this.referralCode, this.referredBy, this.fcmToken,
    this.latitude, this.longitude, this.bio, this.specialization, this.clinicName, this.yearsExperience,
  });

  UserModel copyWith({
    String? uid, String? name, String? email, String? photoUrl, String? phone, String? address,
    UserRole? role, bool? isVerified, bool? isSuspended, int? joinedTimestamp, List<String>? favoriteVetIds,
    int? points, String? referralCode, String? referredBy, String? fcmToken, double? latitude, double? longitude,
    String? bio, String? specialization, String? clinicName, int? yearsExperience,
  }) {
    return UserModel(
      uid: uid ?? this.uid, name: name ?? this.name, email: email ?? this.email, photoUrl: photoUrl ?? this.photoUrl,
      phone: phone ?? this.phone, address: address ?? this.address, role: role ?? this.role,
      isVerified: isVerified ?? this.isVerified, isSuspended: isSuspended ?? this.isSuspended,
      joinedTimestamp: joinedTimestamp ?? this.joinedTimestamp, favoriteVetIds: favoriteVetIds ?? this.favoriteVetIds,
      points: points ?? this.points, referralCode: referralCode ?? this.referralCode, referredBy: referredBy ?? this.referredBy,
      fcmToken: fcmToken ?? this.fcmToken, latitude: latitude ?? this.latitude, longitude: longitude ?? this.longitude,
      bio: bio ?? this.bio, specialization: specialization ?? this.specialization, clinicName: clinicName ?? this.clinicName,
      yearsExperience: yearsExperience ?? this.yearsExperience,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      "uid": uid, "name": name, "email": email, "photoUrl": photoUrl, "phone": phone, "address": address,
      "role": role.name, "isVerified": isVerified, "isSuspended": isSuspended, "joinedTimestamp": joinedTimestamp,
      "favoriteVetIds": favoriteVetIds, "points": points, "referralCode": referralCode, "referredBy": referredBy,
      "fcmToken": fcmToken, "latitude": latitude, "longitude": longitude, "bio": bio, "specialization": specialization,
      "clinicName": clinicName, "yearsExperience": yearsExperience,
    };
  }

  factory UserModel.fromMap(String uid, Map<dynamic, dynamic> map) {
    return UserModel(
      uid: uid, name: map["name"] ?? "User", email: map["email"] ?? "", photoUrl: map["photoUrl"],
      phone: map["phone"], address: map["address"], role: UserRole.fromString(map["role"]),
      isVerified: map["isVerified"] ?? false, isSuspended: map["isSuspended"] ?? false,
      joinedTimestamp: map["joinedTimestamp"] ?? DateTime.now().millisecondsSinceEpoch,
      favoriteVetIds: (map["favoriteVetIds"] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      points: (map["points"] as num?)?.toInt() ?? 15, referralCode: map["referralCode"],
      referredBy: map["referredBy"], fcmToken: map["fcmToken"],
      latitude: (map["latitude"] as num?)?.toDouble(), longitude: (map["longitude"] as num?)?.toDouble(),
      bio: map["bio"], specialization: map["specialization"], clinicName: map["clinicName"],
      yearsExperience: (map["yearsExperience"] as num?)?.toInt(),
    );
  }

  static String generateReferralCode(String uid) {
    final c = uid.replaceAll(RegExp(r"[^a-zA-Z0-9]"), "").toUpperCase();
    return c.length >= 6 ? "PM${c.substring(0, 6)}" : "PM${c.padRight(6, "X")}";
  }
}
