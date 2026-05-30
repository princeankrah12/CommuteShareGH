import { Request, Response } from 'express';
import prisma from '../services/prisma';
import logger from '../utils/logger';

export class LandmarkController {
  /**
   * Search landmarks by name
   */
  static async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (process.env.USE_MOCK_DATA === 'true') {
        const mockLandmarks = [
          { id: 'l1', name: 'Adenta Barrier', latitude: 5.7072, longitude: -0.1601 },
          { id: 'l2', name: 'Ridge', latitude: 5.5566, longitude: -0.2012 },
          { id: 'l3', name: 'Accra Mall', latitude: 5.6200, longitude: -0.1736 },
          { id: 'l4', name: 'Tetteh Quarshie', latitude: 5.6133, longitude: -0.1867 },
          { id: 'l5', name: 'Atomic Junction', latitude: 5.6486, longitude: -0.1764 },
          { id: 'l6', name: 'Circle', latitude: 5.5593, longitude: -0.2097 },
          { id: 'l7', name: 'Achimota Mall', latitude: 5.6417, longitude: -0.2333 },
          { id: 'l8', name: 'Tema Station', latitude: 5.5450, longitude: -0.2030 },
          { id: 'l9', name: 'Dansoman', latitude: 5.5500, longitude: -0.2600 },
          { id: 'l10', name: 'Spintex Road', latitude: 5.6333, longitude: -0.1000 },
        ];

        if (!q) return res.json(mockLandmarks);
        
        const filtered = mockLandmarks.filter(l => 
          l.name.toLowerCase().includes((q as string).toLowerCase())
        );
        return res.json(filtered);
      }

      const landmarks = await prisma.landmark.findMany({
        where: {
          name: {
            contains: q as string,
            mode: 'insensitive',
          },
        },
        take: 10,
      });

      res.json(landmarks);
    } catch (error: any) {
      logger.error('Error searching landmarks:', error.message);
      res.status(500).json({ error: 'Internal server error while searching landmarks' });
    }
  }

  /**
   * Find the nearest landmark to a given coordinate
   */
  static async findNearest(req: Request, res: Response) {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      if (process.env.USE_MOCK_DATA === 'true') {
        // Return Adenta Barrier as mock nearest
        return res.json({ id: 'l1', name: 'Adenta Barrier', latitude: 5.7072, longitude: -0.1601 });
      }

      // Using raw query for PostGIS distance calculation if available, 
      // or simple Euclidean distance for now
      const landmarks = await prisma.$queryRaw`
        SELECT id, name, latitude, longitude
        FROM "Landmark"
        ORDER BY (latitude - ${parseFloat(lat as string)})^2 + (longitude - ${parseFloat(lng as string)})^2
        LIMIT 1
      `;

      res.json((landmarks as any[])[0]);
    } catch (error: any) {
      logger.error('Error finding nearest landmark:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
