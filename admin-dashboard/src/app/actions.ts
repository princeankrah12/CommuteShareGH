'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { VerificationStatus } from '@commuteshare/shared';

/**
 * Server Action: Process Verification
 * Handles the logic for approving or rejecting a Ghana Card verification.
 * Benefits: 
 * 1. Executes on the server (hides API keys/internal URLs)
 * 2. Instant UI revalidation
 */
export async function processVerificationAction(id: string, status: VerificationStatus) {
  try {
    // 1. Call the backend API
    await api.verificationAction(id, status as any);

    // 2. Clear the cache for the verifications page so it shows fresh data
    revalidatePath('/verifications');
    
    return { success: true };
  } catch (error) {
    console.error('Failed to process verification:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}

/**
 * Server Action: Process Payout
 */
export async function processPayoutAction(id: string, status: 'APPROVED' | 'REJECTED') {
  try {
    await api.payoutAction(id, status);
    revalidatePath('/financials');
    return { success: true };
  } catch (error) {
    console.error('Failed to process payout:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}
