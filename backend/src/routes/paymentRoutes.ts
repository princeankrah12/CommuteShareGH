import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { MockCheckoutController } from '../controllers/MockCheckoutController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Route to initialize payment (Requires Authentication)
router.post('/initialize', authMiddleware, PaymentController.initializeTopUp);

// Webhook for Paystack status updates (NO Authentication, Paystack calls this directly)
// Use raw request body if required for HMAC signature verification
router.post('/webhook', PaymentController.paystackWebhook);

// Dev Mock URLs
router.get('/mock-checkout', MockCheckoutController.renderCheckoutPage);
router.post('/mock-checkout/trigger', MockCheckoutController.triggerPaymentSuccess);

export default router;
