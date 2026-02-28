import { latLngToCell, gridDisk } from 'h3-js';

/**
 * GeohashService
 * Provides spatial indexing utilities using Uber's H3 library to power
 * the carpool matching and rotational pods discovery engine.
 */
export class GeohashService {
  /**
   * Converts coordinates into an H3 hex string at a specific resolution.
   * Resolution 7 creates hexagons roughly 1.2km wide (5.16 sq km).
   */
  static getBucket(lat: number, lng: number, resolution: number = 7): string {
    return latLngToCell(lat, lng, resolution);
  }

  /**
   * Returns a list of the center hex and its immediate 6 neighbors.
   */
  static getBucketNeighbors(lat: number, lng: number, resolution: number = 7): string[] {
    const center = this.getBucket(lat, lng, resolution);
    return gridDisk(center, 1);
  }

  /**
   * Generates a composite match key for lightning-fast database lookups.
   * Format: {homeHex}_{workHex}_{time}
   */
  static generateMatchKey(
    homeLat: number,
    homeLng: number,
    workLat: number,
    workLng: number,
    departureTime: string
  ): string {
    const homeHex = this.getBucket(homeLat, homeLng);
    const workHex = this.getBucket(workLat, workLng);
    
    // Ensure consistent time format (HH:mm)
    const formattedTime = departureTime.trim();

    return `${homeHex}_${workHex}_${formattedTime}`;
  }

  /**
   * Returns an array of 49 possible match keys covering neighboring hexagons.
   * This captures users who live or work just across the boundary of the main hex.
   */
  static getNeighboringKeys(
    homeLat: number,
    homeLng: number,
    workLat: number,
    workLng: number,
    departureTime: string
  ): string[] {
    const homeCenter = this.getBucket(homeLat, homeLng);
    const workCenter = this.getBucket(workLat, workLng);

    // gridDisk(hex, 1) returns the center hex + its 6 immediate neighbors
    const homeNeighbors = gridDisk(homeCenter, 1);
    const workNeighbors = gridDisk(workCenter, 1);
    
    const formattedTime = departureTime.trim();
    const keys: string[] = [];

    // Combine 7 home hexes * 7 work hexes = 49 total permutations
    for (const hHex of homeNeighbors) {
      for (const wHex of workNeighbors) {
        keys.push(`${hHex}_${wHex}_${formattedTime}`);
      }
    }

    return keys;
  }
}
