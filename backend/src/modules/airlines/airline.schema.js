import { z } from 'zod';

export const createAirlineSchema = z.object({
  code: z.string().trim().min(2).max(10).toUpperCase(),
  name: z.string().trim().min(1).max(100),
  logoUrl: z.string().url().nullish(),
  country: z.string().trim().min(2).max(100).nullish(),
  isActive: z.boolean().default(true),
});

export const updateAirlineSchema = createAirlineSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const airlineParamsSchema = z.object({
  airlineId: z.string().uuid(),
});
