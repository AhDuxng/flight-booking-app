import { z } from 'zod';

export const processPaymentSchema = z.object({
  body: z.object({
    booking_id: z.string().uuid('Invalid booking ID'),
    provider: z.enum(['vnpay', 'momo', 'stripe', 'cash']).default('cash'),
    amount: z.number().positive('Amount must be positive')
  })
});
