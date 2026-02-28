import logger from './logger';

export class IdentityService {
  /**
   * Simulates an API call to the NIA (National Identification Authority) via a 3rd party like Margins Group or similar.
   */
  static async verifyGhanaCard(ghanaCardId: string, fullName: string, selfie?: string) {
    logger.info(`[IdentityService] Verifying identity for ${fullName} (ID: ${ghanaCardId})...`);

    // Simulate network delay for external API
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simple validation logic for simulation
    const isValidFormat = /^GHA-\d{9}-\d$/.test(ghanaCardId);
    
    if (!isValidFormat) {
      return {
        status: 'FAILED',
        reason: 'Invalid Ghana Card ID format. Expected GHA-XXXXXXXXX-X',
      };
    }

    // Simulation: Fail if ID ends in 0 (just to show error handling in UI)
    if (ghanaCardId.endsWith('0')) {
      return {
        status: 'FAILED',
        reason: 'Identity mismatch. The provided name does not match the record for this ID.',
      };
    }

    // Simulate AI Face Match (90% - 99% for success)
    const faceMatchScore = 90 + Math.random() * 9;

    return {
      status: 'SUCCESS',
      faceMatchScore: parseFloat(faceMatchScore.toFixed(2)),
      data: {
        dob: '1990-05-15',
        nationality: 'Ghanaian',
        expiryDate: '2030-01-01',
      }
    };
  }
}
