import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:convert';
import '../models/app_models.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  static Database? _database;

  factory DatabaseService() => _instance;

  DatabaseService._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), 'commuteshare.db');
    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE user_cache (
            id TEXT PRIMARY KEY,
            data TEXT
          )
        ''');
        await db.execute('''
          CREATE TABLE rides_cache (
            id TEXT PRIMARY KEY,
            data TEXT,
            corridor_key TEXT
          )
        ''');
      },
    );
  }

  // Cache User Profile
  Future<void> cacheUser(User user) async {
    final db = await database;
    await db.insert(
      'user_cache',
      {'id': user.id, 'data': jsonEncode({
        'id': user.id,
        'email': user.email,
        'fullName': user.fullName,
        'phoneNumber': user.phoneNumber,
        'isVerified': user.isVerified,
        'walletBalance': user.walletBalance,
        'commutePoints': user.commutePoints,
        'trustScore': user.trustScore,
        'referralCode': user.referralCode,
      })},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Get Cached User
  Future<User?> getCachedUser(String userId) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'user_cache',
      where: 'id = ?',
      whereArgs: [userId],
    );

    if (maps.isEmpty) return null;
    return User.fromJson(jsonDecode(maps.first['data']));
  }

  // Cache Ride Search Results
  Future<void> cacheRides(String originId, String destId, List<Ride> rides) async {
    final db = await database;
    final String corridorKey = '${originId}_$destId';
    
    // Clear old cache for this corridor
    await db.delete('rides_cache', where: 'corridor_key = ?', whereArgs: [corridorKey]);

    for (var ride in rides) {
      await db.insert('rides_cache', {
        'id': ride.id,
        'corridor_key': corridorKey,
        'data': jsonEncode({
          'id': ride.id,
          'driverId': ride.driverId,
          'driver': {
            'fullName': ride.driverName,
            'isVerified': ride.driverVerified,
            'trustScore': ride.driverTrustScore,
          },
          'stops': ride.stops.map((s) => {
            'id': s.id,
            'landmarkId': s.landmarkId,
            'landmark': {'name': s.landmarkName},
            'stopOrder': s.stopOrder,
          }).toList(),
          'departureTime': ride.departureTime.toIso8601String(),
          'fare': ride.fare,
          'availableSeats': ride.availableSeats,
          'carModel': ride.carModel,
          'plateNumber': ride.plateNumber,
        }),
      });
    }
  }

  // Get Cached Rides
  Future<List<Ride>> getCachedRides(String originId, String destId) async {
    final db = await database;
    final String corridorKey = '${originId}_$destId';
    
    final List<Map<String, dynamic>> maps = await db.query(
      'rides_cache',
      where: 'corridor_key = ?',
      whereArgs: [corridorKey],
    );

    return maps.map((item) => Ride.fromJson(jsonDecode(item['data']))).toList();
  }
}
