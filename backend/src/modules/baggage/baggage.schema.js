import { z } from 'zod';

export const getBaggageOptionsSchema = z.object({
  query: z.object({
    flight_id: z.string().uuid('Invalid flight ID')
  })
});
