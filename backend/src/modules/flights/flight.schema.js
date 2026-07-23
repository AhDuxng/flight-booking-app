import { z } from 'zod';

const flightStatuses = ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'];

const dateTimeSchema = z.string().datetime({ offset: true });

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid IANA timezone');

export const flightSearchSchema = z
  .object({
    originAirportId: z.string().uuid().optional(),
    destinationAirportId: z.string().uuid().optional(),
    departureDate: z.string().date().optional(),
    departureTimezone: timezoneSchema.optional(),
    airlineId: z.string().uuid().optional(),
    cabinClass: z.enum(['economy', 'business', 'first']).optional(),
    passengerCount: z.coerce.number().int().min(1).max(9).default(1),
    status: z.enum(flightStatuses).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .superRefine((value, context) => {
    if (value.originAirportId && value.originAirportId === value.destinationAirportId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destinationAirportId'],
        message: 'Origin and destination must differ',
      });
    }
  });

export const flightParamsSchema = z.object({
  flightId: z.string().uuid(),
});

const flightInputSchema = z.object({
  airlineId: z.string().uuid(),
  aircraftId: z.string().uuid(),
  originAirportId: z.string().uuid(),
  destinationAirportId: z.string().uuid(),
  flightNumber: z.string().trim().min(2).max(12).toUpperCase(),
  departureTime: dateTimeSchema,
  arrivalTime: dateTimeSchema,
  basePrice: z.coerce.number().min(0).max(999999999),
  status: z.enum(flightStatuses).default('scheduled'),
  seats: z
    .array(
      z.object({
        seatNumber: z.string().trim().min(1).max(8).toUpperCase(),
        seatClass: z.enum(['economy', 'business', 'first']).default('economy'),
        price: z.coerce.number().min(0).max(999999999),
      }),
    )
    .min(1)
    .max(1000)
    .optional(),
});

export const createFlightSchema = flightInputSchema.superRefine((value, context) => {
  if (value.originAirportId === value.destinationAirportId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['destinationAirportId'],
      message: 'Origin and destination must differ',
    });
  }

  if (new Date(value.arrivalTime) <= new Date(value.departureTime)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['arrivalTime'],
      message: 'Arrival must be after departure',
    });
  }
  if (
    ['scheduled', 'delayed'].includes(value.status) &&
    new Date(value.departureTime) <= new Date()
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['departureTime'],
      message: 'Sellable flights must depart in the future',
    });
  }
});

export const updateFlightSchema = flightInputSchema
  .omit({ seats: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');
