import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Apply auth middleware to all user routes
router.use(authMiddleware);

router.get('/me', UserController.getMyProfile);
router.put('/me/fcm-token', UserController.updateFcmToken);

export default router;
