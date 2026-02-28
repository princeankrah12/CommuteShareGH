import { z } from 'zod';
export declare const topUpSchema: z.ZodObject<{
    body: z.ZodObject<{
        amount: z.ZodNumber;
        reference: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=walletSchema.d.ts.map