import prisma from './prisma';
import { GeohashService } from './GeohashService';
import { RideStatus, CommutePreference } from '@prisma/client';
import logger from '../utils/logger';

export class RescueService {
  /**
   * Triggers an SOS emergency protocol for a breakdown.
   * Aborts the current ride and notifies nearby carpool drivers.
   */
  static async triggerSOS(rideId: string, breakdownLat: number, breakdownLng: number): Promise<void> {
    logger.error(`SOS Triggered for Ride ${rideId} at [${breakdownLat}, ${breakdownLng}]`);

    try {
      // Step 1: Fetch the Ride and update its status to ABORTED
      const ride = await prisma.ride.update({
        where: { id: rideId },
        data: { status: RideStatus.ABORTED },
        include: { 
          bookings: { where: { status: 'CONFIRMED' } } 
        }
      });

      const strandedRidersCount = ride.bookings.length;

      // Step 2 & 3: Get neighboring H3 hexes for the breakdown location
      const neighboringHexes = GeohashService.getBucketNeighbors(breakdownLat, breakdownLng);

      // Step 4: Find available carpool drivers in the neighboring hexes
      // In a real production app, we would query a real-time 'active_drivers' table/Redis.
      // For this implementation, we check users with CommutePreference.CARPOOL 
      // whose homeGeohash is in the neighboring hexes.
      const potentialRescuers = await prisma.commuteProfile.findMany({
        where: {
          preference: CommutePreference.CARPOOL,
          homeGeohash: { in: neighboringHexes },
          user: {
            id: { not: ride.driverId } // Don't notify the driver who broke down
          }
        },
        include: { user: true }
      });

      // Step 5: Notify potential rescuers
      for (const profile of potentialRescuers) {
        this.sendRescuePushNotification(
          profile.userId,
          breakdownLat,
          breakdownLng,
          strandedRidersCount
        );
      }

      logger.info(`SOS Protocol: Notified ${potentialRescuers.length} potential rescuers for Ride ${rideId}`);
    } catch (error) {
      logger.error(`Failed to trigger SOS for Ride ${rideId}:`, error);
      throw error;
    }
  }

  /**
   * Handles a driver accepting a rescue mission.
   * Re-assigns the aborted ride's riders to the new driver and awards points.
   */
  static async acceptRescue(driverId: string, rideId: string): Promise<void> {
    logger.info(`Driver ${driverId} accepted rescue for Ride ${rideId}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Verify the ride is still ABORTED and needs rescue
        const ride = await tx.ride.findUnique({
          where: { id: rideId },
          include: { bookings: { where: { status: 'CONFIRMED' } } }
        });

        if (!ride || ride.status !== RideStatus.ABORTED) {
          throw new Error('Rescue no longer available or ride not found.');
        }

        // 2. Update the Ride with the new driver and reset status to ACTIVE (or a new RESCUED status)
        // For simplicity, we'll keep it as ACTIVE or SCHEDULED so they can complete it.
        await tx.ride.update({
          where: { id: rideId },
          data: { 
            driverId: driverId,
            status: RideStatus.ACTIVE 
          }
        });

        // 3. Award Commute Points bonus to the rescuer for saving the day
        await tx.user.update({
          where: { id: driverId },
          data: {
            commutePoints: { increment: 50 } // "Rescue Bonus"
          }
        });

        logger.info(`Rescue successful: Ride ${rideId} handed over to Driver ${driverId}. 50 points awarded.`);
      });
    } catch (error) {
      logger.error(`Failed to accept rescue for Ride ${rideId} by Driver ${driverId}:`, error);
      throw error;
    }
  }

  /**
   * Placeholder for sending push notifications via Firebase/OneSignal.
   */
  private static sendRescuePushNotification(
    driverId: string, 
    lat: number, 
    lng: number, 
    ridersCount: number
  ) {
    // Logic to call FCM / SocketService would go here
    logger.info(`[PUSH NOTIFICATION] To: ${driverId} | MSG: Emergency Rescue Needed! ${ridersCount} riders stranded near you.`);
  }
}
