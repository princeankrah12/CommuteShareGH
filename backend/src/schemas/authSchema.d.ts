import { z } from 'zod';
export declare const signupSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        fullName: z.ZodString;
        phoneNumber: z.ZodString;
        appliedReferralCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const verifyGhanaCardSchema: z.ZodObject<{
    body: z.ZodObject<{
        ghanaCardId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const verifyWorkEmailSchema: z.ZodObject<{
    body: z.ZodObject<{
        workEmail: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=authSchema.d.ts.map