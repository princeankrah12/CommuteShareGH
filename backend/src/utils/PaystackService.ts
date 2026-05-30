import axios from 'axios';
import logger from './logger';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_key';
const PAYSTACK_BASE_URL = process.env.PAYSTACK_URL || 'https://api.paystack.co';
const PAYSTACK_INIT_URL = `${PAYSTACK_BASE_URL}/transaction/initialize`;
const PAYSTACK_VERIFY_URL = `${PAYSTACK_BASE_URL}/transaction/verify`;
export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export class PaystackService {
  /**
   * Initializes a Paystack transaction
   */
  static async initializeTransaction(email: string, amountGHS: number): Promise<PaystackInitializeResponse> {
    try {
      const amountInPesewas = Math.round(amountGHS * 100);
      const response = await axios.post(
        PAYSTACK_INIT_URL,
        {
          amount: amountInPesewas,
          email: email,
          currency: 'GHS',
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      logger.error('Paystack Initialization Error:', error.response?.data || error.message);
      throw new Error('Failed to initialize payment with Paystack');
    }
  }

  /**
   * Verifies a Paystack transaction
   */
  static async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(`${PAYSTACK_VERIFY_URL}/${reference}`, {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error('Paystack Verification Error:', error.response?.data || error.message);
      throw new Error('Failed to verify payment with Paystack');
    }
  }
}
