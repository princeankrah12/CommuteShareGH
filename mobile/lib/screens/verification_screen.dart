import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:smile_id/smile_id.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:convert';
import 'dart:io';
import '../app_config.dart';
import '../providers/user_provider.dart';
import '../theme/app_theme.dart';

class VerificationScreen extends StatefulWidget {
  const VerificationScreen({super.key});

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final TextEditingController _cardController = TextEditingController();
  final ImagePicker _picker = ImagePicker();
  bool _isVerifying = false;
  String? _cardBase64;
  String? _selfieBase64;

  bool get _hasCardPhoto => _cardBase64 != null;
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

      // MOCK LIVENESS CHECK for simulation
      if (AppConfig.useMockIdentity) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(content: Text('Launching Camera for Liveness Check...')),
        );
        
        final XFile? photo = await _picker.pickImage(
          source: ImageSource.camera,
          preferredCameraDevice: CameraDevice.front,
          imageQuality: 50,
        );

        if (photo != null) {
          final bytes = await photo.readAsBytes();
          if (mounted) {
            setState(() {
              _selfieBase64 = base64Encode(bytes);
            });
            scaffoldMessenger.showSnackBar(
              const SnackBar(
                content: Text('Liveness Check Photo Captured!'),
                backgroundColor: Colors.green,
              ),
            );
          }
        }
        return;
      }

      navigator.push(
        MaterialPageRoute(
          builder: (context) => Scaffold(
            appBar: AppBar(title: const Text('Liveness Check')),
            body: SmileIDSmartSelfieEnrollment(
              userId: userId,
              allowAgentMode: true,
              showInstructions: true,
              onSuccess: (resultJson) async {
                final result = jsonDecode(resultJson);
                final String? selfieFile = result['selfieFile'];
                if (selfieFile != null && selfieFile.isNotEmpty) {
                  try {
                    final bytes = await File(selfieFile).readAsBytes();
                    if (mounted) {
                      setState(() {
                        _selfieBase64 = base64Encode(bytes);
                      });
                      navigator.pop();
                    }
                  } catch (e) {
                    debugPrint('Error reading selfie file: $e');
                    if (mounted) {
                      navigator.pop();
                      scaffoldMessenger.showSnackBar(
                        SnackBar(content: Text('Error processing selfie: $e')),
                      );
                    }
                  }
                } else {
                  if (mounted) {
                    navigator.pop();
                    scaffoldMessenger.showSnackBar(
                      const SnackBar(content: Text('Selfie capture cancelled or failed')),
                    );
                  }
                }
              },
              onError: (error) {
                debugPrint('Smile ID Error: $error');
                if (mounted) {
                  navigator.pop();
                  scaffoldMessenger.showSnackBar(
                    SnackBar(content: Text('Selfie capture failed: $error')),
                  );
                }
              },
            ),
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
    try {
      final scaffoldMessenger = ScaffoldMessenger.of(context);
      
      scaffoldMessenger.showSnackBar(
        const SnackBar(content: Text('Launching Camera to Scan Ghana Card...')),
      );

      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 50,
      );

      if (photo != null) {
        final bytes = await photo.readAsBytes();
        setState(() => _isVerifying = true);
        // Simulate "Processing" the ID card locally
        await Future.delayed(const Duration(seconds: 2));
        
        if (mounted) {
          setState(() {
            _isVerifying = false;
            _cardBase64 = base64Encode(bytes);
          });
          scaffoldMessenger.showSnackBar(
            const SnackBar(
              content: Text('Ghana Card Scan Successful!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Card Scan Error: $e');
      if (mounted) {
        setState(() => _isVerifying = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Card scan failed: $e')),
        );
      }
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
              base64Image: _cardBase64,
            ),
            
            const SizedBox(height: 24),
            const Text('3. Liveness Check', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            _buildCaptureBox(
              icon: Icons.face_retouching_natural,
              label: 'Take a Secure Selfie',
              isDone: _hasSelfie,
              onTap: _captureSmartSelfie,
              base64Image: _selfieBase64,
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

  Widget _buildCaptureBox({
    required IconData icon, 
    required String label, 
    required bool isDone, 
    required VoidCallback onTap,
    String? base64Image,
  }) {
    return InkWell(
      onTap: _isVerifying || isDone ? null : onTap,
      child: Container(
        width: double.infinity,
        height: 120,
        decoration: BoxDecoration(
          color: isDone ? Colors.green.withValues(alpha: 0.05) : Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDone ? Colors.green : Colors.grey[300]!,
            width: isDone ? 2 : 1,
          ),
          image: base64Image != null 
            ? DecorationImage(
                image: MemoryImage(base64Decode(base64Image)),
                fit: BoxFit.cover,
                colorFilter: ColorFilter.mode(
                  Colors.black.withValues(alpha: 0.2), 
                  BlendMode.darken
                ),
              )
            : null,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isDone ? Icons.check_circle : icon, 
              color: isDone ? Colors.white : Colors.grey[400], 
              size: 32
            ),
            const SizedBox(height: 8),
            Text(
              isDone ? 'Captured' : label, 
              style: TextStyle(
                color: isDone ? Colors.white : Colors.grey, 
                fontWeight: isDone ? FontWeight.bold : FontWeight.normal,
                shadows: isDone ? [const Shadow(blurRadius: 4, color: Colors.black)] : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
