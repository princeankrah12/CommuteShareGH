import { DayOfWeek, PodRole, CommutePreference } from '@prisma/client';
import prisma from './prisma';
import { PodService } from './PodService';
import { MatchmakerService } from './MatchmakerService';
import logger from '../utils/logger';

export class LeaveService {
  /**
   * Request leave for a user, updating their profile and adjusting their pod's schedule if necessary.
   */
  static async requestLeave(userId: string, startDate: Date, endDate: Date): Promise<void> {
    logger.info(`Processing leave request for user ${userId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Update the user's CommuteProfile
        await tx.commuteProfile.update({
          where: { userId },
          data: {
            isOnLeave: true,
            leaveStartDate: startDate,
            leaveEndDate: endDate,
          },
        });

        // Step 2: Check if the user is in a CarpoolPod
        const podMembership = await tx.podMember.findFirst({
          where: { userId, role: { not: 'GUEST' } },
        });

        if (podMembership) {
          const podId = podMembership.podId;
          const leaveDays = this.getDaysOfWeekInRange(startDate, endDate);

          // Delete their PodSchedule records that fall between startDate and endDate
          await tx.podSchedule.deleteMany({
            where: {
              podId,
              driverId: userId,
              day: { in: leaveDays },
            },
          });

          // Call PodService to temporarily cover their driving shifts
          // Since we are inside a transaction, we might need to handle this carefully.
          // PodService.rebalanceSchedule also starts a transaction.
          // Prisma transactions cannot be nested easily without some tricks or just doing it here.
          // For now, let's just do the rebalance logic here or ensure PodService doesn't double-transaction if possible.
          // Alternatively, call it AFTER the transaction.
        }
      });

      // Post-transaction actions
      const podMembership = await prisma.podMember.findFirst({
        where: { userId, role: { not: 'GUEST' } },
      });

      if (podMembership) {
        const podId = podMembership.podId;
        await PodService.rebalanceSchedule(podId);
        
        // Trigger findGuestRider
        await this.findGuestRider(podId, endDate);
      }
    } catch (error) {
      logger.error(`Error requesting leave for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch a guest rider for a pod while a member is on leave.
   */
  static async findGuestRider(podId: string, endDate: Date): Promise<void> {
    logger.info(`Finding guest rider for pod ${podId} until ${endDate.toISOString()}`);

    try {
      const pod = await prisma.carpoolPod.findUnique({
        where: { id: podId },
      });

      if (!pod) return;

      const matchKey = pod.matchKey;

      // Query the CommuteProfile table for suitable users
      const potentialGuests = await prisma.commuteProfile.findMany({
        where: {
          matchKey,
          preference: CommutePreference.CARPOOL,
          openToSuggestions: true,
          isOnLeave: false,
          user: {
            podMemberships: { none: {} }, // User shouldn't already be in a pod
          },
        },
        take: 5, // Get top 5 matches
      });

      if (potentialGuests.length > 0) {
        // Trigger placeholder function to the top matched user
        const topUser = potentialGuests[0];
        await this.sendGuestInvitePush(topUser.userId, podId);
      }
    } catch (error) {
      logger.error(`Error finding guest rider for pod ${podId}:`, error);
    }
  }

  /**
   * Accept a guest invite, becoming a temporary pod member.
   */
  static async acceptGuestInvite(userId: string, podId: string, endDate: Date): Promise<void> {
    logger.info(`User ${userId} accepted guest invite for pod ${podId} until ${endDate.toISOString()}`);

    try {
      await prisma.podMember.create({
        data: {
          userId,
          podId,
          role: PodRole.GUEST,
          expiresAt: endDate,
        },
      });
    } catch (error) {
      logger.error(`Error accepting guest invite for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * The Daily Cron: Process leave returns and expirations.
   */
  static async processLeaveReturnsAndExpirations(): Promise<void> {
    logger.info('Running daily cron: processLeaveReturnsAndExpirations');
    const now = new Date();

    try {
      // Find all CommuteProfile records where leaveEndDate <= NOW() and reset
      const returningProfiles = await prisma.commuteProfile.findMany({
        where: {
          isOnLeave: true,
          leaveEndDate: { lte: now },
        },
        include: {
          user: {
            include: {
              podMemberships: true,
            },
          },
        },
      });

      for (const profile of returningProfiles) {
        await prisma.commuteProfile.update({
          where: { id: profile.id },
          data: {
            isOnLeave: false,
            leaveStartDate: null,
            leaveEndDate: null,
          },
        });

        // (Optional) Call PodService.generateInitialSchedule for pods with returning users
        const podMembership = profile.user.podMemberships.find(m => m.role !== PodRole.GUEST);
        if (podMembership) {
          const members = await prisma.podMember.findMany({
            where: { podId: podMembership.podId },
          });
          const memberIds = members.map(m => m.userId);
          await PodService.generateInitialSchedule(podMembership.podId, memberIds);
          logger.info(`Reintegrated user ${profile.userId} into pod ${podMembership.podId} schedule.`);
        }
      }

      // Find and DELETE all PodMember records where expiresAt <= NOW()
      const expiredGuests = await prisma.podMember.findMany({
        where: {
          role: PodRole.GUEST,
          expiresAt: { lte: now },
        },
      });

      for (const guest of expiredGuests) {
        await prisma.podMember.delete({
          where: { id: guest.id },
        });
        logger.info(`Removed expired guest rider ${guest.userId} from pod ${guest.podId}`);
      }
    } catch (error) {
      logger.error('Error processing leave returns and expirations:', error);
    }
  }

  /**
   * Placeholder for sending a push notification.
   */
  private static async sendGuestInvitePush(targetUserId: string, podId: string): Promise<void> {
    logger.info(`PUSH SENT: User ${targetUserId} invited to join pod ${podId} as a guest.`);
    // Real implementation would interface with Firebase/OneSignal
  }

  /**
   * Utility to get DayOfWeek enums between two dates.
   */
  private static getDaysOfWeekInRange(start: Date, end: Date): DayOfWeek[] {
    const days: Set<DayOfWeek> = new Set();
    const current = new Date(start);
    const dayMap: DayOfWeek[] = [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    ];

    // Limit search to 7 days to avoid long loops if range is large
    const limit = Math.min(
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)),
      7
    );

    for (let i = 0; i <= limit; i++) {
      days.add(dayMap[current.getDay()]);
      current.setDate(current.getDate() + 1);
      if (days.size === 7) break;
    }

    return Array.from(days);
  }
}
