import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/wallet_card.dart';
import '../widgets/ride_search_card.dart';
import '../models/app_models.dart';
import '../providers/user_provider.dart';
import '../services/api_service.dart';
import '../services/location_tracking_service.dart';
import './active_ride_screen.dart';
import './vehicle_upload_screen.dart';
import './verification_screen.dart';
import './affinity_verification_screen.dart';
import './post_ride_screen.dart';
import './profile_screen.dart';
import '../widgets/referral_banner.dart';
import '../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool hasApprovedVehicle = false;
  bool isDrivingToday = false;
  bool isLoading = true;

  // Mock ride for demonstration of Active Ride screen
  final Ride mockRide = Ride(
    id: 'ride-123',
    driverId: 'd-dumelo',
    driverName: 'John Dumelo',
    driverVerified: true,
    driverTrustScore: 4.9,
    stops: [
      RideStop(id: 's1', landmarkId: 'l1', landmarkName: 'Adenta Barrier', stopOrder: 0),
      RideStop(id: 's2', landmarkId: 'l2', landmarkName: 'Ridge', stopOrder: 1),
    ],
    departureTime: DateTime.now(),
    fare: 45.0,
    availableSeats: 3,
    carModel: 'Toyota Camry',
    plateNumber: 'GW 4455 - 24',
  );

  @override
  void initState() {
    super.initState();
    _checkVehicleStatus();
  }

  Future<void> _checkVehicleStatus() async {
    try {
      final vehicles = await ApiService.getMyVehicles();
      if (mounted) {
        setState(() {
          hasApprovedVehicle = vehicles.any((v) => v['status'] == 'APPROVED');
          isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error checking vehicle status: $e');
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  void _toggleDrivingMode(bool value) {
    if (!hasApprovedVehicle && value) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vehicle approval required to drive.')),
      );
      return;
    }

    setState(() {
      isDrivingToday = value;
    });

    if (isDrivingToday) {
      LocationTrackingService().startTracking();
    } else {
      LocationTrackingService().stopTracking();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserProvider>().user;
    if (user == null || isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('CommuteShare GH'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
          GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileScreen()),
            ),
            child: const CircleAvatar(
              backgroundColor: Colors.white24,
              child: Icon(Icons.person, color: Colors.white),
            ),
          ),
          const SizedBox(width: 16),
        ],
      ),
      floatingActionButton: !isDrivingToday
          ? FloatingActionButton.extended(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PostRideScreen()),
              ),
              label: const Text('Post a Ride'),
              icon: const Icon(Icons.add),
              backgroundColor: AppTheme.primaryNavy,
              foregroundColor: Colors.white,
            )
          : null,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildRoleToggle(),
            const SizedBox(height: 24),
            if (isDrivingToday) _buildDriverDashboard() else _buildRiderDashboard(user),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleToggle() {
    return Center(
      child: Container(
        width: 300,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(25),
        ),
        child: Stack(
          children: [
            AnimatedAlign(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeInOut,
              alignment: isDrivingToday ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                width: 150,
                height: 50,
                decoration: BoxDecoration(
                  color: AppTheme.primaryNavy,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
              ),
            ),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => _toggleDrivingMode(false),
                    behavior: HitTestBehavior.opaque,
                    child: Center(
                      child: Text(
                        'Riding Today',
                        style: TextStyle(
                          color: !isDrivingToday ? Colors.white : Colors.grey[600],
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _toggleDrivingMode(true),
                    behavior: HitTestBehavior.opaque,
                    child: Center(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (!hasApprovedVehicle)
                            Icon(
                              Icons.lock_outline,
                              size: 14,
                              color: isDrivingToday ? Colors.white : Colors.grey[600],
                            ),
                          if (!hasApprovedVehicle) const SizedBox(width: 4),
                          Text(
                            'Driving Today',
                            style: TextStyle(
                              color: isDrivingToday ? Colors.white : Colors.grey[600],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDriverDashboard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Driver Dashboard',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(24),
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              const SizedBox(
                height: 60,
                width: 60,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryNavy),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Waiting for pod requests...',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              Text(
                'We\'ll notify you when someone on your route needs a ride.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey[600], fontSize: 14),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _buildStatsRow(),
      ],
    );
  }

  Widget _buildStatsRow() {
    return Row(
      children: [
        Expanded(child: _buildStatCard('Today\'s Earnings', 'GH₵ 0.00')),
        const SizedBox(width: 16),
        Expanded(child: _buildStatCard('Active Pods', '0')),
      ],
    );
  }

  Widget _buildStatCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildRiderDashboard(User user) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Welcome back, ${user.fullName.split(' ')[0]}!',
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 8),
            if (user.isVerified)
              const Icon(Icons.verified, color: AppTheme.primaryNavy, size: 20),
          ],
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          children: user.affinityGroups.map((group) => Chip(
            label: Text(group, style: const TextStyle(fontSize: 10, color: AppTheme.primaryNavy)),
            backgroundColor: AppTheme.primaryNavy.withValues(alpha: 0.1),
            side: BorderSide.none,
            padding: EdgeInsets.zero,
            visualDensity: VisualDensity.compact,
          )).toList(),
        ),
        const SizedBox(height: 16),
        const WalletCard(),
        const SizedBox(height: 24),
        const ReferralBanner(),
        const SizedBox(height: 24),
        if (!hasApprovedVehicle) _buildDriverPrompt(),
        const SizedBox(height: 24),
        _buildTrustSection(),
        const SizedBox(height: 24),
        const Text(
          'Find a Carpool',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        const RideSearchCard(),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Your Scheduled Rides',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            TextButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => ActiveRideScreen(rideId: mockRide.id)),
              ),
              child: const Text('View Active'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _buildEmptyState(),
      ],
    );
  }

  Widget _buildTrustSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Trust & Verification',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildTrustButton(
                icon: Icons.badge_outlined,
                label: 'Ghana Card',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const VerificationScreen()),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildTrustButton(
                icon: Icons.business_center_outlined,
                label: 'Work Email',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AffinityVerificationScreen()),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTrustButton({required IconData icon, required String label, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[200]!),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppTheme.primaryNavy),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildDriverPrompt() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.accentGold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.accentGold.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.drive_eta, color: AppTheme.primaryNavy),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Have a car?',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  'Offset your fuel costs by driving.',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ),
          TextButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const VehicleUploadScreen()),
            ),
            child: const Text('Register'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.directions_car_outlined, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 12),
            const Text('No rides scheduled yet.'),
            TextButton(
              onPressed: () {},
              child: const Text('Book a ride'),
            ),
          ],
        ),
      ),
    );
  }
}
