class VetModel {
  final String id;
  final String name;
  final String qualification;
  final double rating;
  final int reviewsCount;
  final String tag; // Veterinarian, Grooming, Boarding
  final String distance;
  final String price;
  final String phone;
  final String experience;
  final String? photoUrl;
  final String businessHours;
  final String bio;
  final bool isVerified;
  final double? latitude;
  final double? longitude;

  VetModel({
    required this.id,
    required this.name,
    required this.qualification,
    this.rating = 0.0,
    this.reviewsCount = 0,
    required this.tag,
    this.distance = '1.2 km',
    this.price = '৳35/visit',
    this.phone = '+1 (555) 234-5678',
    this.experience = '8 Years',
    this.photoUrl,
    this.businessHours = 'Mon - Fri: 8:00 AM - 6:00 PM',
    this.bio = 'Dedicated and caring veterinary specialist providing top-notch healthcare, surgeries, and routine checkups for pets.',
    this.isVerified = true,
    this.latitude,
    this.longitude,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'qualification': qualification,
      'rating': rating,
      'reviewsCount': reviewsCount,
      'tag': tag,
      'distance': distance,
      'price': price,
      'phone': phone,
      'experience': experience,
      'photoUrl': photoUrl,
      'businessHours': businessHours,
      'bio': bio,
      'isVerified': isVerified,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory VetModel.fromMap(String id, Map<dynamic, dynamic> map) {
    double rawRating = (map['rating'] as num?)?.toDouble() ?? 0.0;
    int rawCount = (map['reviewsCount'] as num?)?.toInt() ?? 0;

    // Truth Logic: Purge legacy hardcoded template values (4.8 rating / 120 reviews)
    if (rawRating == 4.8 && rawCount == 120) {
      rawRating = 0.0;
      rawCount = 0;
    }

    return VetModel(
      id: id,
      name: map['name'] ?? '',
      qualification: map['qualification'] ?? 'Pet Care Specialist',
      rating: rawRating,
      reviewsCount: rawCount,
      tag: map['role'] ?? map['tag'] ?? 'Veterinarian',
      distance: map['distance'] ?? 'Nearby',
      price: map['price'] ?? '৳30',
      phone: map['phone'] ?? '',
      experience: map['experience']?.toString() ?? '5 Years',
      photoUrl: map['photoUrl'] ?? map['imageUrl'],
      businessHours: map['businessHours'] ?? 'Mon - Fri: 9 AM - 6 PM',
      bio: map['bio'] ?? 'Experienced pet care professional dedicated to your pet\'s health.',
      isVerified: map['isVerified'] ?? false,
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
    );
  }

  VetModel copyWith({
    String? id,
    String? name,
    String? qualification,
    double? rating,
    int? reviewsCount,
    String? tag,
    String? distance,
    String? price,
    String? phone,
    String? experience,
    String? photoUrl,
    String? businessHours,
    String? bio,
    bool? isVerified,
    double? latitude,
    double? longitude,
  }) {
    return VetModel(
      id: id ?? this.id,
      name: name ?? this.name,
      qualification: qualification ?? this.qualification,
      rating: rating ?? this.rating,
      reviewsCount: reviewsCount ?? this.reviewsCount,
      tag: tag ?? this.tag,
      distance: distance ?? this.distance,
      price: price ?? this.price,
      phone: phone ?? this.phone,
      experience: experience ?? this.experience,
      photoUrl: photoUrl ?? this.photoUrl,
      businessHours: businessHours ?? this.businessHours,
      bio: bio ?? this.bio,
      isVerified: isVerified ?? this.isVerified,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }
}
