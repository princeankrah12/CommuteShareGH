import { WebApi, Signature } from 'smile-identity-core';
import logger from '../utils/logger';

const PARTNER_ID = process.env.SMILE_PARTNER_ID || '';
const API_KEY = process.env.SMILE_API_KEY || '';
const SID_SERVER = process.env.SMILE_SID_SERVER || '0'; // 0 for sandbox, 1 for production

export interface SmileVerificationResult {
  status: 'SUCCESS' | 'FAILED';
  faceMatchScore?: number;
  reason?: string;
  data?: any;
}

/**
 * Service to handle integration with Smile Identity for biometric KYC and 
 * identity verification using the Ghana Card.
 */
export class SmileIdentityService {
  // Initialize the Smile Identity WebApi connection
  // Version 2.0.0 constructor: (partner_id, default_callback, api_key, sid_server)
  private static connection = new WebApi(PARTNER_ID, null, API_KEY, SID_SERVER);

  /**
   * Verifies the signature of an incoming Smile ID webhook request.
   */
  static verifySignature(timestamp: string, signature: string): boolean {
    const sigObj = new Signature(PARTNER_ID, API_KEY);
    const generatedSignature = sigObj.generate_signature(timestamp);
    return generatedSignature.signature === signature;
  }

  /**
   * Performs a Biometric KYC check (Job Type 1).
   * This validates the user's Ghana Card ID against the official database 
   * and performs a face match against the provided selfie.
   * 
   * @param userId The unique ID of the user in our system
   * @param ghanaCardId The raw Ghana Card number (e.g., GHA-712345678-9)
   * @param selfieBase64 The base64 encoded selfie image
   */
  static async verifyGhanaCardBiometric(
    userId: string, 
    ghanaCardId: string, 
    selfieBase64: string
  ): Promise<SmileVerificationResult> {
    const jobId = `job_kyc_${userId}_${Date.now()}`;
    
    // Remove metadata prefix if present in base64 string
    const cleanSelfie = selfieBase64.replace(/^data:image\/\w+;base64,/, '');

    const payload = {
      user_id: userId,
      job_id: jobId,
      job_type: 1, // Job Type 1 is Biometric KYC
      id_info: {
        id_number: ghanaCardId,
        id_type: 'GHANA_CARD',
        country: 'GH'
      },
      images: [
        {
          image_type_id: 2, // 2 indicates a selfie image
          image: cleanSelfie
        }
      ]
    };

    try {
      logger.info(`[SmileIdentityService] Submitting Biometric KYC for user ${userId}, Job ID: ${jobId}`);
      
      // submit_job handles the timestamp and signature generation internally
      const result = await this.connection.submit_job(payload);

      // Smile ID Result Codes: 1012 is "Approved", 1013 is "Rejected"
      // Reference: https://docs.usesmileid.com/integration-options/web-api/result-codes
      if (result.result.ResultCode === '1012') {
        logger.info(`[SmileIdentityService] Verification SUCCESS for user ${userId}. Confidence: ${result.result.ConfidenceScore}`);
        return {
          status: 'SUCCESS',
          faceMatchScore: parseFloat(result.result.ConfidenceScore),
          data: result.result
        };
      } else {
        const failureReason = result.result.ResultText || 'Identity verification failed';
        logger.warn(`[SmileIdentityService] Verification FAILED for user ${userId}: ${failureReason} (Code: ${result.result.ResultCode})`);
        return {
          status: 'FAILED',
          reason: failureReason,
          data: result.result
        };
      }
    } catch (error: any) {
      logger.error(`[SmileIdentityService] Critical Error submitting job to Smile ID: ${error.message}`);
      return {
        status: 'FAILED',
        reason: 'Internal verification service error. Please try again later.',
      };
    }
  }

  /**
   * Performs an Enhanced Document Verification (Job Type 6).
   * Used when we need to verify the physical document itself + biometrics.
   */
  static async verifyGhanaCardDocument(
    userId: string,
    ghanaCardId: string,
    selfieBase64: string,
    idFrontBase64: string
  ): Promise<SmileVerificationResult> {
    const jobId = `job_doc_${userId}_${Date.now()}`;
    
    const payload = {
      user_id: userId,
      job_id: jobId,
      job_type: 6, // Job Type 6 is Enhanced Document Verification
      id_info: {
        id_number: ghanaCardId,
        id_type: 'GHANA_CARD',
        country: 'GH'
      },
      images: [
        {
          image_type_id: 2, // Selfie
          image: selfieBase64.replace(/^data:image\/\w+;base64,/, '')
        },
        {
          image_type_id: 3, // ID Card Front
          image: idFrontBase64.replace(/^data:image\/\w+;base64,/, '')
        }
      ]
    };

    try {
      logger.info(`[SmileIdentityService] Submitting Document Verification for user ${userId}`);
      const result = await this.connection.submit_job(payload);

      if (result.result.ResultCode === '1012') {
        return {
          status: 'SUCCESS',
          faceMatchScore: parseFloat(result.result.ConfidenceScore),
          data: result.result
        };
      } else {
        return {
          status: 'FAILED',
          reason: result.result.ResultText || 'Document verification failed',
          data: result.result
        };
      }
    } catch (error: any) {
      logger.error(`[SmileIdentityService] Error: ${error.message}`);
      return { status: 'FAILED', reason: 'Service unavailable' };
    }
  }
}
