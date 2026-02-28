import { z } from 'zod';

export const topUpSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    reference: z.string().min(5),
  }),
});
