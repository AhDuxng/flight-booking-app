import { z } from 'zod';

export const markReadSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid notification ID')
  })
});
