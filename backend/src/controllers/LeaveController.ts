import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { LeaveService } from '../services/LeaveService';

export class LeaveController {
  /**
   * Processes a leave request, updating the user's profile and the pod schedule.
   */
  static async requestLeave(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.body;

      if (!userId || !startDate || !endDate) {
        return res.status(400).json({ error: 'User ID and leave dates (start, end) are required.' });
      }

      await LeaveService.requestLeave(userId, new Date(startDate), new Date(endDate));
      return res.status(200).json({ message: 'Leave request processed successfully. Pod schedule updated.' });
    } catch (error) {
      console.error('Error in requestLeave:', error);
      return res.status(500).json({ error: 'Internal server error while requesting leave.' });
    }
  }

  /**
   * Accepts a guest invite, making the authenticated user a temporary replacement member.
   */
  static async acceptGuestInvite(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { podId, endDate } = req.body;

      if (!userId || !podId || !endDate) {
        return res.status(400).json({ error: 'User ID, Pod ID, and end date are required.' });
      }

      await LeaveService.acceptGuestInvite(userId, podId, new Date(endDate));
      return res.status(200).json({ message: 'Successfully joined the carpool pod as a guest rider.' });
    } catch (error) {
      console.error('Error in acceptGuestInvite:', error);
      return res.status(500).json({ error: 'Internal server error while accepting guest invite.' });
    }
  }
}
