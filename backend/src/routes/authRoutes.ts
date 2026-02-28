import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validateMiddleware';
import { signupSchema, verifyGhanaCardSchema, verifyWorkEmailSchema } from '../schemas/authSchema';

const router = Router();

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/google-login', AuthController.googleLogin);

// Protected routes
router.get('/me', authMiddleware, AuthController.getCurrentUser);
router.post('/verify-identity', authMiddleware, validate(verifyGhanaCardSchema), AuthController.verifyGhanaCard);
router.post('/verify-work', authMiddleware, validate(verifyWorkEmailSchema), AuthController.verifyWorkEmail);
router.get('/profile/:userId', authMiddleware, AuthController.getProfile);

export default router;
