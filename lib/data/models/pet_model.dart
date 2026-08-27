class PetModel {
  final String petID;
  final String ownerID;
  final String name;
  final String type; // Dog, Cat, etc.
  final String breed;
  final String gender;
  final String age;
  final String dob;
  final String color;
  final String sound;
  final String height;
  final String weight;
  final String? photoUrl; // Aligned with doc
  final String? vaccinationDetails;
  final String? medicationTime;
  final String? description;
  final List<String> feedingTimes;
  final String? currentFoodName;
  final String? foodType; // Dry, Wet, Mixed
  final String? allergies;
  final String mood; // Happy, Calm, Anxious, etc.
  final String hungerStatus; // Full, Hungry, Starving
  final int healthIndex; // 0-100
  final int dailyCalorieGoal;
  final String? lastFedTime;
  final double? latitude;
  final double? longitude;

  PetModel({
    required this.petID,
    required this.ownerID,
    required this.name,
    this.type = 'Dog',
    required this.breed,
    required this.gender,
    required this.age,
    required this.dob,
    this.color = '',
    this.sound = '',
    this.height = '',
    this.weight = '',
    this.photoUrl,
    this.vaccinationDetails,
    this.medicationTime,
    this.description,
    List<String>? feedingTimes,
    this.currentFoodName,
    this.foodType,
    this.allergies,
    this.mood = 'Happy',
    this.hungerStatus = 'Full',
    this.healthIndex = 100,
    this.dailyCalorieGoal = 1200,
    this.lastFedTime,
    this.latitude,
    this.longitude,
  }) : feedingTimes = feedingTimes ?? [];

  Map<String, dynamic> toMap() {
    return {
      'petID': petID,
      'ownerID': ownerID,
      'name': name,
      'type': type,
      'breed': breed,
      'gender': gender,
      'age': age,
      'dob': dob,
      'color': color,
      'sound': sound,
      'height': height,
      'weight': weight,
      'photoUrl': photoUrl,
      'vaccinationDetails': vaccinationDetails,
      'medicationTime': medicationTime,
      'description': description,
      'feedingTimes': feedingTimes,
      'currentFoodName': currentFoodName,
      'foodType': foodType,
      'allergies': allergies,
      'mood': mood,
      'hungerStatus': hungerStatus,
      'healthIndex': healthIndex,
      'dailyCalorieGoal': dailyCalorieGoal,
      'lastFedTime': lastFedTime,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory PetModel.fromMap(String id, Map<dynamic, dynamic> map) {
    return PetModel(
      petID: id,
      ownerID: map['ownerID'] ?? '',
      name: map['name'] ?? '',
      type: map['type'] ?? 'Dog',
      breed: map['breed'] ?? '',
      gender: map['gender'] ?? 'Male',
      age: map['age']?.toString() ?? '',
      dob: map['dob'] ?? '',
      color: map['color'] ?? '',
      sound: map['sound'] ?? '',
      height: map['height']?.toString() ?? '',
      weight: map['weight']?.toString() ?? '',
      photoUrl: map['photoUrl'] ?? map['imageUrl'],
      vaccinationDetails: map['vaccinationDetails'],
      medicationTime: map['medicationTime'],
      description: map['description'],
      feedingTimes: (map['feedingTimes'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      currentFoodName: map['currentFoodName'],
      foodType: map['foodType'],
      allergies: map['allergies'],
      mood: map['mood'] ?? 'Happy',
      hungerStatus: map['hungerStatus'] ?? 'Full',
      healthIndex: map['healthIndex'] ?? 100,
      dailyCalorieGoal: map['dailyCalorieGoal'] ?? 1200,
      lastFedTime: map['lastFedTime'],
      latitude: (map['latitude'] as num?)?.toDouble(),
      longitude: (map['longitude'] as num?)?.toDouble(),
    );
  }

  PetModel copyWith({
    String? petID, String? ownerID, String? name, String? type, String? breed, String? gender,
    String? age, String? dob, String? color, String? sound, String? height, String? weight,
    String? photoUrl, String? vaccinationDetails, String? medicationTime, String? description,
    List<String>? feedingTimes, String? currentFoodName, String? foodType, String? allergies,
    String? mood, String? hungerStatus, int? healthIndex, int? dailyCalorieGoal, String? lastFedTime,
    double? latitude, double? longitude,
  }) {
    return PetModel(
      petID: petID ?? this.petID, ownerID: ownerID ?? this.ownerID, name: name ?? this.name,
      type: type ?? this.type, breed: breed ?? this.breed, gender: gender ?? this.gender,
      age: age ?? this.age, dob: dob ?? this.dob, color: color ?? this.color, sound: sound ?? this.sound,
      height: height ?? this.height, weight: weight ?? this.weight, photoUrl: photoUrl ?? this.photoUrl,
      vaccinationDetails: vaccinationDetails ?? this.vaccinationDetails, medicationTime: medicationTime ?? this.medicationTime,
      description: description ?? this.description, feedingTimes: feedingTimes ?? this.feedingTimes,
      currentFoodName: currentFoodName ?? this.currentFoodName, foodType: foodType ?? this.foodType,
      allergies: allergies ?? this.allergies, mood: mood ?? this.mood, hungerStatus: hungerStatus ?? this.hungerStatus,
      healthIndex: healthIndex ?? this.healthIndex, dailyCalorieGoal: dailyCalorieGoal ?? this.dailyCalorieGoal,
      lastFedTime: lastFedTime ?? this.lastFedTime, latitude: latitude ?? this.latitude, longitude: longitude ?? this.longitude,
    );
  }
}
