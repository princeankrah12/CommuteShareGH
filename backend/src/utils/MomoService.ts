import logger from '../utils/logger';

export class MomoService {
  /**
   * Simulates an external API call to a MoMo provider (e.g., Paystack, Hubtel)
   */
  static async initiatePayment(phoneNumber: string, amount: number, reference: string) {
    logger.info(`[MomoService] Initiating GHS ${amount} payment request to ${phoneNumber}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real scenario, this would return a checkout URL or a request ID
    return {
      status: 'success',
      providerReference: `MOMO-EXT-${Math.random().toString(36).substring(7).toUpperCase()}`,
      message: 'Payment request sent to device'
    };
  }

  /**
   * Simulates checking the status of a transaction
   */
  static async verifyPayment(reference: string) {
    logger.info(`[MomoService] Verifying payment for reference ${reference}...`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For this simulation, we always return success
    return {
      status: 'SUCCESSFUL',
      amount: 0, // In real life, verify the amount matches
    };
  }
}
