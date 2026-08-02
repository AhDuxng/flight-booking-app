import { z } from 'zod';

export const seatQuerySchema = z.object({
  flightId: z.string().uuid(),
});
