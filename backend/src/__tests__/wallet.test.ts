import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from '../services/WalletService';
import { MomoService } from '../utils/MomoService';
import prisma from '../services/prisma';
import { TransactionStatus } from '@prisma/client';

describe('WalletService', () => {
  async function createTestUser() {
    const user = await prisma.user.create({
      data: {
        email: `test-${Math.random()}@example.com`,
        fullName: 'Test User',
        phoneNumber: `024${Math.floor(1000000 + Math.random() * 9000000)}`,
      },
    });
    const wallet = await WalletService.getOrCreateWallet(user.id);
    return { user, wallet };
  }

  describe('topUp', () => {
    it('should successfully top up a user wallet', async () => {
      const { user, wallet } = await createTestUser();
      const amount = 50.0;
      const reference = 'REF-123';

      const result = await WalletService.topUp(user.id, amount, reference);

      expect(result.duplicate).toBe(false);
      expect(Number(result.wallet?.balance)).toBe(50.0);
      expect(result.transaction.status).toBe(TransactionStatus.SUCCESS);
      expect(result.transaction.reference).toBe(reference);

      // Verify DB state
      const updatedWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      expect(Number(updatedWallet?.balance)).toBe(50.0);
    });

    it('should prevent duplicate top-ups using reference', async () => {
      const { user } = await createTestUser();
      const amount = 100.0;
      const reference = 'REF-DUP';

      // First call
      await WalletService.topUp(user.id, amount, reference);
      
      // Second call with same reference
      const result = await WalletService.topUp(user.id, amount, reference);

      expect(result.duplicate).toBe(true);
      expect(Number(result.wallet?.balance)).toBe(100.0); // Should still be 100, not 200

      const transactions = await prisma.transaction.findMany({
        where: { receiverWalletId: result.wallet.id }
      });
      expect(transactions.length).toBe(1);
    });

    it('should handle failed MoMo verification', async () => {
      const { user } = await createTestUser();
      const amount = 20.0;
      const reference = 'REF-FAIL';

      // Mock MomoService to return failure
      vi.spyOn(MomoService, 'verifyPayment').mockResolvedValueOnce({
        status: 'FAILED',
        amount: 0
      });

      await expect(WalletService.topUp(user.id, amount, reference))
        .rejects.toThrow('MoMo payment verification failed');

      // Verify balance didn't change
      const updatedWallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      expect(Number(updatedWallet?.balance)).toBe(0);

      // Verify transaction marked as FAILED
      const tx = await prisma.transaction.findFirst({
        where: { reference }
      });
      expect(tx?.status).toBe(TransactionStatus.FAILED);
      
      vi.restoreAllMocks();
    });
  });

  describe('processRidePayment', () => {
    it('should transfer funds from rider to driver minus commission', async () => {
      const { user: riderUser, wallet: riderWallet } = await createTestUser();
      const { user: driverUser, wallet: driverWallet } = await createTestUser();

      // Give rider some money
      await prisma.wallet.update({
        where: { id: riderWallet.id },
        data: { balance: 100.0 }
      });

      const fare = 50.0;
      const fee = 2.0;
      const tripId = 'trip-1';
      const totalCost = fare + fee; // 52.0
      const commission = fare * 0.12; // 6.0
      const expectedPayout = fare - commission; // 44.0

      const result = await WalletService.processRidePayment(riderUser.id, driverUser.id, fare, tripId, fee);

      expect(result.success).toBe(true);
      expect(result.payout).toBe(expectedPayout);

      const updatedRiderWallet = await prisma.wallet.findUnique({ where: { id: riderWallet.id } });
      const updatedDriverWallet = await prisma.wallet.findUnique({ where: { id: driverWallet.id } });

      expect(Number(updatedRiderWallet?.balance)).toBe(100.0 - totalCost);
      expect(Number(updatedDriverWallet?.balance)).toBe(expectedPayout);
    });

    it('should fail if rider has insufficient balance', async () => {
      const { user: riderUser } = await createTestUser(); // balance 0
      const { user: driverUser } = await createTestUser();

      await expect(WalletService.processRidePayment(riderUser.id, driverUser.id, 50.0, 'trip-fail'))
        .rejects.toThrow('Insufficient wallet balance');
    });
  });
});
