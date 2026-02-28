import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../screens/ride_results_screen.dart';
import '../providers/user_provider.dart';
import '../services/api_service.dart';

class RideSearchCard extends StatefulWidget {
  const RideSearchCard({super.key});

  @override
  State<RideSearchCard> createState() => _RideSearchCardState();
}

class _RideSearchCardState extends State<RideSearchCard> {
  bool _communityOnly = false;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    final user = context.watch<UserProvider>().user;
    final String? primaryGroup = user?.affinityGroups.isNotEmpty == true ? user!.affinityGroups.first : null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Find a Ride',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              if (primaryGroup != null)
                Row(
                  children: [
                    const Text('Community Only', style: TextStyle(fontSize: 10, color: Colors.grey)),
                    Switch(
                      value: _communityOnly,
                      onChanged: (val) => setState(() => _communityOnly = val),
                      activeThumbColor: AppTheme.primaryNavy,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 16),
          _buildLocationField(
            icon: Icons.my_location,
            label: 'Pickup Landmark',
            value: 'Adenta Barrier',
          ),
          Padding(
            padding: const EdgeInsets.only(left: 36.0),
            child: Divider(color: Colors.grey[200]),
          ),
          _buildLocationField(
            icon: Icons.location_on,
            label: 'Destination Landmark',
            value: 'Ridge',
            iconColor: Colors.redAccent,
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _isLoading ? null : () async {
              debugPrint('RideSearchCard: Search button clicked');
              setState(() => _isLoading = true);
              
              final navigator = Navigator.of(context);
              final scaffoldMessenger = ScaffoldMessenger.of(context);

              try {
                debugPrint('RideSearchCard: Calling ApiService.searchRides...');
                // In a real app, we'd use actual landmark IDs from a dropdown
                final rides = await ApiService.searchRides(
                  'l1', 
                  'l2', 
                  DateTime.now(),
                  affinityGroupId: _communityOnly ? primaryGroup : null,
                );
                debugPrint('RideSearchCard: Search successful, found ${rides.length} rides');

                if (!mounted) return;

                navigator.push(
                  MaterialPageRoute(
                    builder: (_) => RideResultsScreen(
                      rides: rides,
                      originName: 'Adenta Barrier',
                      destinationName: 'Ridge',
                    ),
                  ),
                );
              } catch (e) {
                debugPrint('RideSearchCard: Search failed with error: $e');
                if (!mounted) return;
                scaffoldMessenger.showSnackBar(
                  SnackBar(content: Text('Search failed: $e')),
                );
              } finally {
                debugPrint('RideSearchCard: Search finished');
                if (mounted) setState(() => _isLoading = false);
              }
            },
            child: _isLoading 
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text('Search Corridors'),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationField({
    required IconData icon,
    required String label,
    required String value,
    Color iconColor = AppTheme.primaryNavy,
  }) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 20),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
              Text(
                value,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
