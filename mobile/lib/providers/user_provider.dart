import 'package:flutter/material.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';

class UserProvider with ChangeNotifier {
  User? _user;
  String? _token;
  bool _isLoading = false;
  bool _hasSeenOnboarding = false;
  final DatabaseService _db = DatabaseService();

  User? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  bool get hasSeenOnboarding => _hasSeenOnboarding;

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

  Future<void> loginMock() async {
    _isLoading = true;
    notifyListeners();
    await Future.delayed(const Duration(seconds: 1));
    _user = User(
      id: 'u1',
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
    _token = 'mock-jwt-token';
    _isLoading = false;
    notifyListeners();
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
  }) async {
    if (_user == null) return;
    try {
      await ApiService.registerVehicle(
        make: make,
        model: model,
        plateNumber: plateNumber,
        color: color,
        hasAC: hasAC,
      );
      await fetchProfile(_user!.id);
    } catch (e) {
      debugPrint(e.toString());
      rethrow;
    }
  }

  Future<void> verifyWorkEmail(String email) async {
    if (_user == null) return;
    try {
      await ApiService.verifyWorkEmail(email);
      await fetchProfile(_user!.id);
    } catch (e) {
      debugPrint(e.toString());
      rethrow;
    }
  }
}
