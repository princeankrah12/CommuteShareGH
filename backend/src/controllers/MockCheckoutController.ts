import { Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';

export class MockCheckoutController {
  /**
   * Render the Mock Paystack HTML Interface
   */
  static renderCheckoutPage(req: Request, res: Response) {
    const { reference, amount, email } = req.query;

    if (!reference || !amount || !email) {
      return res.status(400).send('Missing query parameters for mock checkout');
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secure Checkout</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #eef1f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .checkout-box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; max-width: 400px; width: 100%; border-top: 5px solid #09a5db; }
        .logo { font-size: 24px; font-weight: bold; color: #1a202c; margin-bottom: 20px; }
        .amount { font-size: 36px; color: #09a5db; font-weight: 800; margin: 20px 0; }
        .email { color: #718096; font-size: 14px; margin-bottom: 30px; }
        .btn { background: #09a5db; color: white; border: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; transition: background 0.3s; }
        .btn:hover { background: #0784b1; }
        .btn:disabled { background: #cbd5e0; cursor: not-allowed; }
        #status { margin-top: 20px; font-weight: 600; color: #38a169; display: none; }
        .footer-text { margin-top: 20px; font-size: 12px; color: #a0aec0; }
      </style>
    </head>
    <body>
      <div class="checkout-box">
        <div class="logo">Mock Paystack Gateway</div>
        <div>You are paying CommuteShare Test</div>
        <div class="amount">GHS ${amount}</div>
        <div class="email">${email}</div>
        
        <form method="POST" action="/api/payments/mock-checkout/trigger">
          <input type="hidden" name="reference" value="${reference}">
          <input type="hidden" name="amount" value="${amount}">
          <input type="hidden" name="email" value="${email}">
          <button type="submit" class="btn">Pay Securely</button>
        </form>
        
        <div class="footer-text">This is a simulated Localhost E2E Payment Flow</div>
      </div>
    </body>
    </html>
    `;

    res.status(200).send(html);
  }

  /**
   * Internal proxy to hit the WebhookController without needing local Axios port configuration
   */
  static async triggerPaymentSuccess(req: Request, res: Response) {
    const { reference, amount, email } = req.body;

    try {
      // Hit the internal webhook endpoint natively bypassing network overhead
      logger.info(`[Paystack MOCK] Sending async webhook simulation for ${reference}...`);
      const { WalletService } = require('../services/WalletService');
      await WalletService.verifyTopUp(reference);

      const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background: #eef1f6; text-align: center; padding-top: 100px; color: #2d3748; }
          h2 { color: #38a169; }
          .container { background: white; padding: 40px; border-radius: 12px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>✅ Payment Successful!</h2>
          <p>The webhook has fired. You can now close this window and return to the CommuteShare app.</p>
        </div>
      </body>
      </html>
      `;

      res.status(200).send(successHtml);
    } catch (e: any) {
      logger.error('Failed to trigger mock webhook proxy: ' + e.message);
      res.status(500).send(`<h2>Error triggering Webhook: ${e.message}</h2>`);
    }
  }
}
