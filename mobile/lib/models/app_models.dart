enum Role { rider, driver, both, admin }

class User {
  final String id;
  final String email;
  final String fullName;
  final String phoneNumber;
  final String? ghanaCardId;
  final bool isVerified;
  final String? workEmail;
  final Role role;
  final double walletBalance;
  final int commutePoints;
  final int strikes;
  final double trustScore;
  final String? referralCode;
  final Vehicle? vehicle;
  final List<String> affinityGroups;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.phoneNumber,
    this.ghanaCardId,
    required this.isVerified,
    this.workEmail,
    required this.role,
    required this.walletBalance,
    required this.commutePoints,
    this.strikes = 0,
    required this.trustScore,
    this.referralCode,
    this.vehicle,
    this.affinityGroups = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? 'User',
      phoneNumber: json['phoneNumber']?.toString() ?? '',
      ghanaCardId: json['ghanaCardId']?.toString(),
      isVerified: json['isVerified'] == true,
      workEmail: json['workEmail']?.toString(),
      role: Role.values.firstWhere(
        (e) => e.toString().split('.').last.toUpperCase() == json['role']?.toString().toUpperCase(),
        orElse: () => Role.rider,
      ),
      walletBalance: double.tryParse(json['walletBalance']?.toString() ?? '0') ?? 0.0,
      commutePoints: int.tryParse(json['commutePoints']?.toString() ?? '0') ?? 0,
      strikes: int.tryParse(json['strikes']?.toString() ?? '0') ?? 0,
      trustScore: double.tryParse(json['trustScore']?.toString() ?? '5.0') ?? 5.0,
      referralCode: json['referralCode']?.toString(),
      vehicle: json['vehicle'] != null ? Vehicle.fromJson(json['vehicle']) : null,
      affinityGroups: json['affinityGroups'] != null 
          ? (json['affinityGroups'] as List).map((g) => g['name']?.toString() ?? '').where((name) => name.isNotEmpty).toList()
          : [],
    );
  }
}

class Vehicle {
  final String id;
  final String make;
  final String model;
  final String plateNumber;
  final String color;
  final bool hasAC;
  final List<String> photos;

  Vehicle({
    required this.id,
    required this.make,
    required this.model,
    required this.plateNumber,
    required this.color,
    required this.hasAC,
    required this.photos,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id']?.toString() ?? '',
      make: json['make']?.toString() ?? '',
      model: json['model']?.toString() ?? '',
      plateNumber: json['plateNumber']?.toString() ?? '',
      color: json['color']?.toString() ?? '',
      hasAC: json['hasAC'] == true,
      photos: json['photos'] != null ? List<String>.from(json['photos']) : [],
    );
  }
}

class Transaction {
  final String id;
  final double amount;
  final String type;
  final String status;
  final String? description;
  final DateTime createdAt;

  Transaction({
    required this.id,
    required this.amount,
    required this.type,
    required this.status,
    this.description,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id']?.toString() ?? '',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0.0,
      type: json['type']?.toString() ?? 'UNKNOWN',
      status: json['status']?.toString() ?? 'PENDING',
      description: json['description']?.toString(),
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
    );
  }
}

class Landmark {
  final String id;
  final String name;
  final double latitude;
  final double longitude;

  Landmark({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
  });

  factory Landmark.fromJson(Map<String, dynamic> json) {
    return Landmark(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown Landmark',
      latitude: double.tryParse(json['latitude']?.toString() ?? '0') ?? 0.0,
      longitude: double.tryParse(json['longitude']?.toString() ?? '0') ?? 0.0,
    );
  }
}

class RideStop {
  final String id;
  final String landmarkId;
  final String landmarkName;
  final int stopOrder;

  RideStop({
    required this.id,
    required this.landmarkId,
    required this.landmarkName,
    required this.stopOrder,
  });

  factory RideStop.fromJson(Map<String, dynamic> json) {
    return RideStop(
      id: json['id']?.toString() ?? '',
      landmarkId: json['landmarkId']?.toString() ?? '',
      landmarkName: (json['landmark'] != null && json['landmark']['name'] != null)
          ? json['landmark']['name'].toString()
          : 'Unknown Stop',
      stopOrder: int.tryParse(json['stopOrder']?.toString() ?? '0') ?? 0,
    );
  }
}

