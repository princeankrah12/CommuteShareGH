import { DayOfWeek, CommutePreference } from '@prisma/client';
import prisma from './prisma';

  /**
   * Fetches the pod details for a specific user, including members and schedule.
   * 
   * @param userId - The ID of the user
   * @returns The pod details or null if not found
   */
  static async getUserPodDetails(userId: string) {
    const membership = await prisma.podMember.findFirst({
      where: { userId },
      include: {
        pod: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                    trustScore: true
                  }
                }
              }
            },
            schedules: {
              include: {
                driver: {
                  select: {
                    id: true,
                    fullName: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return membership?.pod || null;
  }

  /**
   * Generates an initial fair schedule for a pod by distributing driving duties
   * across the work week using a round-robin algorithm.
   * 
   * @param podId - The ID of the carpool pod
   * @param userIds - Array of user IDs who are members of the pod
   * @param departureTime - Standard departure time (HH:mm format)
   */
  static async generateInitialSchedule(
    podId: string,
    userIds: string[],
    departureTime: string = '06:30'
  ): Promise<void> {
    const WORKDAYS: DayOfWeek[] = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY'
    ];

    if (userIds.length === 0) {
      throw new Error('Cannot generate schedule for a pod with no members.');
    }

    // Fisher-Yates Shuffle for fairness
    const shuffledUsers = [...userIds];
    for (let i = shuffledUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledUsers[i], shuffledUsers[j]] = [shuffledUsers[j], shuffledUsers[i]];
    }

    try {
      // Map over workdays and assign drivers using modulo operator
      const scheduleData = WORKDAYS.map((day, index) => {
        const driverId = shuffledUsers[index % shuffledUsers.length];
        return {
          podId,
          day,
          driverId,
          departureTime
        };
      });

      // Use a transaction for bulk insertion to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Clear any existing schedule for this pod
        await tx.podSchedule.deleteMany({ where: { podId } });
        
        await tx.podSchedule.createMany({
          data: scheduleData,
          skipDuplicates: true // Handles potential unique constraint violations gracefully
        });
      });

      console.log(`Successfully generated initial schedule for Pod ${podId}`);
    } catch (error) {
      console.error(`Error generating schedule for Pod ${podId}:`, error);
      throw error;
    }
  }

  /**
   * Cascade Shift: Self-healing algorithm for handling member dropouts.
   * Disbands the pod if members < 2, or heals the schedule if members >= 2.
   * 
   * @param podId - The ID of the pod
   * @param droppedUserId - The ID of the user who is leaving
   */
  static async handleMemberDropout(podId: string, droppedUserId: string): Promise<void> {
    const WORKDAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
    
    await prisma.$transaction(async (tx) => {
      // Step 1: Database Cleanup
      await tx.podMember.delete({
        where: {
          podId_userId: {
            podId,
            userId: droppedUserId
          }
        }
      });

      // Step 2: Assess Pod Health
      const remainingMembers = await tx.podMember.findMany({
        where: { podId }
      });

      const remainingUserIds = remainingMembers.map(m => m.userId);

      // Step 3: The Collapse (Members < 2)
      if (remainingUserIds.length < 2) {
        // Delete all future (and past) PodSchedule records for this pod
        await tx.podSchedule.deleteMany({
          where: { podId }
        });

        // Update the remaining member's profile back to CARPOOL if applicable
        if (remainingUserIds.length === 1) {
          await tx.commuteProfile.update({
            where: { userId: remainingUserIds[0] },
            data: { preference: CommutePreference.CARPOOL }
          });
          // Note: Logic for 'Pod disbanded' push notification would be triggered here
          console.log(`Pod ${podId} disbanded. Remaining user ${remainingUserIds[0]} returned to pool.`);
        }

        // We could also delete or archive the CarpoolPod record here
        return;
      }

      // Step 4: The Heal (Members >= 2)
      // Update pod to signal it needs a replacement
      await tx.carpoolPod.update({
        where: { id: podId },
        data: { needsReplacement: true }
      });

      // Determine future days for the current week (tomorrow until Friday)
      const now = new Date();
      const todayIndex = now.getDay(); // 0 (Sun) to 6 (Sat)
      
      // Map JS day to WORKDAYS index (Mon=1 -> 0, Tue=2 -> 1, ..., Fri=5 -> 4)
      const workDayIndices: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
      
      let futureDays: DayOfWeek[] = [];
      if (todayIndex >= 1 && todayIndex <= 4) {
        // If today is Mon-Thu, tomorrow is Tue-Fri
        futureDays = WORKDAYS.slice(workDayIndices[todayIndex] + 1);
      } else if (todayIndex === 0 || todayIndex === 6) {
        // If it's weekend, all workdays are "future"
        futureDays = WORKDAYS;
      }

      if (futureDays.length > 0) {
        // Delete future schedules
        await tx.podSchedule.deleteMany({
          where: {
            podId,
            day: { in: futureDays }
          }
        });

        // Get standard departure time from any remaining schedule or default
        const sampleSchedule = await tx.podSchedule.findFirst({
          where: { podId }
        });
        const departureTime = sampleSchedule?.departureTime || '06:30';

        // Round-robin assignment using remaining members
        const repairedSchedule = futureDays.map((day, index) => ({
          podId,
          day,
          driverId: remainingUserIds[index % remainingUserIds.length],
          departureTime
        }));

        // Bulk insert repaired schedule
        await tx.podSchedule.createMany({
          data: repairedSchedule,
          skipDuplicates: true
        });

        console.log(`Successfully healed schedule for Pod ${podId} for days: ${futureDays.join(', ')}`);
      }
    });
  }

  /**
   * Rebalances a pod's schedule by identifying missing days in the rotation
   * and assigning them to active members.
   * 
   * @param podId - The ID of the pod
   */
  static async rebalanceSchedule(podId: string): Promise<void> {
    const WORKDAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    await prisma.$transaction(async (tx) => {
      // 1. Get current schedule and active members (excluding GUESTs for primary rotation)
      const existingSchedules = await tx.podSchedule.findMany({
        where: { podId }
      });

      const members = await tx.podMember.findMany({
        where: { 
          podId,
          role: { not: 'GUEST' }
        }
      });

      if (members.length === 0) return;

      const activeUserIds = members.map(m => m.userId);
      const scheduledDays = existingSchedules.map(s => s.day);
      const missingDays = WORKDAYS.filter(day => !scheduledDays.includes(day));

      if (missingDays.length === 0) return;

      // 2. Identify a sample departure time
      const departureTime = existingSchedules[0]?.departureTime || '06:30';

      // 3. Fill missing days using remaining members (round-robin)
      const newSchedules = missingDays.map((day, index) => ({
        podId,
        day,
        driverId: activeUserIds[index % activeUserIds.length],
        departureTime
      }));

      await tx.podSchedule.createMany({
        data: newSchedules
      });

      console.log(`Rebalanced Pod ${podId}: Filled days ${missingDays.join(', ')}`);
    });
  }
}

