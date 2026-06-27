import { z } from 'zod';

export const getLogsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().default(20),
    offset: z.coerce.number().int().nonnegative().default(0)
  })
});
