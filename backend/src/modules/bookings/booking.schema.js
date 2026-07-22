import { z } from 'zod';

const passengerSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  dateOfBirth: z.string().date(),
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().trim().min(2).max(100),
  passportNumber: z.string().trim().min(4).max(30).nullable().optional(),
  passengerType: z.enum(['adult', 'child', 'infant']).default('adult'),
}).refine((passenger) => new Date(`${passenger.dateOfBirth}T00:00:00Z`) <= new Date(), {
  path: ['dateOfBirth'],
  message: 'Date of birth cannot be in the future',
});

const baggageSelectionSchema = z.object({
  passengerIndex: z.number().int().min(0),
  baggageOptionId: z.string().uuid(),
  quantity: z.number().int().min(1).max(5).default(1),
});

const mealSelectionSchema = z.object({
  passengerIndex: z.number().int().min(0),
  mealOptionId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10).default(1),
});

export const createBookingSchema = z.object({
  flightId: z.string().uuid(),
  contactEmail: z.string().trim().email().max(254).toLowerCase(),
  contactPhone: z.string().trim().min(8).max(20).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  passengers: z.array(passengerSchema).min(1).max(9),
  seatIds: z.array(z.string().uuid()).min(1).max(9),
  baggage: z.array(baggageSelectionSchema).max(20).default([]),
  meals: z.array(mealSelectionSchema).max(30).default([]),
  discountCode: z.string().trim().min(2).max(30).toUpperCase().nullable().optional(),
}).superRefine((value, context) => {
  if (value.passengers.length !== value.seatIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['seatIds'], message: 'Each passenger needs one seat' });
  }

  if (new Set(value.seatIds).size !== value.seatIds.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['seatIds'], message: 'Seats must be unique' });
  }

  for (const [index, item] of [...value.baggage, ...value.meals].entries()) {
    if (item.passengerIndex >= value.passengers.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [index], message: 'Passenger selection is invalid' });
    }
  }
});

export const bookingQuerySchema = z.object({
  status: z.enum(['pending', 'paid', 'confirmed', 'cancelled', 'refund_pending', 'refunded']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const bookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});
