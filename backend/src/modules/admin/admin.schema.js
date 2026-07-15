import { z } from 'zod';

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminBookingQuerySchema = adminListQuerySchema.extend({
  status: z.enum(['pending', 'paid', 'confirmed', 'cancelled', 'refund_pending', 'refunded']).optional(),
});
