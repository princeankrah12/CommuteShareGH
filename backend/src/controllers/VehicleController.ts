import { Response } from 'express';
import { VehicleService } from '../services/VehicleService';
import { AuthRequest } from '../middlewares/authMiddleware';
import logger from '../utils/logger';

export class VehicleController {
  /**
   * Register or update a vehicle for the current user
   */
  static async register(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.id;
      const { make, model, year, licensePlate, color, seatCapacity } = req.body;

      if (!make || !model || !licensePlate || !year || !seatCapacity) {
        return res.status(400).json({ 
          error: 'Missing required vehicle information (make, model, year, licensePlate, seatCapacity)' 
        });
      }

      logger.info(`Registering vehicle for user ${ownerId}: ${year} ${make} ${model} (${licensePlate})`);
      
      const vehicle = await VehicleService.registerVehicle({
        ownerId,
        make,
        model,
        year: parseInt(year),
        licensePlate,
        color: color || 'Unknown',
        seatCapacity: parseInt(seatCapacity),
      });

      res.status(201).json({ message: 'Vehicle registered successfully', vehicle });
    } catch (error: any) {
      logger.error('Vehicle registration error:', { error });
      res.status(500).json({ error: error.message });
    }
  }

  static async getMyVehicles(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.id;
      const vehicles = await VehicleService.getVehiclesByOwner(ownerId);
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getMyVehicle(req: AuthRequest, res: Response) {
    try {
      const ownerId = req.user!.id;
      const vehicle = await VehicleService.getVehicleByDriver(ownerId);
      if (!vehicle) {
        return res.status(404).json({ error: 'No vehicle found for this driver' });
      }
      res.json(vehicle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
