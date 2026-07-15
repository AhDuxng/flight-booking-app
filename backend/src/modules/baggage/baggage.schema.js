import { z } from 'zod';

export const baggageQuerySchema = z.object({
  flightId: z.string().uuid(),
});
