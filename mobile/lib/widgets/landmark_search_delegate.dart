import 'package:flutter/material.dart';
import '../models/app_models.dart';
import '../services/api_service.dart';

class LandmarkSearchDelegate extends SearchDelegate<Landmark?> {
  @override
  String get searchFieldLabel => 'Search landmarks (e.g. Ridge)';

  @override
  List<Widget>? buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () {
            query = '';
          },
        ),
    ];
  }

  @override
  Widget? buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, null),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    if (query.isEmpty) {
      return const Center(child: Text('Type to search for a landmark.'));
    }
    return _buildSearchResults();
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    if (query.isEmpty) {
      return const Center(child: Text('Type to search for a landmark.'));
    }
    return _buildSearchResults();
  }

  Widget _buildSearchResults() {
    return FutureBuilder<List<Landmark>>(
      future: ApiService.searchLandmarks(query),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: \${snapshot.error}'));
        }
        final results = snapshot.data ?? [];
        if (results.isEmpty) {
          return const Center(child: Text('No landmarks found.'));
        }
        return ListView.builder(
          itemCount: results.length,
          itemBuilder: (context, index) {
            final landmark = results[index];
            return ListTile(
              leading: const Icon(Icons.location_on, color: Colors.blueGrey),
              title: Text(landmark.name),
              onTap: () {
                close(context, landmark);
              },
            );
          },
        );
      },
    );
  }
}
