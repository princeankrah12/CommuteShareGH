import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter/foundation.dart';

class RealtimeService {
  late io.Socket socket;
  final String serverUrl = 'http://10.0.2.2:3001'; // For Android Emulator

  void connect() {
    socket = io.io(serverUrl, 
      io.OptionBuilder()
        .setTransports(['websocket']) // Use WebSocket transport
        .disableAutoConnect() // Disable auto-connection
        .build()
    );

    socket.connect();

    socket.onConnect((_) {
      debugPrint('Connected to Real-time Server');
    });

    socket.onDisconnect((_) => debugPrint('Disconnected from Real-time Server'));
  }

  void joinRide(String rideId) {
    socket.emit('join_ride', rideId);
  }

  void sendMessage(String rideId, String senderName, String message) {
    socket.emit('send_message', {
      'rideId': rideId,
      'senderName': senderName,
      'message': message,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  void onMessageReceived(Function(Map<String, dynamic>) callback) {
    socket.on('receive_message', (data) => callback(Map<String, dynamic>.from(data)));
  }

  void triggerSOS({required String rideId, required String userId, required String userName, String location = 'Unknown'}) {
    socket.emit('trigger_sos', {
      'rideId': rideId,
      'userId': userId,
      'userName': userName,
      'location': location,
    });
  }

  void onSosTriggered(Function(Map<String, dynamic>) callback) {
    socket.on('sos_triggered', (data) => callback(Map<String, dynamic>.from(data)));
  }

  void updateLocation(String rideId, double lat, double lng) {
    socket.emit('update_location', {
      'rideId': rideId,
      'latitude': lat,
      'longitude': lng,
    });
  }

  void onLocationUpdated(Function(Map<String, dynamic>) callback) {
    socket.on('location_updated', (data) => callback(Map<String, dynamic>.from(data)));
  }

  void onDriverArrived(Function(String) callback) {
    socket.on('driver_arrived', (data) => callback(data['landmarkName']));
  }

  void dispose() {
    socket.dispose();
  }
}
