import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    fullName: z.string().min(2),
    phoneNumber: z.string().min(10),
    appliedReferralCode: z.string().optional(),
  }),
});

export const verifyGhanaCardSchema = z.object({
  body: z.object({
    ghanaCardId: z.string().regex(/^GHA-\d{9}-\d$/, 'Invalid Ghana Card format (e.g., GHA-123456789-0)'),
    selfie: z.string().optional(), // Base64 encoded selfie image
  }),
});

export const verifyWorkEmailSchema = z.object({
  body: z.object({
    workEmail: z.string().email(),
  }),
});
