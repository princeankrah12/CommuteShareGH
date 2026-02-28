import { Router } from 'express';
import { VehicleController } from '../controllers/VehicleController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/register', VehicleController.register);
router.get('/me', VehicleController.getMyVehicle);
router.get('/my-vehicles', VehicleController.getMyVehicles);

export default router;
