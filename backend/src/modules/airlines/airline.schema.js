import { z } from 'zod';

export const createAirlineSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Code must be at least 2 characters').max(5, 'Code must be at most 5 characters'),
    name: z.string().min(1, 'Name is required'),
    logo_url: z.string().url('Logo URL must be valid').optional().nullable(),
    country: z.string().optional().nullable(),
    is_active: z.boolean().default(true)
  })
});

export const updateAirlineSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid airline ID')
  }),
  body: z.object({
    code: z.string().min(2).max(5).optional(),
    name: z.string().min(1).optional(),
    logo_url: z.string().url().optional().nullable(),
    country: z.string().optional().nullable(),
    is_active: z.boolean().optional()
  })
});

export const getAirlineByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid airline ID')
  })
});
