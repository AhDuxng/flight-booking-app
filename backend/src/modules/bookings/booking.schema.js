import { z } from 'zod';

export const calculatePassengerAge = (dateOfBirth, today = new Date()) => {
  const birthDate = new Date(`${dateOfBirth}T00:00:00Z`);
  if (!Number.isFinite(birthDate.getTime())) return null;
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasNotHadBirthday =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() &&
      today.getUTCDate() < birthDate.getUTCDate());
  if (hasNotHadBirthday) age -= 1;
  return age;
};

const passengerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    dateOfBirth: z.string().date(),
    gender: z.enum(['male', 'female', 'other']),
    nationality: z.string().trim().min(2).max(100),
    passportNumber: z.string().trim().min(4).max(30).nullable().optional(),
    passengerType: z.enum(['adult', 'child', 'infant']).default('adult'),
  })
  .superRefine((passenger, context) => {
    const age = calculatePassengerAge(passenger.dateOfBirth);
    if (age == null || age < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message: 'Date of birth cannot be in the future',
      });
      return;
    }
    const validAge =
      passenger.passengerType === 'adult'
        ? age >= 18
        : passenger.passengerType === 'child'
          ? age >= 2 && age < 18
          : age < 2;
    if (!validAge) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateOfBirth'],
        message:
          passenger.passengerType === 'adult'
            ? 'Adult passengers must be at least 18 years old'
            : 'Date of birth does not match passenger type',
      });
    }
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

const ancillarySelectionSchema = z.object({
  passengerIndex: z.number().int().min(0).nullable().optional(),
  ancillaryServiceId: z.string().uuid(),
  quantity: z.number().int().min(1).max(10).default(1),
  details: z.record(z.unknown()).default({}),
});

export const createBookingSchema = z
  .object({
    flightId: z.string().uuid(),
    contactEmail: z.string().trim().email().max(254).toLowerCase(),
    contactPhone: z.string().trim().min(8).max(20).nullable().optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    passengers: z.array(passengerSchema).min(1).max(9),
    seatIds: z.array(z.string().uuid()).min(1).max(9),
    baggage: z.array(baggageSelectionSchema).max(20).default([]),
    meals: z.array(mealSelectionSchema).max(30).default([]),
    ancillaries: z.array(ancillarySelectionSchema).max(30).default([]),
    discountCode: z.string().trim().min(2).max(30).toUpperCase().nullable().optional(),
    fareId: z.string().uuid(),
  })
  .superRefine((value, context) => {
    if (value.passengers.length !== value.seatIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seatIds'],
        message: 'Each passenger needs one seat',
      });
    }

    if (new Set(value.seatIds).size !== value.seatIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['seatIds'],
        message: 'Seats must be unique',
      });
    }

    for (const [index, item] of [
      ...value.baggage,
      ...value.meals,
      ...value.ancillaries,
    ].entries()) {
      if (item.passengerIndex != null && item.passengerIndex >= value.passengers.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index],
          message: 'Passenger selection is invalid',
        });
      }
    }
  });

export const bookingQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'refund_pending', 'refunded']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const bookingParamsSchema = z.object({
  bookingId: z.string().uuid(),
});
