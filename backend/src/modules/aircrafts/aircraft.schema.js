import { z } from 'zod';

export const createAircraftSchema = z.object({
  body: z.object({
    airline_id: z.string().uuid('Invalid airline ID'),
    code: z.string().min(1, 'Code is required'),
    model: z.string().min(1, 'Model is required'),
    total_seats: z.number().int().positive('Total seats must be a positive integer')
  })
});

export const updateAircraftSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid aircraft ID')
  }),
  body: z.object({
    airline_id: z.string().uuid().optional(),
    code: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    total_seats: z.number().int().positive().optional()
  })
});

export const getAircraftByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid aircraft ID')
  })
});
