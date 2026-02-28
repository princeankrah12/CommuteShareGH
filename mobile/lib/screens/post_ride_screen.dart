import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/user_provider.dart';
import '../services/api_service.dart';

class PostRideScreen extends StatefulWidget {
  const PostRideScreen({super.key});

  @override
  State<PostRideScreen> createState() => _PostRideScreenState();
}

class _PostRideScreenState extends State<PostRideScreen> {
  final _formKey = GlobalKey<FormState>();
  final List<String?> _selectedLandmarks = [null, null]; // Start with 2 empty slots
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 7, minute: 30);
  int _seats = 3;
  final TextEditingController _fareController = TextEditingController(text: "45");
  bool _isSubmitting = false;

  // In a real app, these would be objects with IDs from the database
  final List<Map<String, String>> _landmarks = [
    {'id': 'l1', 'name': 'Adenta Barrier'},
    {'id': 'l2', 'name': 'Ridge'},
    {'id': 'l3', 'name': 'Accra Mall'},
    {'id': 'l4', 'name': 'Tetteh Quarshie'},
    {'id': 'l5', 'name': 'Atomic Junction'},
    {'id': 'l6', 'name': 'Circle'},
    {'id': 'l7', 'name': 'Achimota Mall'},
  ];

  Future<void> _pickDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 7)),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _pickTime() async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (picked != null) setState(() => _selectedTime = picked);
  }

  void _submitRide() async {
    final filteredLandmarks = _selectedLandmarks.where((l) => l != null).toList();
    if (!_formKey.currentState!.validate() || filteredLandmarks.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least an Origin and Destination')),
      );
      return;
    }

    // Check for duplicates
    if (filteredLandmarks.toSet().length != filteredLandmarks.length) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Landmarks cannot be repeated in a single ride')),
      );
      return;
    }

    final userProvider = context.read<UserProvider>();
    if (userProvider.user?.vehicle == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You must register a vehicle before posting a ride.'), backgroundColor: Colors.red),
      );
      return;
    }

    if (!userProvider.user!.isVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Identity verification required to post rides.'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final DateTime departure = DateTime(
        _selectedDate.year, _selectedDate.month, _selectedDate.day,
        _selectedTime.hour, _selectedTime.minute,
      );

      await ApiService.createRide(
        vehicleId: userProvider.user!.vehicle!.id,
        departureTime: departure,
        originId: filteredLandmarks.first!,
        destinationId: filteredLandmarks.last!,
        availableSeats: _seats,
        fare: double.parse(_fareController.text),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('âœ¨ Ride Scheduled Successfully!'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context); // Return to home
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
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
      appBar: AppBar(title: const Text('Post a Ride')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Schedule your Commute',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              const Text('Add stops along your route to pick up more riders.', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 32),
              
              // Dynamic Stops
              ...List.generate(_selectedLandmarks.length, (index) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: Row(
                    children: [
                      Icon(
                        index == 0 ? Icons.my_location : (index == _selectedLandmarks.length - 1 ? Icons.location_on : Icons.more_vert),
                        color: index == _selectedLandmarks.length - 1 ? Colors.redAccent : AppTheme.primaryNavy,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _selectedLandmarks[index],
                          items: _landmarks.map((l) => DropdownMenuItem(value: l['id'], child: Text(l['name']!))).toList(),
                          onChanged: _isSubmitting ? null : (v) => setState(() => _selectedLandmarks[index] = v),
                          hint: Text(index == 0 ? 'Origin' : (index == _selectedLandmarks.length - 1 ? 'Destination' : 'Intermediate Stop')),
                        ),
                      ),
                      if (_selectedLandmarks.length > 2)
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline, color: Colors.grey),
                          onPressed: () => setState(() => _selectedLandmarks.removeAt(index)),
                        ),
                    ],
                  ),
                );
              }),
              
              TextButton.icon(
                onPressed: () => setState(() => _selectedLandmarks.insert(_selectedLandmarks.length - 1, null)),
                icon: const Icon(Icons.add_location_alt_outlined),
                label: const Text('Add Stop along route'),
              ),
              const SizedBox(height: 24),

              // Date & Time
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Date'),
                        InkWell(
                          onTap: _pickDate,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 18, color: AppTheme.primaryNavy),
                                const SizedBox(width: 12),
                                Text(DateFormat('MMM dd, yyyy').format(_selectedDate)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Time'),
                        InkWell(
                          onTap: _pickTime,
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.access_time, size: 18, color: AppTheme.primaryNavy),
                                const SizedBox(width: 12),
                                Text(_selectedTime.format(context)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Seats & Fare
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Available Seats'),
                        Row(
                          children: [
                            _seatButton(Icons.remove, () => setState(() => _seats = _seats > 1 ? _seats - 1 : 1)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0),
                              child: Text('$_seats', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            ),
                            _seatButton(Icons.add, () => setState(() => _seats = _seats < 6 ? _seats + 1 : 6)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('Fare (GHS)'),
                        TextFormField(
                          controller: _fareController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(prefixText: 'GHS '),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submitRide,
                child: _isSubmitting 
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Schedule Ride'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
    );
  }

  Widget _seatButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 20, color: AppTheme.primaryNavy),
      ),
    );
  }
}
