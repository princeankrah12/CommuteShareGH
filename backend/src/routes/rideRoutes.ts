import { Router } from 'express';
import { RideController } from '../controllers/RideController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { createRideSchema, searchRideSchema, bookRideSchema } from '../schemas/rideSchema';

const router = Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

router.post('/', validate(createRideSchema), RideController.create);
router.get('/search', validate(searchRideSchema), RideController.search);
router.post('/book', validate(bookRideSchema), RideController.book);
router.post('/resolve-address', RideController.resolveAddress);
router.post('/cancel/:rideId', RideController.cancelRide);
router.post('/mark-late', RideController.markLate);
router.post('/rate', RideController.rateRide);

export default router;
