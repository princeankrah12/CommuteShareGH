import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:smile_id/smile_id.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import './theme/app_theme.dart';
import './providers/user_provider.dart';
import './screens/splash_screen.dart';
import './services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  if (Platform.isWindows || Platform.isLinux) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }

  // Initialize Smile ID
  SmileID.initialize(
    useSandbox: true, 
    enableCrashReporting: true,
  );
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserProvider()),
      ],
      child: const CommuteShareApp(),
    ),
  );
}

class CommuteShareApp extends StatefulWidget {
  const CommuteShareApp({super.key});

  @override
  State<CommuteShareApp> createState() => _CommuteShareAppState();
}

class _CommuteShareAppState extends State<CommuteShareApp> {
  @override
  void initState() {
    super.initState();
    FCMService().init(context);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CommuteShare GH',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
