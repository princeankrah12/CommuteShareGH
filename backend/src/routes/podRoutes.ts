import { Router } from 'express';
import { PodController } from '../controllers/PodController';
import { LeaveController } from '../controllers/LeaveController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware globally to all pod routes
router.use(authMiddleware);

// GET Pod details
router.get('/my-pod', PodController.getMyPod);

// POST Actions
router.post('/leave', PodController.leavePod);
router.post('/sos', PodController.triggerSOS);
router.post('/leave/request', LeaveController.requestLeave);
router.post('/leave/guest/accept', LeaveController.acceptGuestInvite);

export default router;
