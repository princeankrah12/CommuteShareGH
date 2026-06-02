import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;
import '../providers/user_provider.dart';
import '../theme/app_theme.dart';
import './home_screen.dart';
import './verification_screen.dart';
import './affinity_verification_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    // Scopes are optional, but you might want to request 'email'
    scopes: ['email'],
    clientId: '870831073211-3kofld4rjaso3krnvphkrvavg0109753.apps.googleusercontent.com',
  );

  bool _isLoggingIn = false;

  Future<void> _handleSignIn() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    setState(() => _isLoggingIn = true);
    try {
      if (kIsWeb || kDebugMode) {
        // Bypass real Google Auth popup on web and debug builds to avoid redirect_uri_mismatch or keystore signing issues
        await Future.delayed(const Duration(seconds: 1));
        await userProvider.loginWithGoogle('mock-web-token');
        if (mounted) {
          final user = userProvider.user;
          if (user != null) {
            if (!user.isVerified) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const VerificationScreen(isOnboarding: true)),
              );
            } else if (user.workEmail == null && user.affinityGroups.isEmpty) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const AffinityVerificationScreen(isOnboarding: true)),
              );
            } else {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const HomeScreen()),
              );
            }
          }
        }
        return;
      }

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        setState(() => _isLoggingIn = false);
        return; // User cancelled
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken != null) {
        await userProvider.loginWithGoogle(idToken);
        if (mounted) {
          final user = userProvider.user;
          if (user != null) {
            if (!user.isVerified) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const VerificationScreen(isOnboarding: true)),
              );
            } else if (user.workEmail == null && user.affinityGroups.isEmpty) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const AffinityVerificationScreen(isOnboarding: true)),
              );
            } else {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const HomeScreen()),
              );
            }
          }
        }
      } else {
        throw Exception('Failed to get Google ID Token');
      }
    } catch (error) {
      debugPrint('Google Sign-In Error: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Login Failed: $error')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoggingIn = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.primaryNavy,
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.directions_car, size: 100, color: AppTheme.accentGold),
            const SizedBox(height: 24),
            const Text(
              'MyCommuteShare',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Share the ride, split the cost.',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 64),
            if (_isLoggingIn)
              const CircularProgressIndicator(color: AppTheme.accentGold)
            else
              ElevatedButton.icon(
                onPressed: _handleSignIn,
                icon: const Icon(Icons.account_circle, size: 24),
                label: const Text('Sign in with Google'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black87,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(28),
                  ),
                ),
              ),
            const SizedBox(height: 16),

            const SizedBox(height: 24),
            const Text(
              'Safe • Reliable • Sustainable',
              style: TextStyle(color: Colors.white38, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}
