import { z } from 'zod';

export const createAirportSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Code must be exactly 3 characters').max(3, 'Code must be exactly 3 characters'),
    name: z.string().min(1, 'Name is required'),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    timezone: z.string().default('Asia/Ho_Chi_Minh')
  })
});

export const updateAirportSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid airport ID')
  }),
  body: z.object({
    code: z.string().min(3).max(3).optional(),
    name: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    timezone: z.string().optional()
  })
});

export const getAirportByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid airport ID')
  })
});
