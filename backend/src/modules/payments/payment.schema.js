import { z } from 'zod';

const providerSchema = z.enum(['vnpay', 'momo', 'stripe', 'cash']);

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
  provider: providerSchema,
});

export const paymentBookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  transactionRef: z.string().trim().min(1).max(255),
});

export const paymentWebhookSchema = z.object({
  bookingId: z.string().uuid(),
  transactionRef: z.string().trim().min(1).max(255),
  provider: providerSchema,
  amount: z.coerce.number().positive().max(999999999),
  status: z.enum(['success', 'failed']),
});
