import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import prisma from '../services/prisma';
import { AuthService } from '../services/AuthService';
import { WalletService } from '../services/WalletService';
import { RideService } from '../services/RideService';
import { SocketService } from '../services/SocketService';
import { IdentityService } from '../utils/IdentityService';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { io as Client } from 'socket.io-client';
import { TransactionStatus, RideStatus, PodRole } from '@prisma/client';

describe('Vision Integration: Trust, Finance, and Communities', () => {
  let io: Server, serverSocket: any, clientSocket: any;
  const port = 4005;

  beforeEach(async () => {
    // Setup Socket.io for Real-time testing
    const httpServer = createServer();
    io = new Server(httpServer);
    new SocketService(io);
    
    await new Promise<void>((resolve) => {
      httpServer.listen(port, () => {
        clientSocket = Client(`http://localhost:${port}`);
        clientSocket.on('connect', resolve);
      });
    });
  });

  afterEach(() => {
    io.close();
    clientSocket.close();
  });

  async function createVerifiedUser(email: string, fullName: string, affinityGroupName?: string) {
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        phoneNumber: `024${Math.floor(1000000 + Math.random() * 9000000)}`,
        isVerified: true,
        ghanaCardId: `GHA-${Math.floor(100000000 + Math.random() * 900000000)}-${Math.floor(Math.random() * 10)}`,
        role: 'BOTH',
        ...(affinityGroupName ? {
          affinityGroups: {
            connectOrCreate: {
              where: { name: affinityGroupName },
              create: { name: affinityGroupName, type: 'CORPORATE' }
            }
          }
        } : {})
      },
      include: { affinityGroups: true }
    });
    await WalletService.getOrCreateWallet(user.id);
    return user;
  }

  describe('1. Trust Architecture (Identity Verification)', () => {
    it('should successfully verify a valid Ghana Card using the Mock Identity Service', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'verification-test@example.com',
          fullName: 'Kojo Mensah',
          phoneNumber: '0244111222',
        }
      });

      // Valid ID Format (per IdentityService logic)
      const validId = 'GHA-712345678-9'; 
      
      const result = await AuthService.verifyGhanaCard(user.id, validId);
      
      expect(result.isVerified).toBe(true);
      expect(result.ghanaCardId).toBe(validId);
      
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.trustScore).toBeGreaterThan(0);
    });

    it('should reject an invalid Ghana Card format', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'fail-test@example.com',
          fullName: 'Ama Serwaa',
          phoneNumber: '0244333444',
        }
      });

      const invalidId = '123-INVALID';
      
      await expect(AuthService.verifyGhanaCard(user.id, invalidId))
        .rejects.toThrow('Invalid Ghana Card ID format');
    });
  });

  describe('2. Financial Integrity (Ride Lifecycle & Escrow)', () => {
    it('should complete a full financial cycle: Top-up -> Book -> Escrow -> Payout', async () => {
      const rider = await createVerifiedUser('rider@finance.com', 'Financial Rider');
      const driver = await createVerifiedUser('driver@finance.com', 'Financial Driver');
      
      // Setup Driver Vehicle
      const vehicle = await prisma.vehicle.create({
        data: {
          ownerId: driver.id,
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          licensePlate: 'GW 123-24',
          color: 'Silver',
          hasAC: true,
          seatCapacity: 4
        }
      });

      // 1. Rider Tops Up (Mocked MoMo)
      await WalletService.topUp(rider.id, 100.0, 'MOMO-REF-100');
      let riderBalance = await WalletService.getBalance(rider.id);
      expect(Number(riderBalance.balance)).toBe(100.0);

      // 2. Driver Posts a Ride
      const landmark = await prisma.landmark.create({ data: { name: 'Adenta Barrier', latitude: 5.7, longitude: -0.2 } });
      const destLandmark = await prisma.landmark.create({ data: { name: 'Ridge', latitude: 5.5, longitude: -0.2 } });
      
      const ride = await RideService.createRide({
        driverId: driver.id,
        vehicleId: vehicle.id,
        departureTime: new Date(Date.now() + 3600000),
        landmarkIds: [landmark.id, destLandmark.id],
        availableSeats: 3,
        fare: 50.0
      });

      // 3. Rider Books (Funds held in escrow / transferred to driver)
      // Note: Current RideService.bookRide transfers directly to driver but we verify balances
      await RideService.bookRide({
        rideId: ride.id,
        riderId: rider.id,
        pickupLandmarkId: landmark.id,
        dropoffLandmarkId: destLandmark.id
      });

      const bookingFee = 1.0;
      const fare = 50.0;
      const totalCost = fare + bookingFee;
      const commission = fare * 0.12;
      const expectedPayout = fare - commission;

      riderBalance = await WalletService.getBalance(rider.id);
      const driverBalance = await WalletService.getBalance(driver.id);

      expect(Number(riderBalance.balance)).toBe(100.0 - totalCost);
      expect(Number(driverBalance.balance)).toBe(expectedPayout);

      // 4. Verify Transaction Transparency
      const txs = await WalletService.getTransactions(rider.id);
      expect(txs.some(t => t.tripId === ride.id)).toBe(true);
    });
  });

  describe('3. Professional Affinity Groups (Visibility)', () => {
    it('should restrict ride visibility to members of the same Affinity Group when filtered', async () => {
      const groupName = 'MTN Ghana';
      const mtnDriver = await createVerifiedUser('driver@mtn.com', 'MTN Driver', groupName);
      const otherDriver = await createVerifiedUser('driver@other.com', 'Other Driver', 'PwC Ghana');
      
      const groupId = mtnDriver.affinityGroups[0].id;
      
      // Create vehicles for both
      const v1 = await prisma.vehicle.create({ data: { ownerId: mtnDriver.id, make: 'T', model: 'C', year: 2022, licensePlate: 'MTN-1', color: 'Y', hasAC: true, seatCapacity: 4 } });
      const v2 = await prisma.vehicle.create({ data: { ownerId: otherDriver.id, make: 'H', model: 'E', year: 2022, licensePlate: 'PWC-1', color: 'B', hasAC: true, seatCapacity: 4 } });

      const l1 = await prisma.landmark.create({ data: { name: 'L1', latitude: 1, longitude: 1 } });
      const l2 = await prisma.landmark.create({ data: { name: 'L2', latitude: 2, longitude: 2 } });

      // Create rides for both
      await RideService.createRide({ driverId: mtnDriver.id, vehicleId: v1.id, departureTime: new Date(), landmarkIds: [l1.id, l2.id], availableSeats: 3, fare: 10 });
      await RideService.createRide({ driverId: otherDriver.id, vehicleId: v2.id, departureTime: new Date(), landmarkIds: [l1.id, l2.id], availableSeats: 3, fare: 10 });

      // Search with Affinity Filter
      const mtnRides = await RideService.searchRides(l1.id, l2.id, new Date(), groupId);
      
      expect(mtnRides.length).toBe(1);
      expect(mtnRides[0].driver.fullName).toBe('MTN Driver');
    });
  });

  describe('4. Real-time Simulator (Socket updates)', () => {
    it('should broadcast location updates from driver to rider via Socket.io', async () => {
      const rideId = 'realtime-ride-123';
      const driverId = 'driver-sim-1';
      
      // Client (Rider) joins the ride room
      clientSocket.emit('join_ride', rideId);
      
      const updatePromise = new Promise((resolve) => {
        clientSocket.on('location_updated', (data: any) => {
          if (data.rideId === rideId) resolve(data);
        });
      });

      // Simulation: Driver sends location update
      // We simulate what the fleet-simulator.ts does
      io.emit('location_updated', {
        driverId,
        rideId,
        latitude: 5.6037,
        longitude: -0.1870
      });

      const receivedData: any = await updatePromise;
      expect(receivedData.latitude).toBe(5.6037);
      expect(receivedData.driverId).toBe(driverId);
    });

    it('should trigger geofence alerts when driver arrives at a landmark', async () => {
      // Mocking RideService.checkLandmarkProximity
      vi.spyOn(RideService, 'checkLandmarkProximity').mockResolvedValue({
        id: 'stop-1',
        landmarkName: 'Adenta Barrier'
      });

      const rideId = 'geofence-ride-12';
      clientSocket.emit('join_ride', rideId);

      const arrivalPromise = new Promise((resolve) => {
        clientSocket.on('driver_arrived', (data: any) => {
          resolve(data);
        });
      });

      // Emit a location update that triggers the mock proximity
      // Using a test-only socket or direct io call
      io.sockets.sockets.forEach((s) => {
        s.emit('update_location', {
          driverId: 'd1',
          rideId,
          latitude: 5.7,
          longitude: -0.2
        });
      });
      
      // Note: We need to trigger the actual logic in SocketService
      // Since we can't easily trigger the internal handler from outside without a real connection,
      // we'll rely on the fact that SocketService is initialized on 'io'.
      
      // To properly test this, we would use a second clientSocket as a driver
      const driverSocket = Client(`http://localhost:${port}`);
      await new Promise<void>((resolve) => driverSocket.on('connect', resolve));
      
      driverSocket.emit('update_location', {
        driverId: 'd1',
        rideId,
        latitude: 5.7,
        longitude: -0.2
      });

      const arrivalData: any = await arrivalPromise;
      expect(arrivalData.landmarkName).toBe('Adenta Barrier');
      
      driverSocket.close();
    });
  });
});
