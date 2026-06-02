import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/user_provider.dart';
import './home_screen.dart';

class AffinityVerificationScreen extends StatefulWidget {
  final bool isOnboarding;
  const AffinityVerificationScreen({super.key, this.isOnboarding = false});

  @override
  State<AffinityVerificationScreen> createState() => _AffinityVerificationScreenState();
}

class _AffinityVerificationScreenState extends State<AffinityVerificationScreen> {
  final TextEditingController _emailController = TextEditingController();
  
  bool _isSubmitting = false;
  String? _errorMessage;

  void _handleVerifyWorkEmail() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    final userProvider = context.read<UserProvider>();
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      await userProvider.verifyWorkEmail(email);
      
      if (mounted) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('✨ Corporate Badge Earned!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        if (widget.isOnboarding) {
          navigator.pushReplacement(
            MaterialPageRoute(builder: (_) => const HomeScreen()),
          );
        } else {
          navigator.pop();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Work Verification')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Icon(Icons.business_center, size: 80, color: AppTheme.primaryNavy),
            ),
            const SizedBox(height: 24),
            const Text(
              'Join a Verified Community',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'Linking your work email adds an "Affinity Badge" to your profile, increasing trust for both riders and drivers.',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
            const SizedBox(height: 32),
            
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'Corporate Email Address',
                hintText: 'kojo.mensah@mtn.com.gh',
                prefixIcon: const Icon(Icons.email_outlined),
                errorText: _errorMessage,
              ),
              enabled: !_isSubmitting,
            ),
            const SizedBox(height: 24),
            const Text('How it works:', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            _buildStep('1. Enter your work email.'),
            _buildStep('2. Verify instantly to earn your badge.'),
            
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _handleVerifyWorkEmail,
              child: _isSubmitting 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Verify Work Email'),
            ),
            if (widget.isOnboarding) ...[
              const SizedBox(height: 16),
              TextButton(
                onPressed: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const HomeScreen()),
                  );
                },
                child: const Text('Skip for now'),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildStep(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.primaryNavy),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }
}
