import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import '../models/app_models.dart';
import '../providers/user_provider.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';

class LandmarkSearchSheet extends StatefulWidget {
  final String hint;
  const LandmarkSearchSheet({super.key, required this.hint});

  @override
  State<LandmarkSearchSheet> createState() => _LandmarkSearchSheetState();
}

class _LandmarkSearchSheetState extends State<LandmarkSearchSheet> {
  final _searchController = TextEditingController();
  List<Landmark> _results = [];
  bool _isSearching = false;
  bool _isLocating = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) async {
    if (query.length < 2) {
      setState(() => _results = []);
      return;
    }

    setState(() => _isSearching = true);
    try {
      final userProvider = context.read<UserProvider>();
      final results = await userProvider.searchLandmarks(query);
      setState(() => _results = results);
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      setState(() => _isSearching = false);
    }
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isLocating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) throw 'Location services are disabled.';

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) throw 'Permission denied.';
      }

      final position = await Geolocator.getCurrentPosition();
      final landmark = await ApiService.getNearestLandmark(position.latitude, position.longitude);
      
      if (mounted) {
        context.read<UserProvider>().addRecentLandmark(landmark);
        Navigator.pop(context, landmark);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userProvider = context.watch<UserProvider>();
    final recent = userProvider.recentLandmarks;

    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(widget.hint, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _searchController,
            autofocus: true,
            decoration: InputDecoration(
              hintText: 'Search landmark (e.g. Accra Mall)',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _isSearching 
                ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2)))
                : null,
              filled: true,
              fillColor: Colors.grey[100],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            onChanged: _onSearch,
          ),
          const SizedBox(height: 16),
          
          ListTile(
            leading: _isLocating 
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.my_location, color: AppTheme.primaryNavy),
            title: const Text('Use Current Location', style: TextStyle(color: AppTheme.primaryNavy, fontWeight: FontWeight.w600)),
            onTap: _isLocating ? null : _useCurrentLocation,
          ),
          const Divider(),
          
          Expanded(
            child: _searchController.text.isEmpty && _results.isEmpty
              ? _buildRecentList(recent)
              : _buildResultsList(),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentList(List<Landmark> recent) {
    if (recent.isEmpty) {
      return const Center(
        child: Text('No recent locations yet', style: TextStyle(color: Colors.grey)),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 8.0),
          child: Text('Recent Locations', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: recent.length,
            itemBuilder: (context, index) {
              final l = recent[index];
              return ListTile(
                leading: const Icon(Icons.history, color: Colors.grey),
                title: Text(l.name),
                onTap: () {
                  context.read<UserProvider>().addRecentLandmark(l);
                  Navigator.pop(context, l);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildResultsList() {
    if (_results.isEmpty && !_isSearching && _searchController.text.isNotEmpty) {
      return const Center(child: Text('No landmarks found'));
    }
    return ListView.builder(
      itemCount: _results.length,
      itemBuilder: (context, index) {
        final l = _results[index];
        return ListTile(
          leading: const Icon(Icons.location_on_outlined),
          title: Text(l.name),
          onTap: () {
            context.read<UserProvider>().addRecentLandmark(l);
            Navigator.pop(context, l);
          },
        );
      },
    );
  }
}
