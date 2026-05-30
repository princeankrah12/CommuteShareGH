import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../theme/app_theme.dart';
import '../providers/user_provider.dart';

class VehicleUploadScreen extends StatefulWidget {
  const VehicleUploadScreen({super.key});

  @override
  State<VehicleUploadScreen> createState() => _VehicleUploadScreenState();
}

class _VehicleUploadScreenState extends State<VehicleUploadScreen> {
  final _formKey = GlobalKey<FormState>();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _plateController = TextEditingController();
  final _colorController = TextEditingController();
  final _capacityController = TextEditingController(text: '4');
  
  final ImagePicker _picker = ImagePicker();
  File? _frontPhoto;
  File? _sidePhoto;
  File? _interiorPhoto;

  bool _hasAC = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _makeController.dispose();
    _modelController.dispose();
    _plateController.dispose();
    _colorController.dispose();
    _capacityController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(String type) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      
      if (image != null) {
        setState(() {
          if (type == 'Front') _frontPhoto = File(image.path);
          if (type == 'Side') _sidePhoto = File(image.path);
          if (type == 'Interior') _interiorPhoto = File(image.path);
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  void _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (!_hasAC) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Functional AC is required for MyCommuteShare.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_frontPhoto == null || _sidePhoto == null || _interiorPhoto == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload all 3 photos.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    
    final userProvider = context.read<UserProvider>();
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      await userProvider.registerVehicle(
        make: _makeController.text.trim(),
        model: _modelController.text.trim(),
        plateNumber: _plateController.text.trim(),
        color: _colorController.text.trim(),
        hasAC: _hasAC,
        seatCapacity: int.parse(_capacityController.text.trim()),
      );
      
      if (mounted) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('✨ Vehicle Registered Successfully!'),
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
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register Vehicle')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Vehicle Details',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text(
                'Help riders identify your car and ensure comfort.',
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 32),
              TextFormField(
                controller: _makeController,
                decoration: const InputDecoration(
                  labelText: 'Make (e.g. Toyota)',
                  prefixIcon: Icon(Icons.directions_car),
                ),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                enabled: !_isSubmitting,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _modelController,
                decoration: const InputDecoration(
                  labelText: 'Model (e.g. Camry)',
                  prefixIcon: Icon(Icons.model_training),
                ),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                enabled: !_isSubmitting,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _plateController,
                      decoration: const InputDecoration(
                        labelText: 'Plate Number',
                        prefixIcon: Icon(Icons.pin),
                      ),
                      validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                      enabled: !_isSubmitting,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _colorController,
                      decoration: const InputDecoration(
                        labelText: 'Color',
                        prefixIcon: Icon(Icons.color_lens),
                      ),
                      validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                      enabled: !_isSubmitting,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _capacityController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Seat Capacity',
                  prefixIcon: Icon(Icons.event_seat),
                  hintText: 'Exclude driver seat',
                ),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  final n = int.tryParse(v);
                  if (n == null || n < 1) return 'Invalid capacity';
                  return null;
                },
                enabled: !_isSubmitting,
              ),
              const SizedBox(height: 24),
              
              // AC Mandate Toggle
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primaryNavy.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primaryNavy.withValues(alpha: 0.1)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.ac_unit, color: AppTheme.primaryNavy),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Functional AC', style: TextStyle(fontWeight: FontWeight.bold)),
                          Text('Mandatory for all rides', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ),
                    Switch(
                      value: _hasAC,
                      onChanged: _isSubmitting ? null : (v) => setState(() => _hasAC = v),
                      activeTrackColor: AppTheme.primaryNavy.withValues(alpha: 0.5),
                      activeThumbColor: AppTheme.primaryNavy,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              const Text(
                'Photos (Front, Side, Interior)',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildPhotoPlaceholder('Front', _frontPhoto),
                  _buildPhotoPlaceholder('Side', _sidePhoto),
                  _buildPhotoPlaceholder('Interior', _interiorPhoto),
                ],
              ),
              
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: _isSubmitting ? null : _handleSubmit,
                child: _isSubmitting 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Complete Registration'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoPlaceholder(String label, File? imageFile) {
    return GestureDetector(
      onTap: _isSubmitting ? null : () => _pickImage(label),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
              image: imageFile != null 
                ? DecorationImage(image: FileImage(imageFile), fit: BoxFit.cover) 
                : null,
            ),
            child: imageFile == null 
              ? const Icon(Icons.add_a_photo, color: Colors.grey)
              : null,
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
    );
  }
}
