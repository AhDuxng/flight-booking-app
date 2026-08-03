import { z } from 'zod';

export const mealQuerySchema = z.object({
  flightId: z.string().uuid(),
});
