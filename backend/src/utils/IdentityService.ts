import axios from 'axios';
import logger from './logger';

export class IdentityService {
  static async verifyGhanaCard(ghanaCardId: string, fullName: string, selfie?: string) {
    logger.info(`[IdentityService] Verifying identity for ${fullName} (ID: ${ghanaCardId})...`);

    const smileIdUrl = process.env.SMILE_ID_URL || 'https://api.smileidentity.com/v1/verify';

    try {
      const response = await axios.post(smileIdUrl, {
        ghanaCardId,
        fullName,
        selfie
      });
      return response.data;
    } catch (error: any) {
      logger.error('Identity Verification Error:', error.response?.data || error.message);
      if (error.response && error.response.data) {
        return error.response.data;
      }
      throw new Error('Connection to NIA database timed out. Please try again later.');
    }
  }
}
