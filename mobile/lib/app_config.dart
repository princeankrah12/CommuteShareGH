import 'package:flutter/foundation.dart';

class AppConfig {
  // Use localhost because we will use 'adb reverse' to bridge the connection
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3001', 
  );

  static String get apiUrl => '$apiBaseUrl/api';
  
  static String get socketUrl => apiBaseUrl;

  static bool get isProduction => kReleaseMode;

  // Set to true to use simulation/mock services for identity/kyc
  static bool get useMockIdentity => kDebugMode;
}
