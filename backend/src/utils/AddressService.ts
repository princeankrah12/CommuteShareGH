/**
 * AddressService
 * Handles conversion between Ghana Post GPS (Digital Addresses) and Lat/Lng.
 */
export class AddressService {
  /**
   * MOCK Implementation of Ghana Post GPS lookup.
   * In production, this would call the AsaaseGPS / GhanaPost API.
   */
  static async resolveDigitalAddress(digitalAddress: string): Promise<{ lat: number; lng: number } | null> {
    const cleanAddress = digitalAddress.trim().toUpperCase();
    
    // Pattern: 2 letters - 3 to 4 numbers - 4 numbers (e.g. AK-484-9344)
    const gpPattern = /^[A-Z]{2}-\d{3,4}-\d{4}$/;
    
    if (!gpPattern.test(cleanAddress)) {
      throw new Error('Invalid Ghana Post GPS format. Expected XX-000-0000');
    }

    // Mock coordinates for specific regions
    const regionPrefix = cleanAddress.substring(0, 2);
    const mockCoordinates: { [key: string]: { lat: number; lng: number } } = {
      'GA': { lat: 5.6037, lng: -0.1870 }, // Greater Accra
      'AK': { lat: 6.6666, lng: -1.6163 }, // Ashanti (Kumasi)
      'WS': { lat: 4.8917, lng: -1.7522 }, // Western (Takoradi)
      'ER': { lat: 6.0900, lng: -0.2600 }, // Eastern (Koforidua)
    };

    // Return region center + slight random offset to simulate precise location
    const base = mockCoordinates[regionPrefix] || { lat: 5.6037, lng: -0.1870 };
    return {
      lat: base.lat + (Math.random() - 0.5) * 0.01,
      lng: base.lng + (Math.random() - 0.5) * 0.01,
    };
  }
}
