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

  VetModel({
    required this.id,
    required this.name,
    required this.qualification,
    this.rating = 4.8,
    this.reviewsCount = 120,
    required this.tag,
    this.distance = '1.2 km',
    this.price = '৳35/visit',
    this.phone = '+1 (555) 234-5678',
    this.experience = '8 Years',
    this.photoUrl,
    this.businessHours = 'Mon - Fri: 8:00 AM - 6:00 PM',
    this.bio = 'Dedicated and caring veterinary specialist providing top-notch healthcare, surgeries, and routine checkups for pets.',
    this.isVerified = true,
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
    };
  }

  factory VetModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return VetModel(
      id: id,
      name: map['name'] ?? '',
      qualification: map['qualification'] ?? 'Pet Care Specialist',
      rating: (map['rating'] as num?)?.toDouble() ?? 4.5,
      reviewsCount: (map['reviewsCount'] as num?)?.toInt() ?? 0,
      tag: map['role'] ?? map['tag'] ?? 'Veterinarian',
      distance: map['distance'] ?? 'Nearby',
      price: map['price'] ?? '৳30',
      phone: map['phone'] ?? '',
      experience: map['experience']?.toString() ?? '5 Years',
      photoUrl: map['photoUrl'] ?? map['imageUrl'],
      businessHours: map['businessHours'] ?? 'Mon - Fri: 9 AM - 6 PM',
      bio: map['bio'] ?? 'Experienced pet care professional dedicated to your pet\'s health.',
      isVerified: map['isVerified'] ?? false,
    );
  }
}
