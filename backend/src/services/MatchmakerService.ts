import prisma from './prisma';
import { GeohashService } from './GeohashService';
import { CommuteProfile, CarpoolPod, PodRole } from '@prisma/client';
import { PodService } from './PodService';
import logger from '../utils/logger';

export class MatchmakerService {
  /**
   * Real-time matching for users joining the Rotation pool.
   * Checks for existing pods with empty seats on the same route.
   */
  static async attemptInstantMatch(userId: string, profile: CommuteProfile): Promise<CarpoolPod | null> {
    logger.info(`Attempting instant match for user ${userId}...`);

    // 1. Generate the set of match keys (center + neighbors)
    const matchKeys = GeohashService.getNeighboringKeys(
      0, 0, 0, 0, // Placeholder coords; in real app, these come from profile.homeLat etc
      profile.departureTime
    );
    
    // Note: Since CommuteProfile currently stores geohashes and not raw coordinates, 
    // in a production environment, we'd either reverse the geohash or use the profile's 
    // existing matchKey and calculate neighbors based on the H3 hex.
    const baseKey = profile.matchKey;

    try {
      // 2. Find a pod that needs a replacement on a matching route
      const pod = await prisma.carpoolPod.findFirst({
        where: {
          needsReplacement: true,
          matchKey: { in: [baseKey, ...matchKeys] }
        },
        include: { members: true }
      });

      if (pod) {
        logger.info(`Instant match found! Adding user ${userId} to pod ${pod.name}`);

        return await prisma.$transaction(async (tx) => {
          // Add user as a member
          await tx.podMember.create({
            data: {
              podId: pod.id,
              userId: userId,
              role: PodRole.MEMBER
            }
          });

          // Check if pod is now full (e.g., 4 members)
          const memberCount = pod.members.length + 1;
          const isFull = memberCount >= 4;

          // Update pod status
          return await tx.carpoolPod.update({
            where: { id: pod.id },
            data: { needsReplacement: !isFull }
          });
        });
      }
    } catch (error) {
      logger.error('Instant match failed:', error);
    }

    return null;
  }

  /**
   * Batch worker to group unmatched users into new pods.
   * Typically runs 3 times a day (12PM, 6PM, Midnight).
   */
  static async runBatchClustering() {
    logger.info('Starting batch clustering job...');

    try {
      // 1. Get all unmatched rotation users
      const unmatchedProfiles = await prisma.commuteProfile.findMany({
        where: {
          preference: 'ROTATION',
          user: {
            podMemberships: { none: {} }
          }
        },
        include: { user: true }
      });

      // 2. Group users by matchKey in memory
      const groups = new Map<string, CommuteProfile[]>();
      for (const profile of unmatchedProfiles) {
        const key = profile.matchKey;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(profile);
      }

      // 3. Process groups to create pods
      for (const [matchKey, profiles] of groups.entries()) {
        if (profiles.length >= 3) {
          logger.info(`Creating new pod for matchKey: ${matchKey} (${profiles.length} users)`);
          
          await prisma.$transaction(async (tx) => {
            const firstProfile = profiles[0];
            
            // Create the Pod
            const pod = await tx.carpoolPod.create({
              data: {
                name: `${firstProfile.homeGeohash.split('_')[0]} to ${firstProfile.workGeohash.split('_')[0]} Pod`,
                inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                origin: firstProfile.homeGeohash,
                destination: firstProfile.workGeohash,
                matchKey: matchKey,
                needsReplacement: profiles.length < 4 // Still has space if < 4
              }
            });

            // Add all members
            for (const p of profiles) {
              await tx.podMember.create({
                data: {
                  podId: pod.id,
                  userId: p.userId,
                  role: PodRole.MEMBER // First one could be ADMIN
                }
              });
            }

            // Generate initial schedule
            await this.generateInitialSchedule(pod.id, profiles.map(p => p.userId));
          });
        }
      }
    } catch (error) {
      logger.error('Batch clustering failed:', error);
    }
  }

  /**
   * Generates the first weekly driving rotation using PodService.
   */
  private static async generateInitialSchedule(podId: string, userIds: string[]) {
    logger.info(`Generating initial schedule for pod ${podId} with ${userIds.length} drivers.`);
    try {
      await PodService.generateInitialSchedule(podId, userIds);
    } catch (error) {
      logger.error(`Failed to generate initial schedule for pod ${podId}:`, error);
    }
  }
}

/**
 * Example Scheduling with node-cron:
 * 
 * import cron from 'node-cron';
 * 
 * // Run at 12:00 PM, 6:00 PM, and 12:00 AM daily
 * cron.schedule('0 0,12,18 * * *', () => {
 *   MatchmakerService.runBatchClustering();
 * });
 */
