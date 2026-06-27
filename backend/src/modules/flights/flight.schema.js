import { z } from 'zod';

export const searchFlightsSchema = z.object({
  query: z.object({
    origin: z.string().min(1, 'Origin is required'), // IATA code or UUID
    destination: z.string().min(1, 'Destination is required'), // IATA code or UUID
    departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be in YYYY-MM-DD format'),
    passengers: z.coerce.number().int().positive().default(1),
    seat_class: z.enum(['economy', 'business', 'first']).optional().default('economy')
  })
});

export const getFlightByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid flight ID')
  })
});
