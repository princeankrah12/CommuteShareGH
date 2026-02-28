import prisma from './prisma';
import { VehicleStatus } from '@prisma/client';

export class VehicleService {
  /**
   * Register or update a vehicle
   */
  static async registerVehicle(data: {
    ownerId: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    seatCapacity: number;
  }) {
    // 1. Check if a vehicle with this license plate already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { licensePlate: data.licensePlate },
    });

    if (existingVehicle) {
      // Ensure the owner is the same if updating
      if (existingVehicle.ownerId !== data.ownerId) {
        throw new Error('Vehicle is already registered to another user.');
      }

      // Update existing vehicle
      return await prisma.vehicle.update({
        where: { id: existingVehicle.id },
        data: {
          make: data.make,
          model: data.model,
          year: data.year,
          color: data.color,
          seatCapacity: data.seatCapacity,
          status: VehicleStatus.PENDING, // Reset to pending if updated
        },
      });
    }

    // 2. Create new vehicle
    return await prisma.vehicle.create({
      data: {
        ownerId: data.ownerId,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        licensePlate: data.licensePlate,
        seatCapacity: data.seatCapacity,
        status: VehicleStatus.PENDING,
      },
    });
  }

  /**
   * Get all vehicles for a specific driver/owner
   */
  static async getVehiclesByOwner(ownerId: string) {
    return await prisma.vehicle.findMany({
      where: { ownerId },
    });
  }

  /**
   * Get a single vehicle by its driver/owner (Compatibility helper)
   */
  static async getVehicleByDriver(ownerId: string) {
    return await prisma.vehicle.findFirst({
      where: { ownerId },
    });
  }
}
