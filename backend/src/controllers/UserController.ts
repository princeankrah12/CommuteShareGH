import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import prisma from '../services/prisma';
import logger from '../utils/logger';

export class UserController {
  /**
   * Updates the Firebase Cloud Messaging (FCM) token for the authenticated user.
   */
  static async updateFcmToken(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { fcmToken } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!fcmToken) {
        return res.status(400).json({ error: 'FCM Token is required' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { fcmToken },
      });

      logger.info(`FCM Token updated for user ${userId}`);
      return res.status(200).json({ message: 'FCM Token updated successfully' });
    } catch (error: any) {
      logger.error('Error updating FCM Token:', error.message);
      return res.status(500).json({ error: 'Internal server error while updating FCM token.' });
    }
  }

  /**
   * Fetches the profile of the authenticated user.
   */
  static async getMyProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'User not authenticated' });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          commuteProfile: true,
          wallet: true,
          vehicles: true,
        }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      return res.status(200).json(user);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
