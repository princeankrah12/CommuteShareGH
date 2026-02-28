import { Request, Response } from 'express';
import prisma from '../services/prisma';
import logger from '../utils/logger';
import { SmileIdentityService } from '../services/SmileIdentityService';

/**
 * Controller to handle asynchronous callbacks from Smile Identity.
 */
export class SmileWebhookController {
  /**
   * Endpoint for Smile Identity to post job results.
   * Reference: https://docs.usesmileid.com/integration-options/web-api/callback
   */
  static async handleCallback(req: Request, res: Response) {
    const signature = req.headers['x-smileid-signature'] as string;
    const timestamp = req.headers['x-smileid-timestamp'] as string;

    if (!signature || !timestamp) {
      logger.warn('[SmileWebhook] Missing signature or timestamp in headers');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Securely verify the Smile ID signature
    const isValid = SmileIdentityService.verifySignature(timestamp, signature);
    if (!isValid) {
      logger.error('[SmileWebhook] Invalid signature received');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    const userId = payload.user_id;
    const jobId = payload.job_id;
    const resultCode = payload.result_code; // Usually string in callbacks

    logger.info(`[SmileWebhook] Received result for User: ${userId}, Job: ${jobId}, ResultCode: ${resultCode}`);

    try {
      // 2. Update VerificationRequest and User in PostgreSQL via Prisma
      // Smile ID Result Codes: 1012 is "Approved"
      if (resultCode === '1012') {
        await prisma.$transaction([
          // Update the verification record to APPROVED
          prisma.verificationRequest.update({
            where: { userId: userId },
            data: { 
              status: 'APPROVED',
              updatedAt: new Date()
            }
          }),
          // Instantly unlock the user's verified status
          prisma.user.update({
            where: { id: userId },
            data: { 
              isVerified: true,
              trustScore: { increment: 0.8 } // Trust bonus for successful biometric KYC
            }
          })
        ]);
        logger.info(`[SmileWebhook] User ${userId} successfully verified via async callback.`);
      } else {
        // Handle rejection/failure
        await prisma.verificationRequest.update({
          where: { userId: userId },
          data: { 
            status: 'REJECTED',
            rejectionReason: payload.result_text || 'Biometric verification failed',
            updatedAt: new Date()
          }
        });
        logger.warn(`[SmileWebhook] Verification rejected for user ${userId}: ${payload.result_text}`);
      }

      // 3. Respond with 200 OK to acknowledge receipt (Smile ID requires this)
      return res.status(200).json({ status: 'Acknowledged' });
    } catch (error: any) {
      logger.error(`[SmileWebhook] Database update error: ${error.message}`);
      // Smile ID will retry if we don't return 2xx
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
