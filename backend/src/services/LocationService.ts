import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_KEY_ACTIVE_DRIVERS = 'active_drivers';

export interface DriverNearby {
  driverId: string;
  distanceKm: number;
}

interface InMemoryDriver {
  id: string;
  lat: number;
  lng: number;
}

/**
 * LocationService handles real-time driver tracking and matching.
 * FALLBACK: If Redis is unavailable, it automatically switches to an In-Memory engine.
 */
export class LocationService {
  private static instance: LocationService;
  private redis: Redis | null = null;
  private isUsingMock = false;
  private memoryStore: Map<string, InMemoryDriver> = new Map();

  private constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1, // Fail fast to trigger mock mode
        retryStrategy(times) {
          return null; // Don't retry indefinitely
        },
      });

      this.redis.on('error', (err) => {
        if (!this.isUsingMock) {
          console.warn('⚠️ Redis connection failed. Falling back to IN-MEMORY matching engine.');
          this.isUsingMock = true;
        }
      });

      this.redis.on('connect', () => {
        console.log('🚀 Successfully connected to Redis for LocationService');
        this.isUsingMock = false;
      });
    } catch (e) {
      this.isUsingMock = true;
      console.warn('⚠️ Redis not found. Using IN-MEMORY matching engine.');
    }
  }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Updates or adds a driver's location.
   */
  public async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
    if (this.isUsingMock || !this.redis) {
      this.memoryStore.set(driverId, { id: driverId, lat, lng });
      return;
    }

    try {
      await this.redis.geoadd(REDIS_KEY_ACTIVE_DRIVERS, lng, lat, driverId);
    } catch (error) {
      this.isUsingMock = true;
      this.memoryStore.set(driverId, { id: driverId, lat, lng });
    }
  }

  /**
   * Removes a driver from the active drivers set.
   */
  public async removeDriver(driverId: string): Promise<void> {
    if (this.isUsingMock || !this.redis) {
      this.memoryStore.delete(driverId);
      return;
    }

    try {
      await this.redis.zrem(REDIS_KEY_ACTIVE_DRIVERS, driverId);
    } catch (error) {
      this.memoryStore.delete(driverId);
    }
  }

  /**
   * Finds drivers within a specific straight-line radius.
   */
  public async getNearbyDrivers(lat: number, lng: number, radiusKm: number): Promise<DriverNearby[]> {
    if (this.isUsingMock || !this.redis) {
      return this.getNearbyDriversInMemory(lat, lng, radiusKm);
    }

    try {
      const results = await this.redis.georadius(
        REDIS_KEY_ACTIVE_DRIVERS,
        lng,
        lat,
        radiusKm,
        'km',
        'WITHDIST',
        'ASC'
      );

      if (!results || !Array.isArray(results)) return [];

      return (results as any[]).map((res) => ({
        driverId: res[0],
        distanceKm: parseFloat(res[1]),
      }));
    } catch (error) {
      this.isUsingMock = true;
      return this.getNearbyDriversInMemory(lat, lng, radiusKm);
    }
  }

  /**
   * In-Memory implementation of GEORADIUS using the Haversine formula.
   */
  private getNearbyDriversInMemory(lat: number, lng: number, radiusKm: number): DriverNearby[] {
    const nearby: DriverNearby[] = [];

    for (const driver of this.memoryStore.values()) {
      const distance = this.calculateHaversine(lat, lng, driver.lat, driver.lng);
      if (distance <= radiusKm) {
        nearby.push({ driverId: driver.id, distanceKm: distance });
      }
    }

    return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Haversine formula to calculate distance between two points on Earth in KM.
   */
  private calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public async findBestMatch(riderLat: number, riderLng: number, radiusKm: number): Promise<DriverNearby[]> {
    const nearbyDrivers = await this.getNearbyDrivers(riderLat, riderLng, radiusKm);
    if (nearbyDrivers.length === 0) return [];
    return this.filterByRealWorldRoute(nearbyDrivers, riderLat, riderLng);
  }

  private async filterByRealWorldRoute(
    drivers: DriverNearby[], 
    riderLat: number, 
    riderLng: number
  ): Promise<DriverNearby[]> {
    return drivers;
  }
}
