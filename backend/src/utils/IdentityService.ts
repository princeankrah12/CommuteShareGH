import axios from 'axios';
import logger from './logger';

export class IdentityService {
  static async verifyGhanaCard(ghanaCardId: string, fullName: string, selfie?: string) {
    logger.info(`[IdentityService] Mock Verifying identity for ${fullName} (ID: ${ghanaCardId})...`);

    // Validate format: GHA-XXXXXXXXX-X
    const ghanaCardRegex = /^GHA-\d{9}-\d$/;
    if (!ghanaCardRegex.test(ghanaCardId)) {
      throw new Error('Invalid Ghana Card ID format');
    }

    // Magic ID scenarios
    if (ghanaCardId === 'GHA-222222222-2') {
      return {
        status: 'FAILED',
        reason: 'Biometric mismatch'
      };
    }

    // Default mock success (e.g. for GHA-111111111-1 or any other valid format)
    return {
      status: 'SUCCESS',
      faceMatchScore: 95.0,
      data: {
        ResultCode: '1012',
        ResultText: 'ID Number Validated'
      }
    };
  }
}
