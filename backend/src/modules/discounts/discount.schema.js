import { z } from 'zod';

export const validateDiscountSchema = z.object({
  code: z.string().trim().min(2).max(30).toUpperCase(),
  orderValue: z.coerce.number().min(0).max(999999999),
});
