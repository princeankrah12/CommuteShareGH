import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';

class UserProvider with ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;
  bool _hasSeenOnboarding = false;
  final DatabaseService _db = DatabaseService();
  List<Landmark> _recentLandmarks = [];

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get hasSeenOnboarding => _hasSeenOnboarding;
  List<Landmark> get recentLandmarks => _recentLandmarks;

  UserProvider() {
    _loadRecentLandmarks();
  }

  Future<void> _loadRecentLandmarks() async {
    final prefs = await SharedPreferences.getInstance();
    final String? recentJson = prefs.getString('recent_landmarks');
    if (recentJson != null) {
      final List<dynamic> decoded = jsonDecode(recentJson);
      _recentLandmarks = decoded.map((item) => Landmark.fromJson(item)).toList();
      notifyListeners();
    }
  }

  Future<void> addRecentLandmark(Landmark landmark) async {
    // Remove if already exists to move to top
    _recentLandmarks.removeWhere((l) => l.id == landmark.id);
    _recentLandmarks.insert(0, landmark);
    
    // Keep only last 5
    if (_recentLandmarks.length > 5) {
      _recentLandmarks = _recentLandmarks.sublist(0, 5);
    }
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('recent_landmarks', jsonEncode(_recentLandmarks.map((l) => {
      'id': l.id,
      'name': l.name,
      'latitude': l.latitude,
      'longitude': l.longitude,
    }).toList()));
    notifyListeners();
  }

  void completeOnboarding() {
    _hasSeenOnboarding = true;
    // In a real app, persist this with SharedPreferences
    notifyListeners();
  }

  Future<void> loginWithGoogle(String idToken) async {
    _isLoading = true;
    notifyListeners();
    try {
      final result = await ApiService.loginWithGoogle(idToken);
      _user = User.fromJson(result['user']);
      _token = result['token'];
      // Cache the user
      await _db.cacheUser(_user!);
    } catch (e) {
      debugPrint('Google Login Provider Error: $e');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }



  void logout() {
    _user = null;
    _token = null;
    notifyListeners();
  }

  Future<void> fetchProfile(String userId) async {
    // 1. Try to load from cache first for instant UI response
    final cached = await _db.getCachedUser(userId);
    if (cached != null) {
      _user = cached;
      notifyListeners();
    }

    _isLoading = true;
    notifyListeners();
    try {
      // 2. Fetch fresh data from API
      _user = await ApiService.getProfile(userId);
      // 3. Update cache
      await _db.cacheUser(_user!);
    } catch (e) {
      debugPrint('Offline or API Error: $e');
      // If we failed, we still have the cached user (if any)
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> topUp(double amount) async {
    if (_user == null) return;
    try {
      // Generate a simple unique key for idempotency
      final idempotencyKey = 'topup_${_user!.id}_${DateTime.now().millisecondsSinceEpoch}_${(100 + (900 * (1 / (1 + amount)))).toInt()}';
      await ApiService.topUpWallet(_user!.id, amount, idempotencyKey: idempotencyKey);
      await fetchProfile(_user!.id); // Refresh balance
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  Future<void> verifyIdentity(String ghanaCardId, {String? selfie}) async {
    if (_user == null) return;
    try {
      // Simulate API call to /api/auth/verify-identity
      await ApiService.verifyIdentity(_user!.id, ghanaCardId, selfie: selfie);
      await fetchProfile(_user!.id); // Refresh verification status
    } catch (e) {
      debugPrint(e.toString());
      rethrow;
    }
  }

  Future<void> registerVehicle({
    required String make,
    required String model,
    required String plateNumber,
    required String color,
    required bool hasAC,
    required int seatCapacity,
  }) async {
    if (_user == null) return;
    try {
      await ApiService.registerVehicle(
        make: make,
        model: model,
        plateNumber: plateNumber,
        color: color,
        hasAC: hasAC,
        seatCapacity: seatCapacity,
      );
      await fetchProfile(_user!.id);
    } catch (e) {
      debugPrint(e.toString());
      rethrow;
    }
  }

  Future<void> requestWorkVerification(String email) async {
    if (_user == null) return;
    try {
      await ApiService.requestWorkVerification(email);
    } catch (e) {
      debugPrint(e.toString());
      rethrow;
    }
  }

  Future<void> verifyWorkEmail(String email, String otp) async {
    if (_user == null) return;
    try {
      await ApiService.verifyWorkEmail(email, otp);
      await fetchProfile(_user!.id);
    } catch (e) {
      debugPrint(e.toString());
      rethrow;
    }
  }

  Future<List<Landmark>> searchLandmarks(String query) async {
    try {
      return await ApiService.searchLandmarks(query);
    } catch (e) {
      debugPrint('Error searching landmarks: $e');
      return [];
    }
  }
}
