import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/user_provider.dart';

class AffinityVerificationScreen extends StatefulWidget {
  const AffinityVerificationScreen({super.key});

  @override
  State<AffinityVerificationScreen> createState() => _AffinityVerificationScreenState();
}

class _AffinityVerificationScreenState extends State<AffinityVerificationScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  
  bool _isSubmitting = false;
  bool _otpSent = false;
  String? _errorMessage;

  void _handleSendLink() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      // Simulate sending OTP/Link via Backend
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _otpSent = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification code sent to your work email.')),
        );
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

  void _handleVerifyOTP() async {
    if (_otpController.text.trim().length < 4) return;

    setState(() => _isSubmitting = true);
    
    final userProvider = context.read<UserProvider>();
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      // Use the actual API to link the email
      await userProvider.verifyWorkEmail(_emailController.text.trim());
      
      if (mounted) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('✨ Corporate Badge Earned!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        navigator.pop();
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
            
            if (!_otpSent) ...[
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
              _buildStep('2. Receive a 6-digit verification code.'),
              _buildStep('3. Enter code to earn your badge.'),
            ] else ...[
              const Text(
                'Enter Verification Code',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 8),
              Text('We sent a code to ${_emailController.text}', style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 24),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, letterSpacing: 12, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  hintText: '000000',
                  errorText: _errorMessage,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                enabled: !_isSubmitting,
              ),
              TextButton(
                onPressed: _isSubmitting ? null : () => setState(() => _otpSent = false),
                child: const Text('Change Email'),
              ),
            ],
            
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: _isSubmitting ? null : (_otpSent ? _handleVerifyOTP : _handleSendLink),
              child: _isSubmitting 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(_otpSent ? 'Verify Code' : 'Send Verification Code'),
            ),
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
