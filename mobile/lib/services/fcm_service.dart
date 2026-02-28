import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import './api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // If you're going to use other Firebase services in the background, such as Firestore,
  // make sure you call `Firebase.initializeApp()` before using other Firebase services.
  debugPrint('Handling a background message: ${message.messageId}');
}

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> init(BuildContext? context) async {
    // 1. Request permissions (especially for iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted push notification permission');
    } else {
      debugPrint('User declined or has not accepted push notification permission');
    }

    // 2. Get initial token
    String? token = await _messaging.getToken();
    if (token != null) {
      debugPrint('Initial FCM Token: $token');
      await ApiService.updateFcmToken(token);
    }

    // 3. Listen for token refreshes
    _messaging.onTokenRefresh.listen((newToken) async {
      debugPrint('FCM Token Refreshed: $newToken');
      await ApiService.updateFcmToken(newToken);
    });

    // 4. Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('Got a message whilst in the foreground!');
      debugPrint('Message data: ${message.data}');

      if (message.notification != null && context != null && context.mounted) {
        debugPrint('Message also contained a notification: ${message.notification?.title}');
        
        // Show a SnackBar or Dialog for foreground notifications
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.notification?.title ?? 'Notification',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(message.notification?.body ?? ''),
              ],
            ),
            behavior: SnackBarBehavior.floating,
            duration: const Duration(seconds: 5),
            action: SnackBarAction(
              label: 'VIEW',
              onPressed: () {
                // Handle notification tap
              },
            ),
          ),
        );
      }
    });

    // 5. Handle notification click when app is in background but opened
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('Notification clicked while app was in background!');
      // Handle navigation here
    });
  }
}
