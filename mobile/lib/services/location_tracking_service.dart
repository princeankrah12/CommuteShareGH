import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'dart:async';
import './realtime_service.dart';

class LocationTrackingService {
  static final LocationTrackingService _instance = LocationTrackingService._internal();
  factory LocationTrackingService() => _instance;
  LocationTrackingService._internal();

  bool _isTracking = false;
  StreamSubscription<Position>? _positionStream;
  RealtimeService? _realtimeService;
  String? _currentRideId;

  void initialize(RealtimeService realtimeService) {
    _realtimeService = realtimeService;
  }

  void setCurrentRide(String? rideId) {
    _currentRideId = rideId;
  }

  Future<void> startTracking() async {
    if (_isTracking) return;
    
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('Location services are disabled.');
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('Location permissions are denied');
        return;
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      debugPrint('Location permissions are permanently denied.');
      return;
    }

    _isTracking = true;
    debugPrint('Location tracking started...');

    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((Position position) {
      if (_realtimeService != null && _currentRideId != null) {
        _realtimeService!.updateLocation(_currentRideId!, position.latitude, position.longitude);
      }
      debugPrint('Location Update: ${position.latitude}, ${position.longitude}');
    });
  }

  void stopTracking() {
    if (!_isTracking) return;
    _positionStream?.cancel();
    _positionStream = null;
    _isTracking = false;
    _currentRideId = null;
    debugPrint('Location tracking stopped.');
  }

  bool get isTracking => _isTracking;
}
