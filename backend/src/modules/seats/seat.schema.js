import { z } from 'zod';

export const seatQuerySchema = z.object({
  flightId: z.string().uuid(),
});

export const holdSeatSchema = z.object({
  bookingId: z.string().uuid(),
  seatId: z.string().uuid(),
});

export const seatParamsSchema = z.object({
  seatId: z.string().uuid(),
});
