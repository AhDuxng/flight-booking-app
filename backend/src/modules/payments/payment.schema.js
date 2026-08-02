import { z } from 'zod';

const providerSchema = z.enum(['vnpay', 'momo', 'stripe', 'cash']);

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
  provider: providerSchema,
});

export const paymentBookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const paymentIntentParamsSchema = z.object({ paymentId: z.string().uuid() });

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  transactionRef: z.string().trim().min(1).max(255),
});

const normalizedPaymentEvents = {
  'payment.succeeded': 'success',
  'payment.failed': 'failed',
  'payment.ignored': 'ignored',
};

export const paymentWebhookSchema = z
  .object({
    bookingId: z.string().uuid(),
    transactionRef: z.string().trim().min(1).max(255),
    provider: providerSchema,
    amount: z.coerce.number().positive().max(999999999),
    currency: z.string().trim().length(3).toUpperCase(),
    status: z.enum(['success', 'failed', 'ignored']),
    eventType: z.enum(Object.keys(normalizedPaymentEvents)),
  })
  .refine((payload) => normalizedPaymentEvents[payload.eventType] === payload.status, {
    path: ['eventType'],
    message: 'Payment event type does not match status',
  });
