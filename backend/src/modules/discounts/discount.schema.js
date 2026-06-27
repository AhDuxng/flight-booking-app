import { z } from 'zod';

export const validateDiscountSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Discount code is required'),
    order_value: z.number().nonnegative('Order value must be positive or zero')
  })
});
