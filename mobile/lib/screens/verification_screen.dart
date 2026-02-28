import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smile_id/products/selfie/smile_id_smart_selfie_enrollment.dart';
import 'dart:convert';
import 'dart:io';
import '../providers/user_provider.dart';
import '../theme/app_theme.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final TextEditingController _cardController = TextEditingController();
  bool _isVerifying = false;
  bool _hasCardPhoto = false;
  String? _selfieBase64;

  bool get _hasSelfie => _selfieBase64 != null;

  void _handleVerify() async {
    final String cardId = _cardController.text.trim();
    if (cardId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your Ghana Card Number')),
      );
      return;
    }

    if (!_hasCardPhoto) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload a photo of your Ghana Card')),
      );
      return;
    }

    if (!_hasSelfie) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please take a liveness selfie')),
      );
      return;
    }
    
    setState(() => _isVerifying = true);
    
    final userProvider = context.read<UserProvider>();
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    
    try {
      await userProvider.verifyIdentity(cardId, selfie: _selfieBase64);
      if (mounted) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('✨ Identity & Face Verified! Trust Score +0.8'), 
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        navigator.pop();
      }
    } catch (e) {
      if (mounted) {
        scaffoldMessenger.showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')), 
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  void _captureSmartSelfie() async {
    try {
      final String userId = context.read<UserProvider>().user?.id ?? 'temp_user';
      final navigator = Navigator.of(context);
      final scaffoldMessenger = ScaffoldMessenger.of(context);

      navigator.push(
        MaterialPageRoute(
          builder: (context) => SmileIDSmartSelfieEnrollment(
            userId: userId,
            allowAgentMode: true,
            showAttribution: true,
            onSuccess: (resultJson) async {
              try {
                final Map<String, dynamic> result = jsonDecode(resultJson);
                final String? selfieFile = result['selfieFile'];
                
                if (selfieFile != null) {
                  final bytes = await File(selfieFile).readAsBytes();
                  if (mounted) {
                    setState(() {
                      _selfieBase64 = base64Encode(bytes);
                    });
                    navigator.pop();
                  }
                }
              } catch (e) {
                debugPrint('Error parsing Smile ID result: $e');
                if (mounted) {
                  navigator.pop();
                  scaffoldMessenger.showSnackBar(
                    SnackBar(content: Text('Error processing selfie: $e')),
                  );
                }
              }
            },
            onError: (errorMessage) {
              debugPrint('Smile ID Error: $errorMessage');
              if (mounted) {
                navigator.pop();
                scaffoldMessenger.showSnackBar(
                  SnackBar(content: Text('Selfie capture failed: $errorMessage')),
                );
              }
            },
          ),
        ),
      );
    } catch (e) {
      debugPrint('Smile ID Error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Selfie capture failed: $e')),
        );
      }
    }
  }

  void _simulateCardUpload() async {
    setState(() => _isVerifying = true);
    await Future.delayed(const Duration(seconds: 1));
    if (mounted) {
      setState(() {
        _isVerifying = false;
        _hasCardPhoto = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Identity Verification')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Center(
              child: Icon(Icons.verified_user, size: 60, color: AppTheme.primaryNavy),
            ),
            const SizedBox(height: 16),
            const Text(
              'Identity Verification',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Follow the 3 steps below to verify your professional identity.',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
            const SizedBox(height: 24),
            
            const Text('1. Enter Card Number', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: _cardController,
              decoration: const InputDecoration(
                labelText: 'GHA-XXXXXXXXX-X',
                prefixIcon: Icon(Icons.badge_outlined),
              ),
              enabled: !_isVerifying,
            ),
            
            const SizedBox(height: 24),
            const Text('2. Scan Ghana Card', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildCaptureBox(
              icon: Icons.camera_alt,
              label: 'Front of Ghana Card',
              isDone: _hasCardPhoto,
              onTap: _simulateCardUpload,
            ),
            
            const SizedBox(height: 24),
            const Text('3. Liveness Check', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildCaptureBox(
              icon: Icons.face_retouching_natural,
              label: 'Take a Secure Selfie',
              isDone: _hasSelfie,
              onTap: _captureSmartSelfie,
            ),
            
            const SizedBox(height: 32),
            const Text(
              '🔒 We use Smile ID SmartSelfie™ to ensure you are a real person and match your Ghana Card.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: (_isVerifying || !_hasCardPhoto || !_hasSelfie) ? null : _handleVerify,
              child: _isVerifying 
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Complete Verification'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCaptureBox({required IconData icon, required String label, required bool isDone, required VoidCallback onTap}) {
    return InkWell(
      onTap: _isVerifying || isDone ? null : onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: isDone ? Colors.green.withValues(alpha: 0.05) : Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDone ? Colors.green : Colors.grey[300]!,
            width: isDone ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(isDone ? Icons.check_circle : icon, color: isDone ? Colors.green : Colors.grey[400], size: 32),
            const SizedBox(height: 8),
            Text(
              isDone ? 'Verified' : label, 
              style: TextStyle(color: isDone ? Colors.green : Colors.grey, fontWeight: isDone ? FontWeight.bold : FontWeight.normal),
            ),
          ],
        ),
      ),
    );
  }
}
