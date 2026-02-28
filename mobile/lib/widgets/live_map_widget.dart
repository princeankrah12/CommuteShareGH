import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/realtime_service.dart';
import '../theme/app_theme.dart';

class LiveMapWidget extends StatefulWidget {
  final String rideId;
  final LatLng initialDriverPos;
  final LatLng destinationPos;

  const LiveMapWidget({
    super.key,
    required this.rideId,
    required this.initialDriverPos,
    required this.destinationPos,
  });

  @override
  State<LiveMapWidget> createState() => _LiveMapWidgetState();
}

class _LiveMapWidgetState extends State<LiveMapWidget> {
  final RealtimeService _realtimeService = RealtimeService();
  late LatLng _driverPos;
  final MapController _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _driverPos = widget.initialDriverPos;
    _realtimeService.connect();
    _realtimeService.joinRide(widget.rideId);
    
    _realtimeService.onLocationUpdated((data) {
      if (mounted) {
        setState(() {
          _driverPos = LatLng(data['latitude'], data['longitude']);
        });
      }
    });
  }

  @override
  void dispose() {
    _realtimeService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: 250,
        child: FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _driverPos,
            initialZoom: 14.0,
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.commuteshare.mobile',
            ),
            MarkerLayer(
              markers: [
                // Destination Marker
                Marker(
                  point: widget.destinationPos,
                  width: 40,
                  height: 40,
                  child: const Icon(Icons.location_on, color: Colors.red, size: 40),
                ),
                // Driver Marker
                Marker(
                  point: _driverPos,
                  width: 50,
                  height: 50,
                  child: const Column(
                    children: [
                      Icon(Icons.directions_car, color: AppTheme.primaryNavy, size: 30),
                      Text('Driver', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, backgroundColor: Colors.white70)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
