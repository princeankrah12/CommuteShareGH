import { Request, Response } from 'express';
import crypto from 'crypto';
import redis from '../utils/redis';
import logger from '../utils/logger';
import { PaystackWebhookPayload, MomoWebhookPayload } from '@commuteshare/shared';
import { WalletService } from '../services/WalletService';

export class WebhookController {
  /**
   * Main entry point for all payment webhooks
   */
  static async handlePaymentWebhook(req: Request, res: Response) {
    const signature = req.headers['x-paystack-signature'] as string;

    if (signature) {
      return await WebhookController.handlePaystack(req, res, signature);
    }

    // Assume MoMo if not Paystack, or check specific headers/body structure
    if (req.body.financialTransactionId) {
      return await WebhookController.handleMoMo(req, res);
    }

    logger.warn('Unknown webhook received');
    return res.status(400).json({ message: 'Unknown webhook source' });
  }

  /**
   * Handles Paystack webhooks with signature verification and idempotency
   */
  private static async handlePaystack(req: Request, res: Response, signature: string) {
    const secret = process.env.PAYSTACK_SECRET_KEY || '';
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      logger.error('Invalid Paystack signature');
      return res.status(401).send('Invalid signature');
    }

    const payload = req.body as PaystackWebhookPayload;
    const event = payload.event;
    const data = payload.data;
    const transactionId = `paystack:${data.reference}`;

    // Redis Idempotency Lock
    const exists = await redis.get(transactionId);
    if (exists) {
      logger.info(`Duplicate Paystack webhook ignored: ${data.reference}`);
      return res.status(200).send('OK');
    }

    if (event === 'charge.success') {
      logger.info(`Processing successful Paystack payment: ${data.reference}`);

      try {
        // --- PLACEHOLDER: Call WalletService.updateBalance() via Prisma ---
        // await WalletService.updateBalance(data.customer.email, data.amount / 100); 
        // Note: Paystack amount is in kobo/pesewas
        
        // Example logic from WalletService.verifyTopUp could be integrated here
        // await WalletService.verifyTopUp(data.reference);

        // Store transaction_id in Redis for 24 hours to prevent duplicate processing
        await redis.setex(transactionId, 86400, 'processed');
      } catch (error) {
        logger.error(`Error processing Paystack payment ${data.reference}:`, error);
        return res.status(500).send('Error processing payment');
      }
    }

    return res.status(200).send('OK');
  }

  /**
   * Handles MoMo webhooks with idempotency
   */
  private static async handleMoMo(req: Request, res: Response) {
    const payload = req.body as MomoWebhookPayload;
    const transactionId = `momo:${payload.externalId || payload.financialTransactionId}`;

    // Redis Idempotency Lock
    const exists = await redis.get(transactionId);
    if (exists) {
      logger.info(`Duplicate MoMo webhook ignored: ${transactionId}`);
      return res.status(200).send('OK');
    }

    if (payload.status === 'SUCCESSFUL') {
      logger.info(`Processing successful MoMo payment: ${transactionId}`);

      try {
        // --- PLACEHOLDER: Call WalletService.updateBalance() via Prisma ---
        // await WalletService.updateBalance(payload.payer.partyId, parseFloat(payload.amount));

        // Store transaction_id in Redis for 24 hours
        await redis.setex(transactionId, 86400, 'processed');
      } catch (error) {
        logger.error(`Error processing MoMo payment ${transactionId}:`, error);
        return res.status(500).send('Error processing payment');
      }
    }

    return res.status(200).send('OK');
  }
}
