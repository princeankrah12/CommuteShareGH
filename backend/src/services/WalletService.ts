import prisma from './prisma';
import { Prisma } from '@prisma/client';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { MomoService } from '../utils/MomoService';
import { PaystackService } from '../utils/PaystackService';
import logger from '../utils/logger';

export class WalletService {
  /**
   * Ensure a user has a wallet
   */
  static async getOrCreateWallet(userId: string) {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0 }
      });
    }
    return wallet;
  }

  /**
   * Initialize a Paystack checkout for the user
   */
  static async initializeTopUp(userId: string, amount: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const wallet = await this.getOrCreateWallet(userId);
    const paystackResponse = await PaystackService.initializeTransaction(user.email, amount);

    if (paystackResponse.status) {
      // Create a PENDING transaction
      await prisma.transaction.create({
        data: {
          receiverWalletId: wallet.id,
          amount: new Prisma.Decimal(amount),
          type: TransactionType.TOP_UP,
          status: TransactionStatus.PENDING,
          reference: paystackResponse.data.reference,
        }
      });

      return {
        checkoutUrl: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference
      };
    } else {
      throw new Error('Failed to initialize payment with Paystack');
    }
  }

  /**
   * Verify a Paystack transaction and update balance
   */
  static async verifyTopUp(reference: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { reference },
      include: { receiverWallet: true }
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status === TransactionStatus.SUCCESS) return transaction;

    const verification = await PaystackService.verifyTransaction(reference);

    if (verification.status && verification.data.status === 'success') {
      return await prisma.$transaction(async (tx) => {
        // Update wallet balance
        await tx.wallet.update({
          where: { id: transaction.receiverWalletId! },
          data: {
            balance: {
              increment: transaction.amount,
            },
          },
        });

        // Update transaction
        return await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.SUCCESS },
        });
      });
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: TransactionStatus.FAILED },
      });
      throw new Error('Payment verification failed');
    }
  }

  /**
   * Top up a user's wallet (simulating a successful MoMo payment)
   */
  static async topUp(userId: string, amount: number, reference: string) {
    const wallet = await this.getOrCreateWallet(userId);

    // 1. Check if transaction already exists for this reference
    const existing = await prisma.transaction.findUnique({
      where: { reference }
    });
    if (existing) {
      logger.info(`Duplicate top-up request blocked for reference: ${reference}`);
      return { wallet, transaction: existing, duplicate: true };
    }

    const userRecord = await prisma.user.findUnique({ where: { id: userId } });
    if (!userRecord) throw new Error('User not found');

    // 2. Simulate external MoMo initiation
    const momoResult = await MomoService.initiatePayment(userRecord.phoneNumber, amount, reference);
    
    if (momoResult.status !== 'success') {
      throw new Error('MoMo initiation failed');
    }

    // 3. Create a PENDING transaction first
    const pendingTx = await prisma.transaction.create({
      data: {
        receiverWalletId: wallet.id,
        amount: new Prisma.Decimal(amount),
        type: TransactionType.TOP_UP,
        status: TransactionStatus.PENDING,
        reference,
      }
    });

    // 4. Simulate verification
    const verification = await MomoService.verifyPayment(reference);

    if (verification.status === 'SUCCESSFUL') {
      return await prisma.$transaction(async (tx) => {
        // Update transaction to SUCCESS
        const transaction = await tx.transaction.update({
          where: { id: pendingTx.id },
          data: { status: TransactionStatus.SUCCESS },
        });

        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: new Prisma.Decimal(amount),
            },
          },
        });

        return { wallet: updatedWallet, transaction, duplicate: false };
      });
    } else {
      await prisma.transaction.update({
        where: { id: pendingTx.id },
        data: { status: TransactionStatus.FAILED },
      });
      throw new Error('MoMo payment verification failed');
    }
  }

  /**
   * Transfer funds from Rider to Driver
   */
  static async processRidePayment(riderId: string, driverId: string, fare: number, tripId: string, bookingFee: number = 1.0) {
    return await prisma.$transaction(async (tx) => {
      const totalCost = fare + bookingFee;
      
      const riderWallet = await tx.wallet.findUnique({ where: { userId: riderId } });
      if (!riderWallet || riderWallet.balance.toNumber() < totalCost) {
        throw new Error('Insufficient wallet balance');
      }

      const driverWallet = await this.getOrCreateWallet(driverId);

      // 1. Deduct from Rider Wallet
      await tx.wallet.update({
        where: { id: riderWallet.id },
        data: { balance: { decrement: new Prisma.Decimal(totalCost) } },
      });

      // 2. Credit Driver Wallet (12% commission)
      const commission = fare * 0.12;
      const payout = fare - commission;
      await tx.wallet.update({
        where: { id: driverWallet.id },
        data: { balance: { increment: new Prisma.Decimal(payout) } },
      });

      // 3. Record Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: new Prisma.Decimal(totalCost),
          reference: `TRIP-${tripId}-${Date.now()}`,
          type: TransactionType.TRIP_PAYMENT,
          status: TransactionStatus.SUCCESS,
          senderWalletId: riderWallet.id,
          receiverWalletId: driverWallet.id,
          tripId: tripId,
        },
      });

      return { success: true, payout, transaction };
    });
  }

  /**
   * Generic deduction for penalties (e.g., late cancellation)
   */
  static async deductPenalty(userId: string, amount: number, description: string) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWallet(userId);
      
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: new Prisma.Decimal(amount) } },
      });

      return await tx.transaction.create({
        data: {
          amount: new Prisma.Decimal(amount),
          reference: `PENALTY-${userId}-${Date.now()}`,
          type: TransactionType.CASHOUT, // Using CASHOUT for lack of PENALTY type in new schema, or could use PROMO with negative if allowed
          status: TransactionStatus.SUCCESS,
          senderWalletId: wallet.id,
        },
      });
    });
  }

  static async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { commutePoints: true },
    });
    return { balance: wallet.balance, commutePoints: user?.commutePoints || 0 };
  }

  static async getTransactions(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    return await prisma.transaction.findMany({
      where: {
        OR: [
          { senderWalletId: wallet.id },
          { receiverWalletId: wallet.id }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
