import { describe, it, expect, beforeEach, vi } from 'vitest';
import prisma from '../services/prisma';
import { PodService } from '../services/PodService';
import { MatchmakerService } from '../services/MatchmakerService';
import { RescueService } from '../services/RescueService';
import { WalletService } from '../services/WalletService';
import { CommutePreference, RideStatus, PodRole, DayOfWeek } from '@prisma/client';

describe('The Rotational Engine', () => {
  async function createTestUser(emailSuffix: string) {
    const user = await prisma.user.create({
      data: {
        email: `test-${emailSuffix}@example.com`,
        fullName: `Test User ${emailSuffix}`,
        phoneNumber: `024${Math.floor(1000000 + Math.random() * 9000000)}`,
        isVerified: true,
        role: 'BOTH',
      },
    });
    const wallet = await WalletService.getOrCreateWallet(user.id);
    return { user, wallet };
  }

  describe('1. The Fair Scheduler (Fisher-Yates)', () => {
    it('should deterministically assign driving days across the work week for a full pod', async () => {
      const users = await Promise.all([
        createTestUser('fs1'), createTestUser('fs2'), 
        createTestUser('fs3'), createTestUser('fs4')
      ]);

      const pod = await prisma.carpoolPod.create({
        data: {
          name: 'Fair Schedule Test Pod',
          inviteCode: 'FAIR12',
          origin: 'H3_ORIGIN',
          destination: 'H3_DEST',
          matchKey: 'H3_ORIGIN_H3_DEST_0630'
        }
      });

      for (const u of users) {
        await prisma.podMember.create({
          data: { podId: pod.id, userId: u.user.id, role: PodRole.MEMBER }
        });
      }

      await PodService.generateInitialSchedule(pod.id, users.map(u => u.user.id));

      const schedules = await prisma.podSchedule.findMany({ where: { podId: pod.id } });
      
      expect(schedules.length).toBe(5); // Monday to Friday
      
      const uniqueDrivers = new Set(schedules.map(s => s.driverId));
      // With 4 users and 5 days, all 4 users should drive at least once
      expect(uniqueDrivers.size).toBe(4); 
    });
  });

  describe('2. The Self-Healing Engine (Cascade Shift)', () => {
    it('should cascade schedules when a member drops out', async () => {
      const users = await Promise.all([
        createTestUser('sh1'), createTestUser('sh2'), createTestUser('sh3')
      ]);

      const pod = await prisma.carpoolPod.create({
        data: {
          name: 'Self Healing Test Pod',
          inviteCode: 'HEAL12',
          origin: 'H3_ORIGIN',
          destination: 'H3_DEST',
          matchKey: 'H3_ORIGIN_H3_DEST_0630'
        }
      });

      for (const u of users) {
        await prisma.podMember.create({
          data: { podId: pod.id, userId: u.user.id, role: PodRole.MEMBER }
        });
      }

      await PodService.generateInitialSchedule(pod.id, users.map(u => u.user.id));
      
      const droppedUser = users[0].user.id;
      
      // Simulate Dropout
      await PodService.handleMemberDropout(pod.id, droppedUser);

      const remainingMembers = await prisma.podMember.findMany({ where: { podId: pod.id } });
      expect(remainingMembers.length).toBe(2);

      const updatedPod = await prisma.carpoolPod.findUnique({ where: { id: pod.id } });
      expect(updatedPod?.needsReplacement).toBe(true);
      
      const schedules = await prisma.podSchedule.findMany({ where: { podId: pod.id } });
      const scheduledDrivers = new Set(schedules.map(s => s.driverId));
      expect(scheduledDrivers.has(droppedUser)).toBe(false); // Dropped user should no longer be scheduled
    });

    it('should disband the pod if members drop below 2', async () => {
      const users = await Promise.all([createTestUser('dis1'), createTestUser('dis2')]);
      
      const pod = await prisma.carpoolPod.create({
        data: {
          name: 'Disband Test Pod',
          inviteCode: 'DISB12',
          origin: 'H3_ORIGIN',
          destination: 'H3_DEST',
          matchKey: 'H3_ORIGIN_H3_DEST_0630'
        }
      });

      for (const u of users) {
        await prisma.podMember.create({
          data: { podId: pod.id, userId: u.user.id, role: PodRole.MEMBER }
        });
      }

      // Add dummy preference profile for the remaining user
      await prisma.commuteProfile.create({
        data: {
          userId: users[1].user.id,
          homeGeohash: 'H3_ORIGIN',
          workGeohash: 'H3_DEST',
          departureTime: '06:30',
          matchKey: 'H3_ORIGIN_H3_DEST_0630',
          preference: CommutePreference.ROTATION
        }
      });

      await PodService.generateInitialSchedule(pod.id, users.map(u => u.user.id));
      
      // Member 1 leaves
      await PodService.handleMemberDropout(pod.id, users[0].user.id);

      const remainingMembers = await prisma.podMember.findMany({ where: { podId: pod.id } });
      expect(remainingMembers.length).toBe(1);

      // Schedules should be cleared
      const schedules = await prisma.podSchedule.findMany({ where: { podId: pod.id } });
      expect(schedules.length).toBe(0);

      // Remaining user should be returned to pool
      const profile = await prisma.commuteProfile.findUnique({ where: { userId: users[1].user.id } });
      expect(profile?.preference).toBe(CommutePreference.CARPOOL);
    });
  });

  describe('3. The Matchmaker (Clustering)', () => {
    it('should group unmatched profiles into a new pod', async () => {
      const users = await Promise.all([
        createTestUser('mm1'), createTestUser('mm2'), createTestUser('mm3')
      ]);

      const matchKey = 'MM_ORIGIN_MM_DEST_0700';

      for (const u of users) {
        await prisma.commuteProfile.create({
          data: {
            userId: u.user.id,
            homeGeohash: 'MM_ORIGIN',
            workGeohash: 'MM_DEST',
            departureTime: '07:00',
            matchKey: matchKey,
            preference: CommutePreference.ROTATION
          }
        });
      }

      await MatchmakerService.runBatchClustering();

      // Check if a pod was created
      const pods = await prisma.carpoolPod.findMany({
        where: { matchKey }
      });
      
      expect(pods.length).toBe(1);
      
      const members = await prisma.podMember.findMany({
        where: { podId: pods[0].id }
      });
      expect(members.length).toBe(3);
    });
  });

  describe('4. The Rescue Protocol', () => {
    it('should trigger SOS, abort the ride, and allow a rescuer to take over', async () => {
      const { user: originalDriver } = await createTestUser('sos1');
      const { user: rescuer } = await createTestUser('sos2');
      const { user: rider } = await createTestUser('sos3');

      // Setup landmarks
      const l1 = await prisma.landmark.create({ data: { name: 'SOS Origin', latitude: 5.6037, longitude: -0.1870 } });
      const l2 = await prisma.landmark.create({ data: { name: 'SOS Dest', latitude: 5.6145, longitude: -0.2057 } });

      // Setup Vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          ownerId: originalDriver.id,
          make: 'Test',
          model: 'SOS',
          year: 2025,
          licensePlate: 'SOS-999',
          color: 'Red',
          seatCapacity: 4,
          hasAC: true
        }
      });

      const ride = await prisma.ride.create({
        data: {
          driverId: originalDriver.id,
          vehicleId: vehicle.id,
          departureTime: new Date(),
          availableSeats: 3,
          fare: 50.0,
          status: RideStatus.ACTIVE,
          stops: {
            create: [
              { landmarkId: l1.id, stopOrder: 0 },
              { landmarkId: l2.id, stopOrder: 1 }
            ]
          }
        }
      });

      await prisma.rideBooking.create({
        data: {
          rideId: ride.id,
          riderId: rider.id,
          pickupLandmarkId: l1.id,
          dropoffLandmarkId: l2.id,
          status: 'CONFIRMED'
        }
      });

      // 1. Trigger SOS
      await RescueService.triggerSOS(ride.id, 5.6037, -0.1870);

      const abortedRide = await prisma.ride.findUnique({ where: { id: ride.id } });
      expect(abortedRide?.status).toBe(RideStatus.ABORTED);

      // 2. Rescuer accepts the mission
      await RescueService.acceptRescue(rescuer.id, ride.id);

      const rescuedRide = await prisma.ride.findUnique({ where: { id: ride.id } });
      expect(rescuedRide?.status).toBe(RideStatus.ACTIVE);
      expect(rescuedRide?.driverId).toBe(rescuer.id);

      // 3. Verify rescuer got bonus points
      const updatedRescuer = await prisma.user.findUnique({ where: { id: rescuer.id } });
      expect(updatedRescuer?.commutePoints).toBeGreaterThanOrEqual(50);
    });
  });

  describe('5. The Penalty Engine', () => {
    it('should deduct penalty amount securely using double-entry method', async () => {
      const { user, wallet } = await createTestUser('pen1');
      
      // Top up first
      await WalletService.topUp(user.id, 100.0, 'TOPUP-PEN1');
      
      const penaltyAmount = 20.0;
      await WalletService.deductPenalty(user.id, penaltyAmount, 'Late cancellation penalty');

      const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
      expect(Number(updatedWallet?.balance)).toBe(80.0); // 100 - 20

      // Check transaction log
      const txs = await prisma.transaction.findMany({
        where: { senderWalletId: wallet.id },
        orderBy: { createdAt: 'desc' }
      });
      
      expect(txs.length).toBeGreaterThan(0);
      expect(Number(txs[0].amount)).toBe(penaltyAmount);
    });
  });
});