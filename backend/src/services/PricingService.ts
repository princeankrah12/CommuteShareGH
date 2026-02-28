import prisma from './prisma';
import logger from '../utils/logger';
import { TransactionType, TransactionStatus } from '@prisma/client';

// Pricing Constants (based on real Ghanaian fuel metrics)
const BASE_FARE = 5;
const RATE_PER_KM = 1.5;
const AC_MULTIPLIER = 1.15;
const PLATFORM_FEE_PERCENTAGE = 0.10;
const RESCUE_MULTIPLIER = 2.0;

export class PricingService {
  /**
   * Calculates the deterministic fare for a commute trip.
   * 
   * @param distanceKm - Distance of the trip in kilometers
   * @param hasAC - Whether the vehicle has AC enabled
   * @param isRescue - Whether this is an emergency rescue mission
   * @returns Rounded integer fare in Commute Points
   */
  static calculateFare(distanceKm: number, hasAC: boolean, isRescue: boolean): number {
    // 1. Calculate base cost
    let subtotal = BASE_FARE + (distanceKm * RATE_PER_KM);

    // 2. Apply AC Premium
    if (hasAC) {
      subtotal *= AC_MULTIPLIER;
    }

    // 3. Apply Rescue Incentive if applicable
    let total = subtotal;
    if (isRescue) {
      total *= RESCUE_MULTIPLIER;
    }

    // 4. Return rounded whole integer (Commute Points)
    return Math.round(total);
  }

  /**
   * Processes the financial transfer between a rider and a driver.
   * Supports "Commute Debt" by allowing rider points to go negative.
   */
  static async processTripPayment(
    riderId: string,
    driverId: string,
    distanceKm: number,
    hasAC: boolean,
    isRescue: boolean = false,
    tripId?: string
  ): Promise<void> {
    const totalCost = this.calculateFare(distanceKm, hasAC, isRescue);
    const platformCut = Math.round(totalCost * PLATFORM_FEE_PERCENTAGE);
    const driverEarnings = totalCost - platformCut;

    logger.info(`Processing Payment: Rider ${riderId} -> Driver ${driverId} | Total: ${totalCost} CP`);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Deduct full fare from Rider (allowing negative balance for Commute Debt)
        await tx.user.update({
          where: { id: riderId },
          data: {
            commutePoints: { decrement: totalCost }
          }
        });

        // 2. Credit Driver with their earnings (minus platform fee)
        await tx.user.update({
          where: { id: driverId },
          data: {
            commutePoints: { increment: driverEarnings }
          }
        });

        // 3. Optional: Create a Ledger record in the Transaction table
        // We fetch wallets for the ledger link if they exist
        const riderWallet = await tx.wallet.findUnique({ where: { userId: riderId } });
        const driverWallet = await tx.wallet.findUnique({ where: { userId: driverId } });

        await tx.transaction.create({
          data: {
            amount: totalCost, // Stored as decimal in DB, but CP are integers
            reference: `TRIP-${tripId || Date.now()}-${riderId.substring(0, 4)}`,
            type: TransactionType.TRIP_PAYMENT,
            status: TransactionStatus.SUCCESS,
            senderWalletId: riderWallet?.id,
            receiverWalletId: driverWallet?.id,
            tripId: tripId
          }
        });
      });

      logger.info(`Payment Successful: Rider charged ${totalCost} CP. Driver earned ${driverEarnings} CP. Platform fee: ${platformCut} CP.`);
    } catch (error) {
      logger.error('Financial Transaction Failed:', error);
      throw new Error('Trip payment processing failed. Financial integrity maintained.');
    }
  }
}
