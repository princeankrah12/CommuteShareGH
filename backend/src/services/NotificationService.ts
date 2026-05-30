import axios from 'axios';
import * as admin from 'firebase-admin';
import prisma from './prisma';
import logger from '../utils/logger';

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';
const SMS_URL = process.env.SMS_URL || 'http://localhost:4000/api/sms/send';

// Initialize Firebase Admin (Only if not in mock mode)
if (!USE_MOCK_DATA) {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    logger.info('Firebase Admin initialized successfully.');
  } catch (error) {
    logger.warn('Firebase Admin initialization failed. Push notifications may be disabled.', error);
  }
}

export class NotificationService {
  /**
   * Sends a targeted push notification to a single user.
   */
  static async sendPushToUser(
    userId: string,
    title: string,
    body: string,
    dataPayload?: Record<string, string>
  ): Promise<void> {
    if (USE_MOCK_DATA) {
      logger.info(`[MOCK NOTIFICATION] To: User ${userId} | Title: "${title}" | Body: "${body}"`);
      if (dataPayload) logger.debug(`[MOCK DATA] ${JSON.stringify(dataPayload)}`);
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (!user || !user.fcmToken) {
        logger.debug(`Skipping push for User ${userId}: No FCM token registered.`);
        return;
      }

      const message = {
        notification: { title, body },
        data: dataPayload,
        token: user.fcmToken,
      };

      await admin.messaging().send(message);
      logger.info(`Push notification sent to User ${userId}: "${title}"`);
    } catch (error: any) {
      if (error.code === 'messaging/registration-token-not-registered' || 
          error.code === 'messaging/invalid-registration-token') {
        logger.warn(`Invalid FCM token for User ${userId}. Removing from database.`);
        await prisma.user.update({
          where: { id: userId },
          data: { fcmToken: null },
        });
      } else {
        logger.error(`FCM error for User ${userId}:`, error.message);
      }
    }
  }

  /**
   * Broadcasts a push notification to all members of a carpool pod.
   */
  static async sendPushToPod(
    podId: string,
    title: string,
    body: string,
    excludeUserId?: string
  ): Promise<void> {
    if (USE_MOCK_DATA) {
      logger.info(`[MOCK POD NOTIFICATION] To: Pod ${podId} (Exclude: ${excludeUserId || 'None'}) | Title: "${title}" | Body: "${body}"`);
      return;
    }

    try {
      const members = await prisma.podMember.findMany({
        where: {
          podId,
          userId: { not: excludeUserId },
          user: { fcmToken: { not: null } },
        },
        include: {
          user: { select: { fcmToken: true, id: true } },
        },
      });

      const tokens = members
        .map((m) => m.user.fcmToken)
        .filter((token): token is string => !!token);

      if (tokens.length === 0) {
        logger.debug(`Skipping pod push for Pod ${podId}: No active tokens found.`);
        return;
      }

      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
      });

      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (errorCode === 'messaging/registration-token-not-registered' || 
                errorCode === 'messaging/invalid-registration-token') {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          logger.warn(`Cleaning up ${failedTokens.length} stale FCM tokens for Pod ${podId}.`);
          await prisma.user.updateMany({
            where: { fcmToken: { in: failedTokens } },
            data: { fcmToken: null },
          });
        }
      }

      logger.info(`Multicast push sent to Pod ${podId}. Total tokens: ${tokens.length}`);
    } catch (error: any) {
      logger.error(`FCM multicast error for Pod ${podId}:`, error.message);
    }
  }

  /**
   * Sends an SMS (OTP or Alerts) via external API.
   */
  static async sendSMS(phoneNumber: string, message: string): Promise<void> {
    logger.info(`[NotificationService] Sending SMS to ${phoneNumber}...`);
    try {
      await axios.post(SMS_URL, {
        to: phoneNumber,
        message: message
      });
      logger.info(`[NotificationService] SMS sent to ${phoneNumber} successfully.`);
    } catch (error: any) {
      logger.error(`[NotificationService] Error sending SMS to ${phoneNumber}:`, error.message);
    }
  }
}
