import { z } from 'zod';

const uuid = z.string().uuid();

export const bookingParamsSchema = z.object({ bookingId: uuid });
export const ticketParamsSchema = z.object({ ticketId: uuid });
export const checkInParamsSchema = z.object({ checkInId: uuid });
export const requestParamsSchema = z.object({ requestId: uuid });
export const refundParamsSchema = z.object({ refundId: uuid });
export const resourceParamsSchema = z.object({
  resource: z.enum(['routes', 'flight_schedules', 'fare_classes', 'refund_requests', 'support_tickets', 'cms_contents', 'ancillary_services', 'flight_status_events']),
});
export const resourceItemParamsSchema = resourceParamsSchema.extend({ id: uuid });

export const fareQuerySchema = z.object({ flightId: uuid });
export const setFareSchema = z.object({ fareId: uuid });
export const checkInSchema = z.object({
  passengerIds: z.array(uuid).min(1).max(9),
  documentConfirmed: z.literal(true),
  seatAssignments: z.array(z.object({ passengerId: uuid, seatId: uuid })).max(9).default([]),
});
export const changeOptionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const changeQuoteSchema = z.object({ newFlightId: uuid });
export const changeConfirmSchema = z.object({ provider: z.enum(['cash', 'vnpay', 'momo', 'stripe']).default('cash') });
export const contentQuerySchema = z.object({
  type: z.enum(['promotion', 'banner', 'faq', 'policy', 'news', 'terms']).optional(),
  slug: z.string().trim().min(1).max(160).optional(),
});
export const flightStatusQuerySchema = z.object({
  flightNumber: z.string().trim().min(2).max(20).transform((value) => value.replaceAll(' ', '').toUpperCase()),
  departureDate: z.string().date().optional(),
});
export const ancillaryPurchaseSchema = z.object({
  bookingId: uuid,
  passengerId: uuid.nullable().optional(),
  ancillaryServiceId: uuid,
  quantity: z.coerce.number().int().min(1).max(10).default(1),
  details: z.record(z.unknown()).default({}),
});
export const supportTicketSchema = z.object({
  bookingId: uuid.nullable().optional(),
  category: z.enum(['booking', 'payment', 'refund', 'baggage', 'flight_change', 'other']),
  subject: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});
export const supportMessageParamsSchema = z.object({ ticketId: uuid });
export const supportMessageSchema = z.object({ body: z.string().trim().min(1).max(5000) });
export const refundDecisionSchema = z.object({
  action: z.enum(['approve', 'reject']),
  approvedAmount: z.coerce.number().min(0).max(999999999).optional(),
  reason: z.string().trim().max(1000).optional(),
});
export const adminSupportMessageSchema = z.object({
  body: z.string().trim().min(1).max(5000),
  isInternal: z.boolean().default(false),
});
export const adminResourceBodySchema = z.record(z.unknown()).refine((value) => Object.keys(value).length > 0, 'Payload is required');
