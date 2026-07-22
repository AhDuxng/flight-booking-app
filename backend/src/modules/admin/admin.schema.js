import { z } from 'zod';

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminBookingQuerySchema = adminListQuerySchema.extend({
  status: z.enum(['pending', 'paid', 'confirmed', 'cancelled', 'refund_pending', 'refunded']).optional(),
});

export const adminUserParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const adminBookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});

export const adminReviewParamsSchema = z.object({
  reviewId: z.string().uuid(),
});

export const moderateReviewSchema = z.object({
  isVisible: z.boolean(),
});

export const adminPaymentParamsSchema = z.object({
  paymentId: z.string().uuid(),
});

export const processCashPaymentSchema = z.object({
  status: z.enum(['success', 'failed']),
});
