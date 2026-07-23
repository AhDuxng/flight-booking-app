import { z } from 'zod';

export const createAirportSchema = z.object({
  code: z.string().trim().length(3).toUpperCase(),
  name: z.string().trim().min(1).max(150),
  city: z.string().trim().min(1).max(100),
  country: z.string().trim().min(2).max(100),
  timezone: z.string().trim().min(1).max(100).default('Asia/Ho_Chi_Minh'),
});

export const updateAirportSchema = createAirportSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');

export const airportCodeParamsSchema = z.object({
  code: z.string().trim().length(3).toUpperCase(),
});

export const airportParamsSchema = z.object({
  airportId: z.string().uuid(),
});
