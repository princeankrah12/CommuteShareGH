import axios from 'axios';
import logger from '../utils/logger';

const MOMO_URL = process.env.MOMO_URL || 'http://localhost:4000/api/momo';
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

export class MomoService {
  /**
   * Initiates an external API call to a MoMo provider.
   */
  static async initiatePayment(phoneNumber: string, amount: number, reference: string) {
    logger.info(`[MomoService] Initiating GHS ${amount} payment request to ${phoneNumber}...`);
    
    if (USE_MOCK_DATA) {
      return { status: 'success', message: 'Mock payment initiated' };
    }

    try {
      const response = await axios.post(`${MOMO_URL}/initiate`, {
        phoneNumber,
        amount,
        reference
      });
      return response.data;
    } catch (error: any) {
      logger.error('MomoService initiatePayment Error:', error.message);
      throw new Error('Failed to initiate MoMo payment');
    }
  }

  /**
   * Checks the status of a transaction
   */
  static async verifyPayment(reference: string) {
    logger.info(`[MomoService] Verifying payment for reference ${reference}...`);
    
    if (USE_MOCK_DATA) {
      if (reference.includes('FAIL') || reference.includes('fail')) {
        return { status: 'FAILED' };
      }
      return { status: 'SUCCESSFUL' };
    }

    try {
      const response = await axios.get(`${MOMO_URL}/verify/${reference}`);
      return response.data;
    } catch (error: any) {
      logger.error('MomoService verifyPayment Error:', error.message);
      throw new Error('Failed to verify MoMo payment');
    }
  }
}
