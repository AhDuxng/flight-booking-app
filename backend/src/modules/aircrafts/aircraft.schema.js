import { z } from 'zod';

export const createAircraftSchema = z.object({
  airlineId: z.string().uuid(),
  code: z.string().trim().min(1).max(20).toUpperCase(),
  model: z.string().trim().min(1).max(100),
  totalSeats: z.number().int().min(1).max(1000),
});

export const updateAircraftSchema = createAircraftSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'At least one field is required',
);

export const aircraftParamsSchema = z.object({
  aircraftId: z.string().uuid(),
});
