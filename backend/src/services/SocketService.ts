import { Server, Socket } from 'socket.io';
import { RideService } from './RideService';
import { LocationService } from './LocationService';
import redis from '../utils/redis';
import logger from '../utils/logger';

export class SocketService {
  private io: Server;
  private readonly LOCATIONS_KEY = 'active_locations';
  private readonly COOLDOWN_PREFIX = 'cooldown:';

  constructor(io: Server) {
    this.io = io;
    this.initialize();
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Admin room logic
      socket.on('join_admin', async () => {
        socket.join('admin_room');
        
        // Fetch initial batch of active locations from Redis
        try {
          if (redis.status === 'ready') {
            const locationsData = await redis.hgetall(this.LOCATIONS_KEY);
            const parsedLocations: Record<string, any> = {};
            
            for (const [rideId, data] of Object.entries(locationsData)) {
              parsedLocations[rideId] = JSON.parse(data);
            }
            
            socket.emit('initial_locations', parsedLocations);
            logger.info(`Admin ${socket.id} joined admin room and received initial data from Redis.`);
          }
        } catch (error) {
          logger.error('Error fetching initial locations from Redis:', error);
        }
      });

      this.setupHandlers(socket);

      socket.on('disconnect', async () => {
        logger.info(`User disconnected: ${socket.id}`);
        
        // Offline Cleanup: Remove driver from Redis Geo index
        const driverId = socket.data.driverId;
        if (driverId) {
          try {
            await LocationService.getInstance().removeDriver(driverId);
            logger.info(`Driver ${driverId} removed from active locations due to disconnect.`);
          } catch (error) {
            logger.error(`Error removing driver ${driverId} on disconnect:`, error);
          }
        }
      });
    });
  }

  private setupHandlers(socket: Socket) {
    // Join a specific ride room for coordination
    socket.on('join_ride', (rideId: string) => {
      socket.join(rideId);
      logger.info(`Socket ${socket.id} joined ride room: ${rideId}`);
    });

    // Handle real-time chat messages
    socket.on('send_message', (data: { rideId: string; senderName: string; message: string; timestamp: string }) => {
      this.io.to(data.rideId).emit('receive_message', data);
    });

    // Handle Emergency SOS Alerts
    socket.on('trigger_sos', (data: { rideId: string; userId: string; userName: string; location: string }) => {
      logger.warn(`🚨 SOS ALERT from ${data.userName} on ride ${data.rideId}`);
      this.io.to(data.rideId).emit('sos_triggered', data);
      this.io.to('admin_room').emit('admin_sos_alert', data);
    });

    // Handle live location updates from Driver
    socket.on('update_location', async (data: { driverId: string; rideId: string; latitude: number; longitude: number }) => {
      // Store driverId in socket data for cleanup on disconnect
      socket.data.driverId = data.driverId;

      const locationInfo = { 
        lat: data.latitude, 
        lng: data.longitude, 
        lastUpdate: Date.now() 
      };

      try {
        // 1. Update LocationService (Redis GEO index or In-Memory fallback)
        await LocationService.getInstance().updateDriverLocation(
          data.driverId, 
          data.latitude, 
          data.longitude
        );

        // 2. Update Legacy Redis Hash for persistence (Only if Redis is ready)
        if (redis.status === 'ready') {
          await redis.hset(this.LOCATIONS_KEY, data.rideId, JSON.stringify(locationInfo));
        }

        // 3. Broadcast to the ride room (riders)
        this.io.to(data.rideId).emit('location_updated', data);

        // 4. Broadcast to Admin Room
        this.io.to('admin_room').emit('admin_location_update', data);

        // 5. Geofence Check
        const nearbyStop = await RideService.checkLandmarkProximity(data.rideId, data.latitude, data.longitude);
        if (nearbyStop) {
          const cooldownKey = `${this.COOLDOWN_PREFIX}${data.rideId}:${nearbyStop.id}`;
          
          let canNotify = true;
          if (redis.status === 'ready') {
            const setCooldown = await redis.set(cooldownKey, 'active', 'EX', 300, 'NX');
            canNotify = setCooldown === 'OK';
          }
          
          if (canNotify) {
            this.io.to(data.rideId).emit('driver_arrived', {
              landmarkName: nearbyStop.landmarkName
            });
            logger.info(`Driver arrived at ${nearbyStop.landmarkName} for ride ${data.rideId}`);
          }
        }
      } catch (error) {
        logger.error('Error in location update or geofence:', error);
      }
    });

    // Matchmaking: Handle ride requests using LocationService
    socket.on('request_ride', async (data: { riderLat: number; riderLng: number; userId: string }) => {
      try {
        logger.info(`Ride requested by ${data.userId} at [${data.riderLat}, ${data.riderLng}]`);
        
        // Find nearby drivers using hybrid matching (5km radius)
        const nearbyDrivers = await LocationService.getInstance().findBestMatch(
          data.riderLat, 
          data.riderLng, 
          5
        );

        socket.emit('nearby_drivers_found', {
          drivers: nearbyDrivers,
          count: nearbyDrivers.length
        });
      } catch (error) {
        logger.error('Error in request_ride matchmaking:', error);
        socket.emit('ride_request_error', { message: 'Could not find nearby drivers' });
      }
    });

    // Cleanup ended rides from cache
    socket.on('ride_ended', async (rideId: string) => {
      try {
        if (redis.status === 'ready') {
          await redis.hdel(this.LOCATIONS_KEY, rideId);
        }
        this.io.to('admin_room').emit('admin_ride_ended', rideId);
        logger.info(`Ride ${rideId} ended and removed from active locations.`);
      } catch (error) {
        logger.error(`Error removing ride ${rideId} from Redis:`, error);
      }
    });
  }

  public emitToRide(rideId: string, event: string, data: any) {
    this.io.to(rideId).emit(event, data);
  }
}
