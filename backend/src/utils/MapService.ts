import axios from 'axios';
import logger from './logger';
import { PricingService } from '../services/PricingService';

export interface LocationData {
  description: string;
  placeId: string;
  lat: number;
  lng: number;
}

export interface RouteData {
  distanceKm: number;
  durationMin: number;
  encodedPolyline: string;
  estimatedFareCP: number;
}

const GOOGLE_MAPS_URL = process.env.GOOGLE_MAPS_URL || 'https://maps.googleapis.com/maps/api';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'mock_key';

export class MapService {
  /**
   * Google Places Autocomplete search.
   */
  static async searchPlaces(query: string): Promise<LocationData[]> {
    logger.info(`[MapService] Searching for place: ${query}`);
    if (!query || query.length < 2) return [];

    try {
      const response = await axios.get(`${GOOGLE_MAPS_URL}/place/autocomplete/json`, {
        params: {
          input: query,
          key: GOOGLE_MAPS_API_KEY,
        }
      });
      
      if (response.data.predictions) {
        return response.data.predictions.map((p: any) => ({
          description: p.description,
          placeId: p.place_id,
          lat: p.geometry?.location?.lat || 0, 
          lng: p.geometry?.location?.lng || 0
        }));
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      logger.error('MapService searchPlaces Error:', error.message);
      return [];
    }
  }

  /**
   * Google Directions API (Distance, Time, Polyline).
   */
  static async getRoute(startLat: number, startLng: number, endLat: number, endLng: number): Promise<RouteData> {
    logger.info(`[MapService] Calculating route: [${startLat}, ${startLng}] -> [${endLat}, ${endLng}]`);

    try {
      const response = await axios.get(`${GOOGLE_MAPS_URL}/directions/json`, {
        params: {
          origin: `${startLat},${startLng}`,
          destination: `${endLat},${endLng}`,
          key: GOOGLE_MAPS_API_KEY,
        }
      });

      let distanceKm = 0;
      let durationMin = 0;
      let encodedPolyline = '';

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        distanceKm = leg.distance.value / 1000;
        durationMin = Math.round(leg.duration.value / 60);
        encodedPolyline = route.overview_polyline?.points || '';
      } else if (response.data.distanceKm !== undefined) {
        // Direct simulator response
        distanceKm = response.data.distanceKm;
        durationMin = response.data.durationMin;
        encodedPolyline = response.data.encodedPolyline;
      } else {
        throw new Error('No routes found');
      }

      const estimatedFareCP = PricingService.calculateFare(distanceKm, true, false);

      return {
        distanceKm,
        durationMin,
        encodedPolyline,
        estimatedFareCP
      };
    } catch (error: any) {
      logger.error('MapService getRoute Error:', error.message);
      throw new Error('Failed to calculate route');
    }
  }
}
