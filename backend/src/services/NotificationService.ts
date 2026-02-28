import * as admin from 'firebase-admin';
import prisma from './prisma';
import logger from '../utils/logger';

// Initialize Firebase Admin (Assuming serviceAccountKey.json is placed in the root or path set via ENV)
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
  logger.info('Firebase Admin initialized successfully.');
} catch (error) {
  logger.warn('Firebase Admin initialization failed. Push notifications may be disabled.', error);
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
    try {
      // 1. Fetch user's FCM token
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (!user || !user.fcmToken) {
        logger.debug(`Skipping push for User ${userId}: No FCM token registered.`);
        return;
      }

      // 2. Construct FCM message
      const message = {
        notification: { title, body },
        data: dataPayload,
        token: user.fcmToken,
      };

      // 3. Send via Firebase
      await admin.messaging().send(message);
      logger.info(`Push notification sent to User ${userId}: "${title}"`);
    } catch (error: any) {
      // Handle expired or invalid tokens
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
    try {
      // 1. Fetch tokens for all active pod members
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

      // 2. Send multicast message
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
      });

      // 3. Cleanup failed tokens
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
}
