import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import prisma from '../services/prisma';
import { AuthRequest } from '../middlewares/authMiddleware';
import logger from '../utils/logger';
import { TransactionType, TransactionStatus } from '@prisma/client';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_key';
const PAYSTACK_INIT_URL = 'https://api.paystack.co/transaction/initialize';

export class PaymentController {
  /**
   * Initializes a top-up transaction with Paystack.
   */
  static async initializeTopUp(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const email = req.user?.email;
      const { amountGhs } = req.body;

      if (!userId || !email || !amountGhs) {
        return res.status(400).json({ error: 'User ID, email, and amount are required.' });
      }

      // Convert GHS to Pesewas (Paystack requirement)
      const amountPesewas = Math.round(amountGhs * 100);

      const response = await axios.post(
        PAYSTACK_INIT_URL,
        {
          amount: amountPesewas,
          email: email,
          currency: 'GHS',
          metadata: {
            userId: userId,
            amountGhs: amountGhs
          },
          // Optional: callback_url for frontend redirection after payment
          // callback_url: `${process.env.FRONTEND_URL}/payment/verify`
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        return res.status(200).json({
          authorization_url: response.data.data.authorization_url,
          reference: response.data.data.reference
        });
      } else {
        throw new Error(response.data.message || 'Paystack initialization failed');
      }
    } catch (error: any) {
      logger.error('Payment Initialization Error:', error.response?.data || error.message);
      return res.status(500).json({ error: 'Failed to initialize payment with Paystack.' });
    }
  }

  /**
   * Handles Paystack webhooks for transaction status updates.
   */
  static async paystackWebhook(req: Request, res: Response) {
    try {
      // 1. Security Check: Verify x-paystack-signature
      const hash = crypto
        .createHmac('sha512', PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');

      const signature = req.headers['x-paystack-signature'];

      if (hash !== signature) {
        logger.warn('Invalid Paystack Webhook Signature received.');
        return res.status(400).send('Invalid signature');
      }

      const event = req.body;

      // 2. Process Successful Charge
      if (event.event === 'charge.success') {
        const { amount, metadata, reference } = event.data;
        const userId = metadata?.userId;

        if (userId) {
          // Amount is in pesewas, convert back to Commute Points (1 point = 1 GHS)
          const pointsToAdd = Math.floor(amount / 100);

          await prisma.$transaction(async (tx) => {
            // Update user's commute points
            await tx.user.update({
              where: { id: userId },
              data: {
                commutePoints: { increment: pointsToAdd }
              }
            });

            // Log the Top-Up record in the Transaction table
            const userWallet = await tx.wallet.findUnique({ where: { userId } });
            
            await tx.transaction.create({
              data: {
                amount: pointsToAdd,
                reference: reference || `PAYSTACK-${Date.now()}`,
                type: TransactionType.TOP_UP,
                status: TransactionStatus.SUCCESS,
                receiverWalletId: userWallet?.id,
              }
            });
          });

          logger.info(`Successful Top-up: Credited ${pointsToAdd} points to user ${userId} via Paystack.`);
        }
      }

      // 3. Always return 200 OK to Paystack
      return res.status(200).send('OK');
    } catch (error: any) {
      logger.error('Paystack Webhook Processing Error:', error.message);
      // Still return 200 to Paystack to stop retries if the logic is handled
      return res.status(200).send('OK');
    }
  }
}
