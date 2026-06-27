import { z } from 'zod';

export const getPassengerByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid passenger ID')
  })
});
