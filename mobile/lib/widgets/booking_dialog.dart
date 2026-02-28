import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/app_models.dart';
import '../providers/user_provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../screens/active_ride_screen.dart';

class BookingDialog extends StatefulWidget {
  final Ride ride;

  const BookingDialog({super.key, required this.ride});

  @override
  State<BookingDialog> createState() => _BookingDialogState();
}

class _BookingDialogState extends State<BookingDialog> {
  String _selectedMode = 'CONTRIBUTION';
  bool _isBooking = false;

  Future<void> _handleConfirm() async {
    setState(() => _isBooking = true);
    
    final userProvider = context.read<UserProvider>();
    final navigator = Navigator.of(context);
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    try {
      // In a real app, we'd also send the selectedMode (Rotation vs Contribution)
      // The backend currently defaults to Wallet deduction (Contribution)
      await ApiService.bookRide(
        rideId: widget.ride.id,
        pickupId: widget.ride.stops.first.landmarkId,
        dropoffId: widget.ride.stops.last.landmarkId,
      );

      // Refresh profile to show new balance
      if (userProvider.user != null) {
        await userProvider.fetchProfile(userProvider.user!.id);
      }

      if (mounted) {
        navigator.pop(); // Close dialog
        
        // Show success and navigate to the "Active Ride" screen
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('âœ¨ Ride booked successfully! GHS 1.00 fee applied.'),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );

        navigator.push(
          MaterialPageRoute(
            builder: (_) => ActiveRideScreen(
              rideId: widget.ride.id,
              passengerCount: widget.ride.stops.length + 1, // Example logic
            ),
          ),
        );
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
      if (mounted) setState(() => _isBooking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserProvider>().user;
    final bool hasPoints = (user?.commutePoints ?? 0) > 0;
    final double totalCost = widget.ride.fare + 1.0; // Fare + GHS 1.00 platform fee
    final bool hasBalance = (user?.walletBalance ?? 0) >= totalCost;

    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        left: 24,
        right: 24,
        top: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Confirm Booking',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text('A platform fee of GHS 1.00 applies to all bookings.', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 24),
          const Text('Choose your payment mode:', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          
          // Contribution Mode Card
          _buildModeOption(
            id: 'CONTRIBUTION',
            title: 'Contribution Mode',
            subtitle: hasBalance ? 'Pay with Wallet Balance' : 'Insufficient balance (Need GHS ${totalCost.toStringAsFixed(2)})',
            trailing: 'GHS ${totalCost.toStringAsFixed(2)}',
            icon: Icons.account_balance_wallet_outlined,
            isEnabled: hasBalance,
            error: !hasBalance,
          ),
          const SizedBox(height: 12),
          
          // Rotation Mode Card
          _buildModeOption(
            id: 'ROTATION',
            title: 'Rotation Mode',
            subtitle: 'Spend Commute Points',
            trailing: '1 Point',
            icon: Icons.sync,
            isEnabled: hasPoints,
            disabledReason: !hasPoints ? 'Insufficient points' : null,
          ),
          
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: (_isBooking || (_selectedMode == 'CONTRIBUTION' && !hasBalance)) ? null : _handleConfirm,
            child: _isBooking 
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text('Confirm Booking'),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildModeOption({
    required String id,
    required String title,
    required String subtitle,
    required String trailing,
    required IconData icon,
    required bool isEnabled,
    String? disabledReason,
    bool error = false,
  }) {
    final bool isSelected = _selectedMode == id;

    return InkWell(
      onTap: isEnabled ? () => setState(() => _selectedMode = id) : null,
      child: Opacity(
        opacity: isEnabled ? 1.0 : 0.6,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppTheme.primaryNavy : (error ? Colors.red[200]! : Colors.grey[300]!),
              width: isSelected ? 2 : 1,
            ),
            color: isSelected ? AppTheme.primaryNavy.withValues(alpha: 0.05) : (error ? Colors.red[50] : Colors.transparent),
          ),
          child: Row(
            children: [
              Icon(icon, color: isSelected ? AppTheme.primaryNavy : (error ? Colors.red : Colors.grey)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(
                      disabledReason ?? subtitle, 
                      style: TextStyle(fontSize: 11, color: error ? Colors.red : (isEnabled ? Colors.grey : Colors.grey[400])),
                    ),
                  ],
                ),
              ),
              Text(
                trailing,
                style: TextStyle(
                  fontWeight: FontWeight.bold, 
                  color: error ? Colors.red : AppTheme.primaryNavy,
                  decoration: isEnabled ? null : TextDecoration.lineThrough,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
