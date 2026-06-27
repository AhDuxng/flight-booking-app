import { z } from 'zod';

export const getSeatsSchema = z.object({
  query: z.object({
    flight_id: z.string().uuid('Invalid flight ID')
  })
});

export const holdSeatSchema = z.object({
  body: z.object({
    seat_id: z.string().uuid('Invalid seat ID'),
    booking_id: z.string().uuid('Invalid booking ID')
  })
});
