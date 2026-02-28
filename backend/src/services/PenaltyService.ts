import prisma from './prisma';
import { RescueService } from './RescueService';
import { PodService } from './PodService';
import { CommutePreference } from '@prisma/client';
import logger from '../utils/logger';

const RIDER_NO_SHOW_FEE = 50;
const DRIVER_BAIL_FEE = 150;
const MAX_STRIKES = 2;

export class PenaltyService {
  /**
   * Processes a rider no-show: penalizes points and issues a strike.
   */
  static async processRiderNoShow(rideId: string, riderId: string, driverId: string): Promise<void> {
    logger.warn(`Processing Rider No-Show: Rider ${riderId} for Ride ${rideId}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Deduct fee from rider
        await tx.user.update({
          where: { id: riderId },
          data: { commutePoints: { decrement: RIDER_NO_SHOW_FEE } }
        });

        // 2. Add fee to driver as compensation
        await tx.user.update({
          where: { id: driverId },
          data: { commutePoints: { increment: RIDER_NO_SHOW_FEE } }
        });

        // 3. Issue accountability strike
        await this.issueStrike(riderId, tx);
      });
    } catch (error) {
      logger.error(`Failed to process rider no-show for ${riderId}:`, error);
      throw error;
    }
  }

  /**
   * Processes a driver cancellation/breakdown: penalizes points, issues a strike, and triggers SOS.
   */
  static async processDriverCancellation(
    podId: string,
    driverId: string,
    rideId: string,
    breakdownLat: number,
    breakdownLng: number
  ): Promise<void> {
    logger.error(`Processing Driver Cancellation: Driver ${driverId} for Ride ${rideId} in Pod ${podId}`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Deduct bail fee from driver
        await tx.user.update({
          where: { id: driverId },
          data: { commutePoints: { decrement: DRIVER_BAIL_FEE } }
        });

        // 2. Issue accountability strike
        await this.issueStrike(driverId, tx);
      });

      // 3. Crucial Step: Trigger SOS to rescue stranded riders (External to transaction)
      await RescueService.triggerSOS(rideId, breakdownLat, breakdownLng);
      
    } catch (error) {
      logger.error(`Failed to process driver cancellation for ${driverId}:`, error);
      throw error;
    }
  }

  /**
   * Internal Helper: Increments strikes and handles suspension logic if threshold reached.
   * @param tx - Prisma transaction client
   */
  private static async issueStrike(userId: string, tx: any): Promise<void> {
    // 1. Increment strike count
    const profile = await tx.commuteProfile.update({
      where: { userId },
      data: { strikes: { increment: 1 } },
      include: { user: { include: { podMemberships: true } } }
    });

    logger.info(`Strike issued to User ${userId}. Current strikes: ${profile.strikes}`);

    // 2. Check for suspension threshold
    if (profile.strikes >= MAX_STRIKES) {
      logger.warn(`User ${userId} reached MAX_STRIKES. Suspending from Rotation mode.`);

      // Update profile to CARPOOL only and disable suggestions
      await tx.commuteProfile.update({
        where: { userId },
        data: {
          preference: CommutePreference.CARPOOL,
          openToSuggestions: false
        }
      });

      // 3. Remove from any active CarpoolPod
      const activeMembership = profile.user.podMemberships[0];
      if (activeMembership) {
        const podId = activeMembership.podId;
        
        // Note: PodService.handleMemberDropout handles DB deletion and healing.
        // Since it starts its own transaction, we call it via a non-transactional process 
        // to avoid nested transaction errors, or handle the deletion here if strictly necessary.
        // For reliability, we trigger it here:
        await PodService.handleMemberDropout(podId, userId);

        logger.info(`User ${userId} removed from Pod ${podId} due to suspension.`);
        
        // Mock/Placeholder for push notification
        logger.info(`[NOTIFICATION] Sent to ${userId}: Your account is suspended from Rotation mode due to repeated violations.`);
      }
    }
  }
}
