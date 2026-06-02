import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { SmileWebhookController } from '../controllers/SmileWebhookController';
import express from 'express';

const router = Router();

// Paystack and MoMo webhooks
router.post(
  '/payments',
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  }),
  WebhookController.handlePaymentWebhook
);

// Smile Identity Webhook (Callbacks)
router.post('/smile', express.json(), SmileWebhookController.handleCallback);

export default router;