class Ride {
  final String id;
  final String? driverId;
  final String driverName;
  final bool driverVerified;
  final double driverTrustScore;
  final List<RideStop> stops;
  final DateTime departureTime;
  final double fare;
  final int availableSeats;
  final String? carModel;
  final String? plateNumber;

  Ride({
    required this.id,
    this.driverId,
    required this.driverName,
    required this.driverVerified,
    required this.driverTrustScore,
    required this.stops,
    required this.departureTime,
    required this.fare,
    required this.availableSeats,
    this.carModel,
    this.plateNumber,
  });

  // Getters for display
  String get originName => stops.isNotEmpty ? stops.first.landmarkName : 'Unknown';
  String get destinationName => stops.isNotEmpty ? stops.last.landmarkName : 'Unknown';

  factory Ride.fromJson(Map<String, dynamic> json) {
    return Ride(
      id: json['id']?.toString() ?? '',
      driverId: json['driverId']?.toString(),
      driverName: (json['driver'] != null && json['driver']['fullName'] != null)
          ? json['driver']['fullName'].toString()
          : (json['driverName']?.toString() ?? 'Unknown Driver'),
      driverVerified: json['driver'] != null ? (json['driver']['isVerified'] == true) : false,
      driverTrustScore: double.tryParse(json['driver']?['trustScore']?.toString() ?? '5.0') ?? 5.0,
      stops: json['stops'] != null 
          ? (json['stops'] as List).map((s) => RideStop.fromJson(s)).toList()
          : [],
      departureTime: DateTime.tryParse(json['departureTime']?.toString() ?? '') ?? DateTime.now(),
      fare: double.tryParse(json['fare']?.toString() ?? '0.0') ?? 0.0,
      availableSeats: int.tryParse(json['availableSeats']?.toString() ?? '0') ?? 0,
      carModel: json['vehicle'] != null ? "${json['vehicle']['make'] ?? ''} ${json['vehicle']['model'] ?? ''}".trim() : null,
      plateNumber: json['vehicle'] != null ? json['vehicle']['plateNumber']?.toString() : null,
    );
  }
}

class CarpoolPod {
  final String id;
  final String name;
  final String origin;
  final String destination;
  final String inviteCode;
  final List<PodMember> members;
  final List<PodSchedule> schedules;

  CarpoolPod({
    required this.id,
    required this.name,
    required this.origin,
    required this.destination,
    required this.inviteCode,
    this.members = const [],
    this.schedules = const [],
  });

  factory CarpoolPod.fromJson(Map<String, dynamic> json) {
    return CarpoolPod(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Pod',
      origin: json['origin']?.toString() ?? '',
      destination: json['destination']?.toString() ?? '',
      inviteCode: json['inviteCode']?.toString() ?? '',
      members: json['members'] != null
          ? (json['members'] as List).map((m) => PodMember.fromJson(m)).toList()
          : [],
      schedules: json['schedules'] != null
          ? (json['schedules'] as List).map((s) => PodSchedule.fromJson(s)).toList()
          : [],
    );
  }
}

class PodMember {
  final String userId;
  final String fullName;
  final String role;

  PodMember({
    required this.userId,
    required this.fullName,
    required this.role,
  });

  factory PodMember.fromJson(Map<String, dynamic> json) {
    return PodMember(
      userId: json['userId']?.toString() ?? '',
      fullName: json['user']?['fullName']?.toString() ?? 'Member',
      role: json['role']?.toString() ?? 'MEMBER',
    );
  }
}

class PodSchedule {
  final String id;
  final String day;
  final String driverId;
  final String driverName;
  final String departureTime;

  PodSchedule({
    required this.id,
    required this.day,
    required this.driverId,
    required this.driverName,
    required this.departureTime,
  });

  factory PodSchedule.fromJson(Map<String, dynamic> json) {
    return PodSchedule(
      id: json['id']?.toString() ?? '',
      day: json['day']?.toString() ?? '',
      driverId: json['driverId']?.toString() ?? '',
      driverName: json['driver']?['fullName']?.toString() ?? 'Driver',
      departureTime: json['departureTime']?.toString() ?? '',
    );
  }
}
