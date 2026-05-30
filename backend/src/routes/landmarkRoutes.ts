import { Router } from 'express';
import { LandmarkController } from '../controllers/LandmarkController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/search', LandmarkController.search);
router.get('/nearest', LandmarkController.findNearest);

export default router;
