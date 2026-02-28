import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/app_models.dart';
import './database_service.dart';

class ApiService {
  static const String _baseUrlEnv = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3001/api');
  static const String baseUrl = _baseUrlEnv;
  static final DatabaseService _db = DatabaseService();
  static const _storage = FlutterSecureStorage();

  static Future<Map<String, String>> _headers() async {
    String? token = await _storage.read(key: 'auth_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  static Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
  }

  static Future<Map<String, dynamic>> loginWithGoogle(String idToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/google-login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'idToken': idToken}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['token'] != null) {
        await saveToken(data['token']);
      }
      return data;
    } else {
      throw Exception('Google login failed: ${response.body}');
    }
  }

  static Future<User> getProfile(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/profile/$userId'),
        headers: await _headers(),
      );
      if (response.statusCode == 200) {
        return User.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Failed to load profile');
      }
    } catch (e) {
      debugPrint('Profile fetch failed, returning mock user');
      return User(
        id: userId,
        email: 'kojo@example.com',
        fullName: 'Kojo Mensah',
        phoneNumber: '0244123456',
        isVerified: true,
        role: Role.rider,
        walletBalance: 125.50,
        commutePoints: 3,
        trustScore: 4.8,
        referralCode: 'GH67XY',
        affinityGroups: ['MTN Ghana', 'Legon Alumni'],
      );
    }
  }

  static Future<List<Ride>> searchRides(String originId, String destId, DateTime date, {String? affinityGroupId}) async {
    final dateStr = date.toIso8601String().split('T')[0];
    var url = '$baseUrl/rides/search?originId=$originId&destinationId=$destId&date=$dateStr';
    
    if (affinityGroupId != null) {
      url += '&affinityGroupId=$affinityGroupId';
    }
    
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: await _headers(),
      ).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        List data = jsonDecode(response.body);
        final rides = data.map((item) => Ride.fromJson(item)).toList();
        
        // Cache the results for offline use
        await _db.cacheRides(originId, destId, rides);
        return rides;
      } else {
        throw Exception('Failed to search rides');
      }
    } catch (e) {
      debugPrint('Network failed, checking local cache...');
      final cachedRides = await _db.getCachedRides(originId, destId);
      if (cachedRides.isNotEmpty) {
        return cachedRides;
      }
      rethrow;
    }
  }

  static Future<void> topUpWallet(String userId, double amount, {String? idempotencyKey}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/wallet/topup'),
      headers: await _headers(),
      body: jsonEncode({
        'userId': userId,
        'amount': amount,
        'reference': 'MOMO-${DateTime.now().millisecondsSinceEpoch}',
        'idempotencyKey': idempotencyKey,
      }),
    );
    if (response.statusCode != 200) {
      throw Exception('Top-up failed');
    }
  }

  static Future<List<Transaction>> getTransactions(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/wallet/$userId/transactions'),
        headers: await _headers(),
      );
      if (response.statusCode == 200) {
        List data = jsonDecode(response.body);
        return data.map((item) => Transaction.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load transactions');
      }
    } catch (e) {
      debugPrint('Network failed, returning mock transactions...');
      return [
        Transaction(
          id: 't1',
          amount: 50.0,
          type: 'TOPUP',
          status: 'COMPLETED',
          description: 'Mobile Money Top-up',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
        ),
        Transaction(
          id: 't2',
          amount: 45.0,
          type: 'RIDE_PAYMENT',
          status: 'COMPLETED',
          description: 'Ride to Ridge',
          createdAt: DateTime.now().subtract(const Duration(hours: 5)),
        ),
        Transaction(
          id: 't3',
          amount: 10.0,
          type: 'RIDE_PAYOUT',
          status: 'COMPLETED',
          description: 'Referral Bonus',
          createdAt: DateTime.now().subtract(const Duration(days: 3)),
        ),
      ];
    }
  }

  static Future<void> verifyIdentity(String userId, String ghanaCardId, {String? selfie}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-identity'),
      headers: await _headers(),
      body: jsonEncode({
        'userId': userId,
        'ghanaCardId': ghanaCardId,
        'selfie': selfie,
      }..removeWhere((k, v) => v == null)),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Verification failed');
    }
  }

  static Future<Map<String, dynamic>> bookRide({
    required String rideId,
    required String pickupId,
    required String dropoffId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rides/book'),
      headers: await _headers(),
      body: jsonEncode({
        'rideId': rideId,
        'pickupLandmarkId': pickupId,
        'dropoffLandmarkId': dropoffId,
      }),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Booking failed');
    }
  }

  static Future<void> registerVehicle({
    required String make,
    required String model,
    required String plateNumber,
    required String color,
    required bool hasAC,
    List<String> photos = const [],
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/vehicles/register'),
      headers: await _headers(),
      body: jsonEncode({
        'make': make,
        'model': model,
        'plateNumber': plateNumber,
        'color': color,
        'hasAC': hasAC,
        'photos': photos,
      }),
    );

    if (response.statusCode != 201) {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Vehicle registration failed');
    }
  }

  static Future<void> verifyWorkEmail(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-work'),
      headers: await _headers(),
      body: jsonEncode({'workEmail': email}),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Email verification failed');
    }
  }

  static Future<Map<String, dynamic>> createRide({
    required String vehicleId,
    required DateTime departureTime,
    required String originId,
    required String destinationId,
    required int availableSeats,
    required double fare,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rides'),
      headers: await _headers(),
      body: jsonEncode({
        'vehicleId': vehicleId,
        'departureTime': departureTime.toIso8601String(),
        'originLandmarkId': originId,
        'destinationLandmarkId': destinationId,
        'availableSeats': availableSeats,
        'fare': fare,
      }),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Failed to post ride');
    }
  }

  static Future<List<dynamic>> getMyVehicles() async {
    final response = await http.get(
      Uri.parse('$baseUrl/vehicles/my-vehicles'),
      headers: await _headers(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load vehicles');
    }
  }

  static Future<Map<String, dynamic>> getMyWallet() async {
    final response = await http.get(
      Uri.parse('$baseUrl/wallet/my-wallet'),
      headers: await _headers(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load wallet data');
    }
  }

  static Future<Map<String, double>> resolveDigitalAddress(String digitalAddress) async {
    final response = await http.post(
      Uri.parse('$baseUrl/rides/resolve-address'),
      headers: await _headers(),
      body: jsonEncode({'digitalAddress': digitalAddress}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'lat': (data['lat'] as num).toDouble(),
        'lng': (data['lng'] as num).toDouble(),
      };
    } else {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Failed to resolve digital address');
    }
  }

  static Future<CarpoolPod?> getMyPod() async {
    final response = await http.get(
      Uri.parse('$baseUrl/pods/my-pod'),
      headers: await _headers(),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data == null) return null;
      return CarpoolPod.fromJson(data);
    } else if (response.statusCode == 404) {
      return null;
    } else {
      throw Exception('Failed to load pod data');
    }
  }

  static Future<void> leavePod(String podId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/pods/leave'),
      headers: await _headers(),
      body: jsonEncode({'podId': podId}),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Failed to leave pod');
    }
  }

  static Future<void> triggerSOS({
    required String rideId,
    required double lat,
    required double lng,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/pods/sos'),
      headers: await _headers(),
      body: jsonEncode({
        'rideId': rideId,
        'lat': lat,
        'lng': lng,
      }),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Failed to trigger SOS');
    }
  }

  static Future<void> requestLeave(DateTime startDate, DateTime endDate) async {
    final response = await http.post(
      Uri.parse('$baseUrl/pods/leave/request'),
      headers: await _headers(),
      body: jsonEncode({
        'startDate': startDate.toIso8601String(),
        'endDate': endDate.toIso8601String(),
      }),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Failed to schedule leave. Please try again.');
    }
  }

  static Future<Map<String, dynamic>> getWalletDetails() async {
    final response = await http.get(
      Uri.parse('$baseUrl/wallet/details'),
      headers: await _headers(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load wallet details');
    }
  }

  static Future<String> initializeTopUp(double amountGhs) async {
    final response = await http.post(
      Uri.parse('$baseUrl/payments/initialize'),
      headers: await _headers(),
      body: jsonEncode({'amountGhs': amountGhs}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['authorization_url'];
    } else {
      final error = jsonDecode(response.body)['error'];
      throw Exception(error ?? 'Failed to initialize payment');
    }
  }

  static Future<void> updateFcmToken(String token) async {
    final response = await http.put(
      Uri.parse('$baseUrl/users/me/fcm-token'),
      headers: await _headers(),
      body: jsonEncode({'fcmToken': token}),
    );

    if (response.statusCode != 200) {
      debugPrint('Failed to update FCM token on backend');
    }
  }
}
