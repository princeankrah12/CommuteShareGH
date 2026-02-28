import logger from './logger';

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
   * Simulates the Paystack Transaction Initialize API
   */
  static async initializeTransaction(email: string, amountGHS: number): Promise<PaystackInitializeResponse> {
    logger.info(`[Paystack] Initializing transaction for ${email} (GHS ${amountGHS})...`);
    
    // Convert to Kobo/Pesewas for simulation (Paystack uses smallest currency unit)
    const amountInPesewas = amountGHS * 100;

    await new Promise(resolve => setTimeout(resolve, 800));

    const reference = `CSGH-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

    return {
      status: true,
      message: "Authorization URL created",
      data: {
        authorization_url: `https://checkout.paystack.com/${Math.random().toString(36).substring(7)}`,
        access_code: Math.random().toString(36).substring(7),
        reference
      }
    };
  }

  /**
   * Simulates the Paystack Transaction Verify API
   */
  static async verifyTransaction(reference: string) {
    logger.info(`[Paystack] Verifying transaction: ${reference}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simulation logic: References ending in 'FAIL' will fail
    if (reference.endsWith('FAIL')) {
      return {
        status: false,
        message: "Transaction not found",
      };
    }

    return {
      status: true,
      data: {
        status: "success",
        amount: 5000, // Example: 50.00 GHS in pesewas
        currency: "GHS",
        gateway_response: "Successful",
        channel: "mobile_money"
      }
    };
  }
}
