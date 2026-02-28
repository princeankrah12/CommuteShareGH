import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PodService } from '../services/PodService';
import { RescueService } from '../services/RescueService';

export class PodController {
  /**
   * Fetches the carpool pod details for the authenticated user.
   */
  static async getMyPod(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const podData = await PodService.getUserPodDetails(userId);
      if (!podData) {
        return res.status(404).json({ error: 'No carpool pod found for this user.' });
      }

      return res.status(200).json(podData);
    } catch (error) {
      console.error('Error in getMyPod:', error);
      return res.status(500).json({ error: 'Internal server error while fetching pod details.' });
    }
  }

  /**
   * Handles a member voluntarily leaving their carpool pod.
   */
  static async leavePod(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { podId } = req.body;

      if (!userId || !podId) {
        return res.status(400).json({ error: 'User ID and Pod ID are required.' });
      }

      await PodService.handleMemberDropout(podId, userId);
      return res.status(200).json({ message: 'Successfully left the carpool pod. Schedule updated.' });
    } catch (error) {
      console.error('Error in leavePod:', error);
      return res.status(500).json({ error: 'Internal server error while leaving the pod.' });
    }
  }

  /**
   * Triggers an SOS emergency for a breakdown, aborting the ride and alerting rescuers.
   */
  static async triggerSOS(req: AuthRequest, res: Response) {
    try {
      const { rideId, lat, lng } = req.body;

      if (!rideId || lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'Ride ID and coordinates (lat, lng) are required.' });
      }

      await RescueService.triggerSOS(rideId, lat, lng);
      return res.status(200).json({ message: 'SOS triggered. Nearby carpool drivers have been notified.' });
    } catch (error) {
      console.error('Error in triggerSOS:', error);
      return res.status(500).json({ error: 'Internal server error while triggering SOS.' });
    }
  }
}
