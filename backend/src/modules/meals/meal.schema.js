import { z } from 'zod';

export const getMealOptionsSchema = z.object({
  query: z.object({
    flight_id: z.string().uuid('Invalid flight ID')
  })
});
